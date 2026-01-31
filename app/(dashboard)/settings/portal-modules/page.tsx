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
import { PortalModulesPanel } from "@/components/portal/portal-modules-panel";
import { getDefaultPortalModules } from "@/lib/portal/modules";
import { getPortalAdminContext } from "@/lib/portal/settings-context";

export const metadata = {
  title: "Portal Modules - Echo",
};

export default async function PortalModulesSettingsPage() {
  const { organization, portalConfig } = await getPortalAdminContext();
  const modules = portalConfig?.modules ?? getDefaultPortalModules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portal Modules</h1>
        <p className="text-muted-foreground">自定义 Portal 的功能模块开关</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模块配置</CardTitle>
          <CardDescription>按需启用反馈、路线图与更新日志</CardDescription>
        </CardHeader>
        <CardContent>
          <PortalModulesPanel organizationId={organization.id} initialModules={modules} />
        </CardContent>
      </Card>
    </div>
  );
}
