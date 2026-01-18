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
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import {
  eq,
  desc,
  asc,
  count,
  and,
  sql,
  isNull,
  or,
  inArray,
  type SQL,
} from "drizzle-orm";
import { buildCreateFeedbackHandler } from "./handler";
import { apiError } from "@/lib/api/errors";
import { FeedbackStatusEnum } from "@/lib/validations/feedback";
import { auth } from "@/lib/auth/config";
import { getOrgContext } from "@/lib/auth/org-context";
import { parseCsvParam } from "@/lib/feedback/filters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function buildAssigneeCondition(
  assigneeFilterValues: string[],
): SQL | null {
  if (assigneeFilterValues.length === 0) {
    return null;
  }

  const includeUnassigned = assigneeFilterValues.includes("unassigned");
  const assignedValues = assigneeFilterValues.filter(
    (value) => value !== "unassigned",
  );
  const assigneeConditions: SQL[] = [];

  if (assignedValues.length > 0) {
    assigneeConditions.push(inArray(feedback.submittedBy, assignedValues));
  }
  if (includeUnassigned) {
    assigneeConditions.push(isNull(feedback.submittedBy));
  }

  if (assigneeConditions.length === 0) {
    return null;
  }
  if (assigneeConditions.length === 1) {
    return assigneeConditions[0];
  }

  return or(...assigneeConditions) ?? null;
}

export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const query = searchParams.get("query")?.trim();
    const context = await getOrgContext({
      request: req,
      db,
      userId: session.user.id,
      requireMembership: true,
    });

    // Filter parameters
    const statusFilterValues = parseCsvParam(searchParams.get("status")).filter(
      (value) => value !== "all",
    );
    const typeFilterValues = parseCsvParam(searchParams.get("type")).filter(
      (value) => value !== "all",
    );
    const priorityFilterValues = parseCsvParam(
      searchParams.get("priority"),
    ).filter((value) => value !== "all");
    const assigneeFilterValues = parseCsvParam(
      searchParams.get("assignee"),
    ).filter(Boolean);
    const hasVotesValues = parseCsvParam(searchParams.get("hasVotes"));
    const hasRepliesValues = parseCsvParam(searchParams.get("hasReplies"));

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters", code: "INVALID_PAGINATION" },
        { status: 400 },
      );
    }

    if (
      statusFilterValues.length > 0 &&
      !statusFilterValues.every(
        (value) => FeedbackStatusEnum.safeParse(value).success,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid status", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const offset = (page - 1) * pageSize;

    const orderByFunction = sortOrder === "asc" ? asc : desc;

    let orderByClause;

    if (sortBy === "voteCount") {
      orderByClause = orderByFunction(
        sql<number>`(SELECT COUNT(*)::int FROM "votes" WHERE "votes"."feedbackId" = "feedback"."feedbackId")`,
      );
    } else if (sortBy === "priority") {
      orderByClause = orderByFunction(
        sql`CASE ${feedback.priority}
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 0
        END`,
      );
    } else {
      const orderByColumn =
        {
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          title: feedback.title,
          status: feedback.status,
        }[sortBy] || feedback.createdAt;
      orderByClause = orderByFunction(orderByColumn);
    }

    // Build filter conditions - exclude deleted feedback
    const conditions: SQL[] = [
      eq(feedback.organizationId, context.organizationId),
      isNull(feedback.deletedAt),
    ];

    if (query) {
      const pattern = `%${query}%`;
      conditions.push(
        sql`(${feedback.title} ILIKE ${pattern} OR ${feedback.description} ILIKE ${pattern})`,
      );
    }

    if (statusFilterValues.length > 0) {
      conditions.push(inArray(feedback.status, statusFilterValues));
    }

    if (typeFilterValues.length > 0) {
      conditions.push(inArray(feedback.type, typeFilterValues));
    }

    if (priorityFilterValues.length > 0) {
      conditions.push(inArray(feedback.priority, priorityFilterValues));
    }

    const assigneeCondition = buildAssigneeCondition(assigneeFilterValues);
    if (assigneeCondition) {
      conditions.push(assigneeCondition);
    }

    if (hasVotesValues.length > 0) {
      const voteCountExpr = sql<number>`(SELECT COUNT(*)::int FROM "votes" WHERE "votes"."feedbackId" = "feedback"."feedbackId")`;
      const hasVotesSet = new Set(hasVotesValues);
      if (hasVotesSet.size === 1) {
        if (hasVotesSet.has("true")) {
          conditions.push(sql`${voteCountExpr} > 0`);
        } else if (hasVotesSet.has("false")) {
          conditions.push(sql`${voteCountExpr} = 0`);
        }
      }
    }

    if (hasRepliesValues.length > 0) {
      const replyCountExpr = sql<number>`(SELECT COUNT(*)::int FROM "comments" WHERE "comments"."feedbackId" = "feedback"."feedbackId")`;
      const hasRepliesSet = new Set(hasRepliesValues);
      if (hasRepliesSet.size === 1) {
        if (hasRepliesSet.has("true")) {
          conditions.push(sql`${replyCountExpr} > 0`);
        } else if (hasRepliesSet.has("false")) {
          conditions.push(sql`${replyCountExpr} = 0`);
        }
      }
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(feedback)
      .where(whereClause);

    const feedbackList = await db
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
      .limit(pageSize)
      .offset(offset);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: feedbackList,
      total: totalCount,
      page,
      pageSize,
      totalPages,
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
}

export async function POST(req: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const handler = buildCreateFeedbackHandler({ db });
  return handler(req);
}
