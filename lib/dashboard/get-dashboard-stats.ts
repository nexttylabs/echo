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

import { eq, and, gte, isNull, sql, count } from "drizzle-orm";
import type { db as database } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth/permissions";

type Database = NonNullable<typeof database>;

export interface DashboardStats {
  totalFeedback: number;
  pendingFeedback: number;
  weeklyFeedback: number;
  resolvedFeedback: number;
  statusDistribution: { status: string; count: number }[];
  recentFeedback: {
    feedbackId: number;
    title: string;
    type: string;
    status: string;
    priority: string;
    createdAt: Date;
  }[];
}

export async function getDashboardStats(
  db: Database,
  options: {
    userId: string;
    userRole: UserRole;
    organizationId: string;
  }
): Promise<DashboardStats> {
  const { userId, userRole, organizationId } = options;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const isAdminOrPM = userRole === "admin" || userRole === "product_manager";

  // Base condition: not deleted and belongs to organization
  const baseCondition = and(
    isNull(feedback.deletedAt),
    eq(feedback.organizationId, organizationId)
  );

  // For non-admin/PM, filter by submittedBy
  const userCondition = isAdminOrPM
    ? baseCondition
    : and(baseCondition, eq(feedback.submittedBy, userId));

  // Total feedback count
  const [totalResult] = await db
    .select({ count: count() })
    .from(feedback)
    .where(userCondition);

  // Pending feedback (status = 'new' or 'in-progress')
  const [pendingResult] = await db
    .select({ count: count() })
    .from(feedback)
    .where(
      and(
        userCondition,
        sql`${feedback.status} IN ('new', 'in-progress')`
      )
    );

  // Weekly feedback (last 7 days)
  const [weeklyResult] = await db
    .select({ count: count() })
    .from(feedback)
    .where(and(userCondition, gte(feedback.createdAt, sevenDaysAgo)));

  // Resolved feedback (completed + closed)
  const [resolvedResult] = await db
    .select({ count: count() })
    .from(feedback)
    .where(
      and(
        userCondition,
        sql`${feedback.status} IN ('completed', 'closed')`
      )
    );

  // Status distribution
  const statusDistribution = await db
    .select({
      status: feedback.status,
      count: count(),
    })
    .from(feedback)
    .where(userCondition)
    .groupBy(feedback.status);

  // Recent feedback (last 5)
  const recentFeedback = await db
    .select({
      feedbackId: feedback.feedbackId,
      title: feedback.title,
      type: feedback.type,
      status: feedback.status,
      priority: feedback.priority,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .where(userCondition)
    .orderBy(sql`${feedback.createdAt} DESC`)
    .limit(5);

  return {
    totalFeedback: totalResult?.count ?? 0,
    pendingFeedback: pendingResult?.count ?? 0,
    weeklyFeedback: weeklyResult?.count ?? 0,
    resolvedFeedback: resolvedResult?.count ?? 0,
    statusDistribution: statusDistribution.map((s) => ({
      status: s.status,
      count: Number(s.count),
    })),
    recentFeedback,
  };
}
