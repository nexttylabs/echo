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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortalAdminContext } from "@/lib/portal/settings-context";

export const metadata = {
  title: "Portal Resources - Echo",
};

export default async function PortalResourcesSettingsPage() {
  const { organization, portalConfig } = await getPortalAdminContext();
  const portalLink = `/${organization.slug}`;
  const portalEnabled = portalConfig?.sharing?.enabled ?? true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Resources</h1>
        <p className="text-muted-foreground">门户入口与相关资源链接</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Portal 链接</CardTitle>
            <CardDescription>当前组织的公开访问入口</CardDescription>
          </div>
          <Badge variant={portalEnabled ? "default" : "outline"}>
            {portalEnabled ? "公开中" : "已关闭"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600">
            门户链接：<span className="font-medium text-slate-900">{portalLink}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={portalLink}>预览 Portal</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={portalLink}>打开 Portal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
