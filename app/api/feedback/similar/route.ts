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
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { buildSimilarResponse } from "@/lib/feedback/find-similar";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/feedback/similar
 * Returns a list of feedback entries similar to the provided title/description
 */
export async function GET(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const title = searchParams.get("title") || "";
    const description = searchParams.get("description") || "";
    const context = await getOrgContext({ request: req, db, requireMembership: false });

    if (!title.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    // Fetch active feedback for the organization
    const existingFeedback = await db
      .select({
        feedbackId: feedback.feedbackId,
        title: feedback.title,
        description: feedback.description,
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.organizationId, context.organizationId),
          isNull(feedback.deletedAt)
        )
      )
      .limit(100);

    const suggestions = buildSimilarResponse(
      title,
      description,
      existingFeedback.map((f) => ({
        feedbackId: f.feedbackId,
        title: f.title ?? "",
        description: f.description,
      }))
    );

    return NextResponse.json({
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Missing organization") {
        return NextResponse.json(
          { error: "Organization ID is required", code: "MISSING_ORG_ID" },
          { status: 400 }
        );
      }
      if (error.message === "Access denied") {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    }
    console.error("Error finding similar feedback:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
