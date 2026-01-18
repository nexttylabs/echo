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
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback, aiProcessingResults } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { retryFailedProcessing } from "@/lib/workers/feedback-processor";
import { apiError } from "@/lib/api/errors";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
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

    // Get feedback processing status
    const [feedbackData] = await db
      .select({
        processingStatus: feedback.processingStatus,
        processedAt: feedback.processedAt,
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!feedbackData) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Get processing result if available
    const [processingResult] = await db
      .select()
      .from(aiProcessingResults)
      .where(eq(aiProcessingResults.feedbackId, feedbackId))
      .limit(1);

    return NextResponse.json({
      status: feedbackData.processingStatus,
      processedAt: feedbackData.processedAt,
      result: processingResult ?? null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
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

    const [existingFeedback] = await db
      .select({ feedbackId: feedback.feedbackId })
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

    // Retry failed processing
    await retryFailedProcessing(feedbackId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
