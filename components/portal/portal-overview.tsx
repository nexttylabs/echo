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

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalModulesPanel } from "@/components/portal/portal-modules-panel";
import { getDefaultPortalModules } from "@/lib/portal/modules";
import type { PortalConfig } from "@/lib/db/schema";

interface PortalOverviewProps {
  portalLink: string;
  portalConfig: PortalConfig | null;
  organizationId: string;
}

export async function PortalOverview({
  portalLink,
  portalConfig,
  organizationId,
}: PortalOverviewProps) {
  const t = await getTranslations("settings.portal.overview");

  const portalEnabled = portalConfig?.sharing?.enabled ?? true;
  const themeSummary = portalConfig?.theme?.primaryColor
    ? t("themeSummary.custom", { color: portalConfig.theme.primaryColor })
    : t("themeSummary.default");
  const languageSummary = portalConfig?.defaultLanguage ?? "zh-CN";
  const seoSummary = portalConfig?.seo?.metaTitle
    ? portalConfig.seo.metaTitle
    : t("seoSummary.unset");

  const modules = portalConfig?.modules ?? getDefaultPortalModules();

  return (
    <div className="space-y-8">
      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">{t("status.title")}</CardTitle>
            <CardDescription>{t("status.description")}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={portalEnabled ? "default" : "outline"}>
              {portalEnabled ? t("status.badgeEnabled") : t("status.badgeDisabled")}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={portalLink}>{t("status.preview")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={portalLink}>{t("status.open")}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600">
            {t("status.portalLink")}{" "}
            <span className="font-medium text-slate-900">{portalLink}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <PortalGroupCard
          title={t("cards.experience.title")}
          description={t("cards.experience.description")}
          items={[
            themeSummary,
            portalConfig?.copy?.title
              ? t("cards.experience.items.copyTitle", { title: portalConfig.copy.title })
              : t("cards.experience.items.copyTitleUnset"),
            t("cards.experience.items.defaultLanguage", { locale: languageSummary }),
          ]}
          href={`/settings/portal-branding`}
          actionLabel={t("cards.action")}
        />
        <PortalGroupCard
          title={t("cards.growth.title")}
          description={t("cards.growth.description")}
          items={[
            seoSummary,
            portalConfig?.sharing?.socialSharing
              ? t("cards.growth.items.socialSharingEnabled")
              : t("cards.growth.items.socialSharingDisabled"),
            portalConfig?.seo?.ogImage
              ? t("cards.growth.items.ogImageSet")
              : t("cards.growth.items.ogImageUnset"),
          ]}
          href={`/settings/portal-growth`}
          actionLabel={t("cards.action")}
        />
        <PortalGroupCard
          title={t("cards.visibility.title")}
          description={t("cards.visibility.description")}
          items={[
            portalEnabled ? t("cards.visibility.items.portalEnabled") : t("cards.visibility.items.portalDisabled"),
            portalConfig?.sharing?.allowPublicVoting
              ? t("cards.visibility.items.publicVotingEnabled")
              : t("cards.visibility.items.publicVotingDisabled"),
            portalConfig?.seo?.noIndex
              ? t("cards.visibility.items.noIndex")
              : t("cards.visibility.items.index"),
          ]}
          href={`/settings/portal-access`}
          actionLabel={t("cards.action")}
        />
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              {t("modules.badge")}
            </span>
            {t("modules.summary")}
          </span>
        </summary>
        <div className="mt-4">
          <PortalModulesPanel organizationId={organizationId} initialModules={modules} />
        </div>
      </details>
    </div>
  );
}

function PortalGroupCard({
  title,
  description,
  items,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  items: string[];
  href: string;
  actionLabel: string;
}) {
  return (
    <Card className="border-slate-200/80 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
