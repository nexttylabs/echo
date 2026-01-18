/*
 * Copyright (c) 2026 Echo Team
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
import { requireApiKey } from "@/lib/middleware/api-key";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z, ZodError } from "zod";
import { logger } from "@/lib/logger";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateFeedbackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(["bug", "feature", "issue", "other"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["new", "in-progress", "planned", "completed", "closed"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(req);
  if (auth.error) return auth.error;

  const { organizationId } = auth.context!;
  const { id } = await params;
  const feedbackId = parseInt(id);

  if (isNaN(feedbackId)) {
    return NextResponse.json(
      { error: "Invalid feedback ID", code: "INVALID_ID" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const context = await getOrgContext({
      request: req,
      db,
      organizationId,
    });
    const result = await db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "Missing organization") {
      return NextResponse.json(
        { error: "Organization ID is required", code: "MISSING_ORG_ID" },
        { status: 400 },
      );
    }
    logger.error({ err: error }, "API error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(req);
  if (auth.error) return auth.error;

  const { organizationId } = auth.context!;
  const { id } = await params;
  const feedbackId = parseInt(id);

  if (isNaN(feedbackId)) {
    return NextResponse.json(
      { error: "Invalid feedback ID", code: "INVALID_ID" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const context = await getOrgContext({
      request: req,
      db,
      organizationId,
    });
    const body = await req.json();
    const validated = updateFeedbackSchema.parse(body);

    const existing = await db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const result = await db
      .update(feedback)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
        ),
      )
      .returning();

    logger.info({ feedbackId }, "Feedback updated via API");

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.issues,
        },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Missing organization") {
      return NextResponse.json(
        { error: "Organization ID is required", code: "MISSING_ORG_ID" },
        { status: 400 },
      );
    }

    logger.error({ err: error }, "API error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(req);
  if (auth.error) return auth.error;

  const { organizationId } = auth.context!;
  const { id } = await params;
  const feedbackId = parseInt(id);

  if (isNaN(feedbackId)) {
    return NextResponse.json(
      { error: "Invalid feedback ID", code: "INVALID_ID" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const context = await getOrgContext({
      request: req,
      db,
      organizationId,
    });
    const existing = await db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    await db
      .update(feedback)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
        ),
      );

    logger.info({ feedbackId }, "Feedback deleted via API");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Missing organization") {
      return NextResponse.json(
        { error: "Organization ID is required", code: "MISSING_ORG_ID" },
        { status: 400 },
      );
    }
    logger.error({ err: error }, "API error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
