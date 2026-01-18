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
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import type { db as database } from "@/lib/db";
import { comments, feedback, user, organizationMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/api/errors";
import {
  createCommentSchema,
  createGuestCommentSchema,
} from "@/lib/validations/comment";
import { notifyNewComment } from "@/lib/services/notifications";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type Database = NonNullable<typeof database>;

async function resolveOrgContextForFeedback(options: {
  req: NextRequest;
  db: Database;
  feedbackId: number;
  userId: string | null;
}) {
  const { req, db, feedbackId, userId } = options;

  try {
    const context = await getOrgContext({
      request: req,
      db,
      userId,
      requireMembership: !!userId,
    });
    return { context };
  } catch (error) {
    if (error instanceof Error && error.message === "Missing organization") {
      const [feedbackOrg] = await db
        .select({ organizationId: feedback.organizationId })
        .from(feedback)
        .where(eq(feedback.feedbackId, feedbackId))
        .limit(1);

      if (!feedbackOrg) {
        return {
          response: NextResponse.json(
            { error: "Feedback not found", code: "NOT_FOUND" },
            { status: 404 },
          ),
        };
      }

      try {
        const context = await getOrgContext({
          request: req,
          db,
          userId,
          organizationId: feedbackOrg.organizationId,
          requireMembership: !!userId,
        });
        return { context };
      } catch {
        return {
          response: NextResponse.json(
            { error: "Insufficient permissions", code: "FORBIDDEN" },
            { status: 403 },
          ),
        };
      }
    }
    if (error instanceof Error && error.message === "Access denied") {
      return {
        response: NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        ),
      };
    }
    return { response: apiError(error) };
  }
}

async function isOrgMember(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  if (!db) return false;

  const [member] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  return !!member;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const database = db;
    const { id } = await params;
    const feedbackId = parseInt(id);

    if (isNaN(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id ?? null;
    const resolved = await resolveOrgContextForFeedback({
      req,
      db: database,
      feedbackId,
      userId,
    });
    if ("response" in resolved) {
      return resolved.response;
    }
    const { context } = resolved;

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        organizationId: feedback.organizationId,
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
        {
          error: userId ? "Insufficient permissions" : "Feedback not found",
          code: userId ? "FORBIDDEN" : "NOT_FOUND",
        },
        { status: userId ? 403 : 404 },
      );
    }

    const showInternal =
      userId && (await isOrgMember(userId, existingFeedback.organizationId));

    const feedbackComments = await db
      .select({
        commentId: comments.commentId,
        content: comments.content,
        isInternal: comments.isInternal,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        authorName: comments.authorName,
        authorEmail: comments.authorEmail,
        guestToken: comments.guestToken,
        userName: user.name,
        userEmail: user.email,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .where(
        showInternal
          ? eq(comments.feedbackId, feedbackId)
          : and(
              eq(comments.feedbackId, feedbackId),
              eq(comments.isInternal, false),
            ),
      )
      .orderBy(desc(comments.createdAt));

    const normalizedComments = feedbackComments.map((c) => ({
      commentId: c.commentId,
      content: c.content,
      isInternal: c.isInternal,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.userId
        ? {
            type: "user" as const,
            userId: c.userId,
            name: c.userName,
            email: c.userEmail,
          }
        : {
            type: "guest" as const,
            name: c.authorName,
            email: c.authorEmail,
          },
    }));

    const internalNotes = normalizedComments.filter((c) => c.isInternal);
    const publicComments = normalizedComments.filter((c) => !c.isInternal);

    return NextResponse.json({
      data: {
        all: normalizedComments,
        internal: showInternal ? internalNotes : [],
        public: publicComments,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

function getGuestToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("guest_token");
  return cookie?.value ?? null;
}

function setGuestTokenCookie(token: string): string {
  return `guest_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const database = db;
    const { id } = await params;
    const feedbackId = parseInt(id);

    if (isNaN(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id ?? null;
    const resolved = await resolveOrgContextForFeedback({
      req,
      db: database,
      feedbackId,
      userId,
    });
    if ("response" in resolved) {
      return resolved.response;
    }
    const { context } = resolved;

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        organizationId: feedback.organizationId,
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
        {
          error: userId ? "Insufficient permissions" : "Feedback not found",
          code: userId ? "FORBIDDEN" : "NOT_FOUND",
        },
        { status: userId ? 403 : 404 },
      );
    }

    const body = await req.json();

    let newComment;
    let guestToken: string | null = null;

    if (session?.user) {
      // Authenticated user
      const userId = session.user.id;
      const validationResult = createCommentSchema.safeParse(body);

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

      const { content, isInternal } = validationResult.data;

      if (isInternal) {
        const isMember = await isOrgMember(
          userId,
          existingFeedback.organizationId,
        );
        if (!isMember) {
          return NextResponse.json(
            {
              error:
                "Cannot add internal notes to feedback from other organizations",
              code: "FORBIDDEN",
            },
            { status: 403 },
          );
        }
      }

      [newComment] = await db
        .insert(comments)
        .values({
          feedbackId,
          userId,
          content,
          isInternal,
        })
        .returning();
    } else {
      // Anonymous guest
      const validationResult = createGuestCommentSchema.safeParse(body);

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

      const { content, authorName, authorEmail } = validationResult.data;

      guestToken = getGuestToken(req) ?? randomUUID();

      [newComment] = await db
        .insert(comments)
        .values({
          feedbackId,
          userId: null,
          authorName,
          authorEmail,
          guestToken,
          content,
          isInternal: false,
        })
        .returning();
    }

    const responseHeaders: HeadersInit = {};
    if (guestToken) {
      responseHeaders["Set-Cookie"] = setGuestTokenCookie(guestToken);
    }

    if (!newComment.isInternal) {
      const authorId = session?.user?.id ?? "";
      const authorName =
        session?.user?.name ?? body.authorName ?? "Anonymous";
      notifyNewComment(feedbackId, authorId, authorName, newComment.content).catch(
        (err) => console.error("Failed to send new comment notification:", err),
      );
    }

    return NextResponse.json(
      {
        data: newComment,
        message: "Comment added successfully",
      },
      { status: 201, headers: responseHeaders },
    );
  } catch (error) {
    return apiError(error);
  }
}
