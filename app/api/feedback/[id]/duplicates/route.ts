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
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedback, duplicateFeedback } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/api/errors";
import {
  findDuplicates,
  type FeedbackForDuplicateCheck,
} from "@/lib/services/ai/duplicate-detector";
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

    const [feedbackData] = await db
      .select({
        feedbackId: feedback.feedbackId,
        title: feedback.title,
        description: feedback.description,
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

    if (!feedbackData) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Get existing feedbacks for duplicate detection
    const existingFeedbacks: FeedbackForDuplicateCheck[] = await db
      .select({
        feedbackId: feedback.feedbackId,
        title: feedback.title,
        description: feedback.description,
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.organizationId, feedbackData.organizationId),
          isNull(feedback.deletedAt),
        ),
      );

    const suggestions = findDuplicates(
      feedbackData.title,
      feedbackData.description,
      existingFeedbacks,
      feedbackId,
      0.75,
    );

    // Get confirmed duplicates from database
    const confirmed = await db
      .select({
        id: duplicateFeedback.id,
        duplicateFeedbackId: duplicateFeedback.duplicateFeedbackId,
        similarity: duplicateFeedback.similarity,
        status: duplicateFeedback.status,
        confirmedAt: duplicateFeedback.confirmedAt,
      })
      .from(duplicateFeedback)
      .where(
        and(
          eq(duplicateFeedback.originalFeedbackId, feedbackId),
          eq(duplicateFeedback.status, "confirmed"),
        ),
      );

    return NextResponse.json({
      suggestions,
      confirmed,
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

    const body = await req.json();
    const { duplicateFeedbackId, status } = body;

    if (!duplicateFeedbackId || !["confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid request body", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const duplicateId = parseInt(duplicateFeedbackId);
    if (isNaN(duplicateId)) {
      return NextResponse.json(
        { error: "Invalid duplicate feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Check if both feedbacks exist
    const [originalFeedback] = await db
      .select({ feedbackId: feedback.feedbackId })
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, feedbackId),
          eq(feedback.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    const [duplicateFeedbackData] = await db
      .select({ feedbackId: feedback.feedbackId })
      .from(feedback)
      .where(
        and(
          eq(feedback.feedbackId, duplicateId),
          eq(feedback.organizationId, context.organizationId),
        ),
      )
      .limit(1);

    if (!originalFeedback || !duplicateFeedbackData) {
      return NextResponse.json(
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Upsert duplicate relationship
    await db
      .insert(duplicateFeedback)
      .values({
        originalFeedbackId: feedbackId,
        duplicateFeedbackId: duplicateId,
        similarity: 0,
        status,
        confirmedBy: session.user.id,
        confirmedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          duplicateFeedback.originalFeedbackId,
          duplicateFeedback.duplicateFeedbackId,
        ],
        set: {
          status,
          confirmedBy: session.user.id,
          confirmedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
