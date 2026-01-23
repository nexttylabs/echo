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

import { notFound } from "next/navigation";
import { PortalLayout } from "@/components/portal/portal-layout";
import { ChangelogList } from "@/components/portal/changelog-list";
import type { ChangelogItem } from "@/components/portal/changelog-entry";
import { Button } from "@/components/ui/button";
import { getPortalPublicContext, getPortalSections } from "@/lib/portal/public-context";
import { getTranslations } from "next-intl/server";

type PageProps = {
  params: Promise<{ organizationSlug: string }>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getChangelogEntries(_organizationId: string): Promise<ChangelogItem[]> {
  // TODO: Implement actual changelog query from database
  // For now, return sample data
  return [
    {
      id: "1",
      title: "New Feedback Portal Design",
      content: "<p>We've completely redesigned the feedback portal with a modern, clean interface. The new design features improved navigation, better organization of content, and enhanced readability.</p>",
      type: "feature",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "2", 
      title: "Roadmap Kanban View",
      content: "<p>You can now view the product roadmap in a beautiful Kanban-style board with columns for Backlog, Next Up, In Progress, and Done.</p>",
      type: "feature",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Performance Improvements",
      content: "<p>Significant performance improvements across the entire portal. Pages now load 40% faster.</p>",
      type: "improvement",
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { organizationSlug } = await params;
  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled) {
    return { title: "Not Found" };
  }

  return {
    title: `Changelog - ${organization.name}`,
    description: `Latest updates and announcements from ${organization.name}`,
  };
}

export default async function OrganizationChangelogPage({ params }: PageProps) {
  const t = await getTranslations("portal.changelog");
  const { organizationSlug } = await params;

  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled || !context.modules.changelog) {
    notFound();
  }

  const entries = await getChangelogEntries(organization.id);
  const sections = getPortalSections(organizationSlug, context.modules);

  return (
    <PortalLayout
      organizationName={organization.name}
      organizationSlug={organizationSlug}
      sections={sections}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-2">
              Stay up to date with the latest updates and improvements.
            </p>
          </div>
          <Button size="lg">{t("subscribeToUpdates")}</Button>
        </div>

        <ChangelogList entries={entries} />
      </div>
    </PortalLayout>
  );
}
