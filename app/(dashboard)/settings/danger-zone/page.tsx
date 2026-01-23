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
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("settings.dangerZone");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function DangerZoneSettingsPage() {
  const t = await getTranslations("settings.dangerZone");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{t("deleteOrg")}</CardTitle>
          </div>
          <CardDescription>
            {t("deleteOrgDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            {t("deleteOrg")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{t("resetData")}</CardTitle>
          </div>
          <CardDescription>
            {t("resetDataDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            {t("resetData")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{t("transferOwnership")}</CardTitle>
          </div>
          <CardDescription>
            {t("transferOwnershipDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            {t("transferOwnership")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
