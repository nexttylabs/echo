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
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback, statusHistory } from "@/lib/db/schema";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { buildGetFeedbackHandler } from "./handler";
import { auth } from "@/lib/auth/config";
import {
  canUpdateFeedbackStatus,
  canDeleteFeedback,
  type UserRole,
  canEditFeedback,
} from "@/lib/auth/permissions";
import { updateFeedbackStatusSchema } from "@/lib/validations/feedback";
import { apiError } from "@/lib/api/errors";
import { notifyStatusChange } from "@/lib/services/notifications";
import { handleFeedbackStatusChange } from "@/lib/services/feedback-status-change-handler";
import { updateFeedbackSchema } from "@/lib/validators/feedback";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return req.headers.get("x-client-ip") || "unknown";
}

function generateVisitorId(ip: string, userAgent: string | null): string {
  const raw = `${ip}-${userAgent || "unknown"}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const database = db;

  const params = await ctx.params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  const visitorId = generateVisitorId(clientIp, userAgent);

  let context;
  try {
    context = await getOrgContext({
      request: req as NextRequest,
      db: database,
      userId,
      requireMembership: !!userId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Missing organization") {
        return NextResponse.json(
          { error: "Organization ID is required", code: "MISSING_ORG_ID" },
          { status: 400 },
        );
      }
      if (error.message === "Access denied") {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }
    return apiError(error);
  }

  const handler = buildGetFeedbackHandler({
    getFeedbackById: async (id) => {
      const result = await getFeedbackById(database, id, {
        userId,
        visitorId: userId ? null : visitorId,
      });

      if (!result || "deleted" in result) {
        return result;
      }

      if (result.feedback.organizationId !== context.organizationId) {
        return null;
      }

      return result;
    },
  });

  return handler(req, { params });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const { id } = await ctx.params;
    const feedbackId = parseInt(id);

    if (isNaN(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
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
    if (!memberRole || !canUpdateFeedbackStatus(memberRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validationResult = updateFeedbackStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { status: newStatus, comment } = validationResult.data;

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        status: feedback.status,
        organizationId: feedback.organizationId,
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (existingFeedback.status === newStatus) {
      return NextResponse.json(
        { error: "Status is already set to this value", code: "NO_CHANGE" },
        { status: 400 },
      );
    }

    const [updatedFeedback] = await db
      .update(feedback)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, feedbackId))
      .returning();

    await db.insert(statusHistory).values({
      feedbackId,
      oldStatus: existingFeedback.status,
      newStatus,
      changedBy: session.user.id,
      comment: comment ?? null,
    });

    notifyStatusChange(feedbackId, existingFeedback.status, newStatus).catch(
      (err) => console.error("Failed to send status change notification:", err),
    );

    // Sync status change to GitHub if configured
    handleFeedbackStatusChange(feedbackId, existingFeedback.status, newStatus).catch(
      (err) => console.error("Failed to sync status change to GitHub:", err),
    );

    return NextResponse.json({
      data: updatedFeedback,
      message: "Status updated successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const { id } = await ctx.params;
    const feedbackId = parseInt(id);

    if (isNaN(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        organizationId: feedback.organizationId,
        deletedAt: feedback.deletedAt,
      })
      .from(feedback)
      .where(eq(feedback.feedbackId, feedbackId))
      .limit(1);

    if (!existingFeedback || existingFeedback.deletedAt !== null) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    let context;
    try {
      context = await getOrgContext({
        request: req,
        db,
        userId: session.user.id,
        organizationId: existingFeedback.organizationId,
        requireMembership: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const memberRole = context.memberRole as UserRole | null;
    if (!memberRole || !canEditFeedback(memberRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validationResult = updateFeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { title, description } = validationResult.data;

    const [updatedFeedback] = await db
      .update(feedback)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, feedbackId))
      .returning();

    return NextResponse.json({
      data: updatedFeedback,
      message: "Feedback updated successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const { id } = await ctx.params;
    const feedbackId = parseInt(id);

    if (isNaN(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
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
        const [feedbackOrg] = await db
          .select({
            organizationId: feedback.organizationId,
            deletedAt: feedback.deletedAt,
          })
          .from(feedback)
          .where(eq(feedback.feedbackId, feedbackId))
          .limit(1);

        if (!feedbackOrg || feedbackOrg.deletedAt !== null) {
          return NextResponse.json(
            { error: "Feedback not found", code: "NOT_FOUND" },
            { status: 404 },
          );
        }

        try {
          context = await getOrgContext({
            request: req,
            db,
            userId: session.user.id,
            organizationId: feedbackOrg.organizationId,
            requireMembership: true,
          });
        } catch {
          return NextResponse.json(
            { error: "Insufficient permissions", code: "FORBIDDEN" },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    const memberRole = context.memberRole as UserRole | null;
    if (!memberRole || !canDeleteFeedback(memberRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        organizationId: feedback.organizationId,
        deletedAt: feedback.deletedAt,
      })
      .from(feedback)
      .where(eq(feedback.feedbackId, feedbackId))
      .limit(1);

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (existingFeedback.organizationId !== context.organizationId) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    if (existingFeedback.deletedAt !== null) {
      return NextResponse.json(
        { error: "Feedback already deleted", code: "ALREADY_DELETED" },
        { status: 400 },
      );
    }

    const [deletedFeedback] = await db
      .update(feedback)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, feedbackId))
      .returning();

    return NextResponse.json({
      data: deletedFeedback,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}
