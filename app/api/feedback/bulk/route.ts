/*
 * Copyright (c) 2026 Nexttylabs Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback, statusHistory } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { getOrgContext } from "@/lib/auth/org-context";
import {
  canDeleteFeedback,
  canEditFeedback,
  canUpdateFeedbackStatus,
  type UserRole,
} from "@/lib/auth/permissions";
import { apiError } from "@/lib/api/errors";
import { FeedbackStatusEnum } from "@/lib/validations/feedback";
import { priorityEnum } from "@/lib/validators/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("updateStatus"),
    ids: z.array(z.number().int()).min(1),
    status: FeedbackStatusEnum,
  }),
  z.object({
    action: z.literal("updatePriority"),
    ids: z.array(z.number().int()).min(1),
    priority: priorityEnum,
  }),
  z.object({
    action: z.literal("delete"),
    ids: z.array(z.number().int()).min(1),
  }),
]);

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    let context;
    try {
      context = await getOrgContext({
        request: req,
        db,
        userId: session.user.id,
        requireMembership: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Missing organization") {
        return NextResponse.json(
          { error: "Organization ID is required", code: "MISSING_ORG_ID" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const memberRole = context.memberRole as UserRole | null;
    if (!memberRole) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const ids = payload.ids;

    const existing = await db
      .select({
        feedbackId: feedback.feedbackId,
        status: feedback.status,
      })
      .from(feedback)
      .where(
        and(
          inArray(feedback.feedbackId, ids),
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt),
        ),
      );

    if (payload.action === "updateStatus") {
      if (!canUpdateFeedbackStatus(memberRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }

      await db
        .update(feedback)
        .set({ status: payload.status, updatedAt: new Date() })
        .where(
          and(
            inArray(feedback.feedbackId, ids),
            eq(feedback.organizationId, context.organizationId),
            isNull(feedback.deletedAt),
          ),
        );

      const historyRows = existing
        .filter((row) => row.status !== payload.status)
        .map((row) => ({
          feedbackId: row.feedbackId,
          oldStatus: row.status,
          newStatus: payload.status,
          changedBy: session.user.id,
          comment: null,
        }));

      if (historyRows.length > 0) {
        await db.insert(statusHistory).values(historyRows);
      }

      return NextResponse.json({ updatedCount: historyRows.length });
    }

    if (payload.action === "updatePriority") {
      if (!canEditFeedback(memberRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }

      await db
        .update(feedback)
        .set({ priority: payload.priority, updatedAt: new Date() })
        .where(
          and(
            inArray(feedback.feedbackId, ids),
            eq(feedback.organizationId, context.organizationId),
            isNull(feedback.deletedAt),
          ),
        );

      return NextResponse.json({ updatedCount: existing.length });
    }

    if (!canDeleteFeedback(memberRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await db
      .update(feedback)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          inArray(feedback.feedbackId, ids),
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt),
        ),
      );

    return NextResponse.json({ updatedCount: existing.length });
  } catch (error) {
    return apiError(error);
  }
}
