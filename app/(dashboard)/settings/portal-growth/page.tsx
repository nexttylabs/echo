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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SeoForm, SharingForm } from "@/components/portal/settings-forms";
import { getPortalAdminContext } from "@/lib/portal/settings-context";

export const metadata = {
  title: "Portal Growth - Echo",
};

export default async function PortalGrowthSettingsPage() {
  const { organization, portalConfig } = await getPortalAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Growth</h1>
        <p className="text-muted-foreground">配置分享入口与 SEO 优化</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>分享设置</CardTitle>
          <CardDescription>配置社交分享与传播渠道</CardDescription>
        </CardHeader>
        <CardContent>
          <SharingForm organizationId={organization.id} initialData={portalConfig?.sharing} />
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>SEO 设置</CardTitle>
          <CardDescription>搜索引擎与社交分享优化</CardDescription>
        </CardHeader>
        <CardContent>
          <SeoForm organizationId={organization.id} initialData={portalConfig?.seo} showNoIndex={false} />
        </CardContent>
      </Card>
    </div>
  );
}
