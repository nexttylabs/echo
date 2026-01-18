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

import type { db as database } from "@/lib/db";
import { feedback, attachments, user, votes, statusHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

type Database = NonNullable<typeof database>;

type DbShape = {
  select: Database["select"];
};

export type GetFeedbackByIdOptions = {
  userId?: string | null;
  visitorId?: string | null;
};

export async function getFeedbackById(
  db: DbShape,
  id: number,
  options: GetFeedbackByIdOptions = {},
) {
  const [row] = await db
    .select({
      feedbackId: feedback.feedbackId,
      organizationId: feedback.organizationId,
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      priority: feedback.priority,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      submittedOnBehalf: feedback.submittedOnBehalf,
      submittedBy: feedback.submittedBy,
      customerInfo: feedback.customerInfo,
      deletedAt: feedback.deletedAt,
    })
    .from(feedback)
    .where(eq(feedback.feedbackId, id))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.deletedAt !== null) {
    return { deleted: true as const };
  }

  const items = await db
    .select()
    .from(attachments)
    .where(eq(attachments.feedbackId, id));

  let submittedByUser: { id: string; name: string; email: string } | null = null;
  if (row.submittedOnBehalf && row.submittedBy) {
    const [userRow] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, row.submittedBy))
      .limit(1);
    submittedByUser = userRow ?? null;
  }

  const feedbackVotes = await db
    .select({
      voteId: votes.voteId,
      visitorId: votes.visitorId,
      userId: votes.userId,
      createdAt: votes.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(votes)
    .leftJoin(user, eq(votes.userId, user.id))
    .where(eq(votes.feedbackId, id));

  let userVote: { hasVoted: boolean; voteId: number | null } = {
    hasVoted: false,
    voteId: null,
  };

  if (options.userId) {
    const foundVote = feedbackVotes.find((v) => v.userId === options.userId);
    if (foundVote) {
      userVote = { hasVoted: true, voteId: foundVote.voteId };
    }
  } else if (options.visitorId) {
    const foundVote = feedbackVotes.find(
      (v) => v.visitorId === options.visitorId,
    );
    if (foundVote) {
      userVote = { hasVoted: true, voteId: foundVote.voteId };
    }
  }

  const historyEntries = await db
    .select({
      historyId: statusHistory.historyId,
      oldStatus: statusHistory.oldStatus,
      newStatus: statusHistory.newStatus,
      changedAt: statusHistory.changedAt,
      comment: statusHistory.comment,
      changedById: statusHistory.changedBy,
      changedByName: user.name,
      changedByEmail: user.email,
    })
    .from(statusHistory)
    .leftJoin(user, eq(statusHistory.changedBy, user.id))
    .where(eq(statusHistory.feedbackId, id))
    .orderBy(desc(statusHistory.changedAt));

  return {
    feedback: {
      ...row,
      submittedByUser,
    },
    attachments: items,
    votes: {
      count: feedbackVotes.length,
      list: feedbackVotes,
      userVote,
    },
    statusHistory: historyEntries.map((entry) => ({
      historyId: entry.historyId,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      changedAt: entry.changedAt,
      comment: entry.comment,
      changedBy: entry.changedById
        ? {
            id: entry.changedById,
            name: entry.changedByName,
            email: entry.changedByEmail ?? "",
          }
        : null,
    })),
  };
}
