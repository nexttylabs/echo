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

import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyForm, ThemeForm } from "@/components/portal/settings-forms";
import { getPortalAdminContext } from "@/lib/portal/settings-context";

export async function generateMetadata() {
  const t = await getTranslations("settings.branding");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function BrandingSettingsPage() {
  const { organization, portalConfig } = await getPortalAdminContext();
  const t = await getTranslations("settings.branding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>{t("themeTitle")}</CardTitle>
          <CardDescription>{t("themeDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeForm organizationId={organization.id} initialData={portalConfig?.theme} />
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>{t("copyTitle")}</CardTitle>
          <CardDescription>{t("copyDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CopyForm organizationId={organization.id} initialData={portalConfig?.copy} />
        </CardContent>
      </Card>
    </div>
  );
}
