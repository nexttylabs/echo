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

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { PortalLayout } from "@/components/portal/portal-layout";
import { FeedbackBoard } from "@/components/portal/feedback-board";
import type { FeedbackPost } from "@/components/portal/feedback-post-card";
import type { Contributor } from "@/components/portal/contributors-sidebar";
import { getPortalPublicContext, getPortalSections } from "@/lib/portal/public-context";
import { auth } from "@/lib/auth/config";

type PageProps = {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ sort?: string }>;
};

async function getFeedbackPosts(
  organizationId: string,
  sort: string = "new"
): Promise<FeedbackPost[]> {
  const { db } = await import("@/lib/db");
  if (!db) return [];

  // Import feedback schema
  const { feedback } = await import("@/lib/db/schema");

  const voteCountSubquery = sql<number>`(
    SELECT COUNT(*)::int
    FROM "votes"
    WHERE "votes"."feedbackId" = "feedback"."feedbackId"
  )`;

  // Count only public comments (isInternal = false)
  const commentCountSubquery = sql<number>`(
    SELECT COUNT(*)::int
    FROM "comments"
    WHERE "comments"."feedbackId" = "feedback"."feedbackId"
    AND "comments"."isInternal" = false
  )`;

  const orderByClause =
    sort === "top"
      ? desc(voteCountSubquery)
      : sort === "trending"
        ? desc(voteCountSubquery) // Simplified: could add time weight
        : desc(feedback.createdAt);

  const results = await db
    .select({
      id: feedback.feedbackId,
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      status: feedback.status,
      voteCount: voteCountSubquery,
      commentCount: commentCountSubquery,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .where(
      and(
        eq(feedback.organizationId, organizationId),
        isNull(feedback.deletedAt),
      ),
    )
    .orderBy(orderByClause)
    .limit(50);

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    status: r.status,
    voteCount: r.voteCount ?? 0,
    commentCount: r.commentCount ?? 0,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    author: null, // TODO: Add author info
  }));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getTopContributors(_organizationId: string): Promise<Contributor[]> {
  // TODO: Implement actual contributor query
  // For now, return empty array
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { organizationSlug } = await params;
  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled) {
    return { title: "Not Found" };
  }

  return {
    title: `${organization.name} - Feedback Portal`,
    description: organization.description || `${organization.name} feedback portal`,
    robots: context.seo.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function OrganizationPortalPage({ params, searchParams }: PageProps) {
  const { organizationSlug } = await params;
  const { sort = "new" } = await searchParams;

  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled || !context.modules.feedback) {
    notFound();
  }

  const [posts, contributors] = await Promise.all([
    getFeedbackPosts(organization.id, sort),
    getTopContributors(organization.id),
  ]);

  const sections = getPortalSections(organizationSlug, context.modules);
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return (
    <PortalLayout
      organizationName={organization.name}
      organizationSlug={organizationSlug}
      sections={sections}
    >
      <FeedbackBoard
        organizationId={organization.id}
        organizationSlug={organizationSlug}
        posts={posts}
        isAuthenticated={isAuthenticated}
        contributors={contributors}
        totalCount={posts.length}
        showVoteCount={context.sharing.showVoteCount}
        showAuthor={context.sharing.showAuthor}
        allowPublicVoting={context.sharing.allowPublicVoting}
      />
    </PortalLayout>
  );
}
