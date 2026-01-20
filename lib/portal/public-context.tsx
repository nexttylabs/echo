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

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, organizationSettings } from "@/lib/db/schema";
import type { PortalConfig } from "@/lib/db/schema";
import type { PortalSection } from "@/components/portal/portal-tab-nav";
import { FileText, Map, MessageSquare } from "lucide-react";

export type PortalModulesConfig = NonNullable<PortalConfig["modules"]>;

const defaultModules: PortalModulesConfig = {
  feedback: true,
  roadmap: true,
  changelog: true,
  help: true,
};

export async function getPortalPublicContext(organizationSlug: string) {
  if (!db) return null;

  // Skip static asset paths that shouldn't be treated as org slugs
  if (organizationSlug.includes('.') || /^(api|_next|favicon|apple-touch-icon|robots|sitemap)/.test(organizationSlug)) {
    return null;
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, organizationSlug),
  });

  if (!organization) return null;

  const [settings] = await db
    .select({ portalConfig: organizationSettings.portalConfig })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organization.id))
    .limit(1);

  const portalConfig = settings?.portalConfig ?? {};
  const portalEnabled = portalConfig?.sharing?.enabled ?? true;
  const modules = {
    ...defaultModules,
    ...(portalConfig.modules ?? {}),
  };

  const sharing = {
    allowPublicVoting: portalConfig?.sharing?.allowPublicVoting ?? true,
    allowPublicComments: portalConfig?.sharing?.allowPublicComments ?? false,
    showVoteCount: portalConfig?.sharing?.showVoteCount ?? true,
    showAuthor: portalConfig?.sharing?.showAuthor ?? false,
  };

  const seo = {
    noIndex: portalConfig?.seo?.noIndex ?? false,
  };

  return {
    organization,
    portalConfig,
    portalEnabled,
    modules,
    sharing,
    seo,
  };
}

export function getPortalSections(
  organizationSlug: string,
  modules: PortalModulesConfig,
): PortalSection[] {
  const baseHref = `/${organizationSlug}`;
  const sections: PortalSection[] = [];

  if (modules.feedback) {
    sections.push({
      label: "Feedback",
      href: baseHref,
      exact: true,
      icon: <MessageSquare className="h-4 w-4" />,
    });
  }

  if (modules.roadmap) {
    sections.push({
      label: "Roadmap",
      href: `${baseHref}/roadmap`,
      icon: <Map className="h-4 w-4" />,
    });
  }

  if (modules.changelog) {
    sections.push({
      label: "Changelog",
      href: `${baseHref}/changelog`,
      icon: <FileText className="h-4 w-4" />,
    });
  }

  return sections;
}
