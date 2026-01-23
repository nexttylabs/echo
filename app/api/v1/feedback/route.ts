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
import { requireApiKey } from "@/lib/middleware/api-key";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { eq, and, desc, asc, sql, like, or, isNull, count, type SQL } from "drizzle-orm";
import { z, ZodError } from "zod";
import { logger } from "@/lib/logger";
import { FeedbackStatusEnum } from "@/lib/validations/feedback";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createFeedbackSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  type: z.enum(["bug", "feature", "issue", "other"]).default("other"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  submittedOnBehalf: z.boolean().default(false),
  customerInfo: z
    .object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth.error) return auth.error;

  const { organizationId } = auth.context!;

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
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: "Invalid pagination parameters", code: "INVALID_PAGINATION" },
        { status: 400 },
      );
    }

    if (status && !FeedbackStatusEnum.safeParse(status).success) {
      return NextResponse.json(
        { error: "Invalid status", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const conditions: SQL[] = [
      eq(feedback.organizationId, context.organizationId),
      isNull(feedback.deletedAt),
    ];

    if (status) {
      conditions.push(eq(feedback.status, status));
    }

    if (type) {
      conditions.push(eq(feedback.type, type));
    }

    if (search) {
      conditions.push(
        or(
          like(feedback.title, `%${search}%`),
          like(feedback.description, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const orderByFunction = order === "asc" ? asc : desc;
    let orderByClause;

    if (sort === "voteCount") {
      orderByClause = orderByFunction(
        sql<number>`(SELECT COUNT(*)::int FROM "votes" WHERE "votes"."feedbackId" = "feedback"."feedbackId")`,
      );
    } else {
      const orderByColumn =
        {
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          title: feedback.title,
          status: feedback.status,
          priority: feedback.priority,
        }[sort] || feedback.createdAt;
      orderByClause = orderByFunction(orderByColumn);
    }

    const [feedbackList, totalResult] = await Promise.all([
      db
        .select({
          feedbackId: feedback.feedbackId,
          title: feedback.title,
          description: feedback.description,
          type: feedback.type,
          priority: feedback.priority,
          status: feedback.status,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          voteCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM "votes"
            WHERE "votes"."feedbackId" = "feedback"."feedbackId"
          )`,
        })
        .from(feedback)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(feedback).where(whereClause),
    ]);

    const total = totalResult[0].value;

    return NextResponse.json({
      data: feedbackList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth.error) return auth.error;

    const { organizationId } = auth.context!;

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
    const validated = createFeedbackSchema.parse(body);

    const result = await db
      .insert(feedback)
      .values({
        ...validated,
        organizationId: context.organizationId,
        status: "new",
      })
      .returning();

    logger.info({ feedbackId: result[0].feedbackId }, "Feedback created via API");

    return NextResponse.json(
      {
        data: result[0],
        meta: {
          createdAt: result[0].createdAt,
        },
      },
      { status: 201 },
    );
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
