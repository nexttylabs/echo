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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalAccessForm } from "@/components/portal/settings-forms";
import { getPortalAdminContext } from "@/lib/portal/settings-context";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Portal Access - Echo",
};

export default async function PortalAccessSettingsPage() {
  const t = await getTranslations("settings.portal.access");
  const { organization, portalConfig } = await getPortalAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">控制 Portal 的公开访问与权限范围</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>可见性与权限</CardTitle>
          <CardDescription>设置公开访问、投票与索引策略</CardDescription>
        </CardHeader>
        <CardContent>
          <PortalAccessForm
            organizationId={organization.id}
            initialSharing={portalConfig?.sharing}
            initialSeo={portalConfig?.seo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
