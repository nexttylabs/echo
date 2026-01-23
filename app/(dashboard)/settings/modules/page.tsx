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

import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalModulesPanel } from "@/components/portal/portal-modules-panel";
import { getDefaultPortalModules } from "@/lib/portal/modules";
import { getPortalAdminContext } from "@/lib/portal/settings-context";

export async function generateMetadata() {
  const t = await getTranslations("settings.modules");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function ModulesSettingsPage() {
  const { organization, portalConfig } = await getPortalAdminContext();
  const modules = portalConfig?.modules ?? getDefaultPortalModules();
  const t = await getTranslations("settings.modules");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>{t("configTitle")}</CardTitle>
          <CardDescription>{t("configDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PortalModulesPanel organizationId={organization.id} initialModules={modules} />
        </CardContent>
      </Card>
    </div>
  );
}
