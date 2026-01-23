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

import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getDashboardStats, type DashboardStats } from "@/lib/dashboard/get-dashboard-stats";
import { getUserOrganizations } from "@/lib/auth/organization";
import { getOrgContext } from "@/lib/auth/org-context";
import { StatsCards, RecentFeedbackList, StatusChart } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/auth/permissions";

interface PageProps {
  searchParams?: Promise<{ organizationId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: headerList });
  const userRole = (session?.user as { role?: string } | undefined)?.role as UserRole || "customer";
  const t = await getTranslations("dashboard");
  const params = await searchParams;

  let stats: DashboardStats = {
    totalFeedback: 0,
    pendingFeedback: 0,
    weeklyFeedback: 0,
    resolvedFeedback: 0,
    statusDistribution: [],
    recentFeedback: [],
  };

  let organizationSlug: string | null = null;
  let organizations: Array<{ id: string; name: string; slug: string; role: string }> = [];
  let shouldPersistDefaultOrg = false;

  if (db && session?.user) {
    try {
      organizations = await getUserOrganizations(db, session.user.id);
      const queryOrgId = params?.organizationId ?? null;
      const cookieOrgId = cookieStore.get("orgId")?.value ?? null;
      const fallbackOrgId = organizations[0]?.id ?? null;
      const resolvedOrgId = queryOrgId || cookieOrgId || fallbackOrgId;

      shouldPersistDefaultOrg = !queryOrgId && !cookieOrgId && !!fallbackOrgId;

      // Persist default org via cookie if needed
      if (shouldPersistDefaultOrg && fallbackOrgId) {
        // Cookie will be set by the layout
      }

      if (resolvedOrgId) {
        const url = new URL("http://localhost/dashboard");
        if (queryOrgId) {
          url.searchParams.set("organizationId", queryOrgId);
        }
        const context = await getOrgContext({
          request: { nextUrl: url, headers: headerList, cookies: cookieStore },
          db,
          userId: session.user.id,
          organizationId: resolvedOrgId,
          requireMembership: true,
        });

        organizationSlug = organizations.find((org) => org.id === context.organizationId)?.slug ?? null;

        stats = await getDashboardStats(db, {
          userId: session.user.id,
          userRole,
          organizationId: context.organizationId,
        });
      }
    } catch {
      // Failed to fetch stats, use defaults
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground">{t("pageDescription")}</p>
        </div>
        <div className="flex items-center gap-3">
          {organizationSlug && (
            <Button asChild variant="outline">
              <Link href={`/${organizationSlug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("visitPortal")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <StatsCards
        totalFeedback={stats.totalFeedback}
        pendingFeedback={stats.pendingFeedback}
        weeklyFeedback={stats.weeklyFeedback}
        resolvedFeedback={stats.resolvedFeedback}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentFeedbackList feedback={stats.recentFeedback} />
        </div>
        <div>
          <StatusChart data={stats.statusDistribution} />
        </div>
      </div>
    </div>
  );
}
