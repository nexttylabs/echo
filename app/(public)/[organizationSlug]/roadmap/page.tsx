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

import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { organizationMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { PortalLayout } from "@/components/portal/portal-layout";
import { RoadmapBoard, type RoadmapStatus } from "@/components/portal/roadmap-board";
import type { RoadmapItem } from "@/components/portal/roadmap-column";
import { Button } from "@/components/ui/button";
import { getPortalPublicContext, getPortalSections } from "@/lib/portal/public-context";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: Promise<{ organizationSlug: string }>;
};

async function getRoadmapItems(organizationId: string): Promise<RoadmapItem[]> {
  const { db } = await import("@/lib/db");
  if (!db) return [];

  // Import feedback schema and get items with roadmap-related statuses
  const { feedback } = await import("@/lib/db/schema");

  // Map feedback statuses to roadmap statuses
  const statusMap: Record<string, RoadmapStatus> = {
    new: "backlog",
    planned: "next-up",
    "in-progress": "in-progress",
    completed: "done",
    closed: "done",
  };

  const voteCountSubquery = sql<number>`(
    SELECT COUNT(*)::int
    FROM "votes"
    WHERE "votes"."feedbackId" = "feedback"."feedbackId"
  )`;

  const results = await db
    .select({
      id: feedback.feedbackId,
      title: feedback.title,
      type: feedback.type,
      status: feedback.status,
      voteCount: voteCountSubquery,
    })
    .from(feedback)
    .where(
      and(
        eq(feedback.organizationId, organizationId),
        isNull(feedback.deletedAt),
      ),
    )
    .orderBy(desc(voteCountSubquery))
    .limit(100);

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.type,
    voteCount: r.voteCount ?? 0,
    status: statusMap[r.status] ?? "backlog",
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { organizationSlug } = await params;
  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled) {
    return { title: "Not Found" };
  }

  return {
    title: `Roadmap - ${organization.name}`,
    description: `View the product roadmap for ${organization.name}`,
  };
}

export default async function OrganizationRoadmapPage({ params }: PageProps) {
  const t = await getTranslations("portal.roadmap");
  const { organizationSlug } = await params;

  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled || !context.modules.roadmap) {
    notFound();
  }

  // Check if user is admin
  const session = await auth.api.getSession({ headers: await headers() });
  let isAdmin = false;

  if (session?.user?.id) {
    const { db } = await import("@/lib/db");
    if (db) {
      const [member] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organization.id),
            eq(organizationMembers.userId, session.user.id)
          )
        )
        .limit(1);
      isAdmin = member?.role === "admin" || member?.role === "owner";
    }
  }

  const items = await getRoadmapItems(organization.id);
  const sections = getPortalSections(organizationSlug, context.modules);

  return (
    <PortalLayout
      organizationName={organization.name}
      organizationSlug={organizationSlug}
      sections={sections}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-2">
              See what we&apos;re working on and what&apos;s coming next.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg">{t("subscribeToUpdates")}</Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href={`/${organizationSlug}`}>{t("submitFeedback")}</Link>
            </Button>
          </div>
        </div>

        <RoadmapBoard items={items} isAdmin={isAdmin} />
      </div>
    </PortalLayout>
  );
}
