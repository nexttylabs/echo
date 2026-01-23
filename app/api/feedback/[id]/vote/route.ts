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
import { votes, feedback, organizationSettings } from "@/lib/db/schema";
import { apiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/config";
import { getOrgContext } from "@/lib/auth/org-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getClientIp(req: NextRequest): string {
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

export async function GET(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
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
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const visitorId = generateVisitorId(clientIp, userAgent);
    let context;
    try {
      context = await getOrgContext({
        request: req,
        db,
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

    const [existingFeedback] = await db
      .select({ feedbackId: feedback.feedbackId, organizationId: feedback.organizationId })
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
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    let hasVoted = false;
    let voteId: number | null = null;

    if (userId) {
      const [userVote] = await db
        .select({ voteId: votes.voteId })
        .from(votes)
        .where(and(eq(votes.feedbackId, feedbackId), eq(votes.userId, userId)))
        .limit(1);

      hasVoted = !!userVote;
      voteId = userVote?.voteId ?? null;
    } else {
      const [ipVote] = await db
        .select({ voteId: votes.voteId })
        .from(votes)
        .where(
          and(eq(votes.feedbackId, feedbackId), eq(votes.visitorId, visitorId)),
        )
        .limit(1);

      hasVoted = !!ipVote;
      voteId = ipVote?.voteId ?? null;
    }

    return NextResponse.json({
      data: {
        hasVoted,
        voteId,
        feedbackId,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
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
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const visitorId = generateVisitorId(clientIp, userAgent);
    let context;
    try {
      context = await getOrgContext({
        request: req,
        db,
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

    const [existingFeedback] = await db
      .select({
        feedbackId: feedback.feedbackId,
        deletedAt: feedback.deletedAt,
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
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (existingFeedback.deletedAt !== null) {
      return NextResponse.json(
        { error: "Cannot vote on deleted feedback", code: "DELETED" },
        { status: 400 },
      );
    }

    // Check if public voting is allowed for anonymous users
    if (!userId) {
      const [settings] = await db
        .select({ portalConfig: organizationSettings.portalConfig })
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, context.organizationId))
        .limit(1);

      const allowPublicVoting = settings?.portalConfig?.sharing?.allowPublicVoting ?? true;

      if (!allowPublicVoting) {
        return NextResponse.json(
          { error: "Public voting is disabled", code: "PUBLIC_VOTING_DISABLED" },
          { status: 403 },
        );
      }
    }

    if (userId) {
      const [existingVote] = await db
        .select({ voteId: votes.voteId })
        .from(votes)
        .where(and(eq(votes.feedbackId, feedbackId), eq(votes.userId, userId)))
        .limit(1);

      if (existingVote) {
        return NextResponse.json(
          {
            error: "Already voted",
            code: "ALREADY_VOTED",
            voteId: existingVote.voteId,
          },
          { status: 400 },
        );
      }
    } else {
      const [existingVote] = await db
        .select({ voteId: votes.voteId })
        .from(votes)
        .where(
          and(eq(votes.feedbackId, feedbackId), eq(votes.visitorId, visitorId)),
        )
        .limit(1);

      if (existingVote) {
        return NextResponse.json(
          {
            error: "Already voted from this device",
            code: "ALREADY_VOTED",
            voteId: existingVote.voteId,
          },
          { status: 400 },
        );
      }
    }

    const [newVote] = await db
      .insert(votes)
      .values({
        feedbackId,
        userId,
        visitorId: userId ? null : visitorId,
      })
      .returning();

    return NextResponse.json(
      {
        data: newVote,
        message: "Vote added successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "Already voted", code: "ALREADY_VOTED" },
        { status: 400 },
      );
    }
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
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
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const visitorId = generateVisitorId(clientIp, userAgent);
    let context;
    try {
      context = await getOrgContext({
        request: req,
        db,
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

    const [existingFeedback] = await db
      .select({ feedbackId: feedback.feedbackId, organizationId: feedback.organizationId })
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
        { error: "Feedback not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    let deletedVote = null;

    if (userId) {
      const [deleted] = await db
        .delete(votes)
        .where(and(eq(votes.feedbackId, feedbackId), eq(votes.userId, userId)))
        .returning();

      deletedVote = deleted;
    } else {
      const [deleted] = await db
        .delete(votes)
        .where(
          and(eq(votes.feedbackId, feedbackId), eq(votes.visitorId, visitorId)),
        )
        .returning();

      deletedVote = deleted;
    }

    if (!deletedVote) {
      return NextResponse.json(
        { error: "Vote not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: deletedVote,
      message: "Vote removed successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}
