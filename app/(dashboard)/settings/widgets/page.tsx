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

export async function generateMetadata() {
  const t = await getTranslations("settings.widgets");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function WidgetsSettingsPage() {
  const t = await getTranslations("settings.widgets");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("feedbackWidget")}</CardTitle>
          <CardDescription>{t("feedbackWidgetDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t("feedbackWidgetComingSoon")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("changelogWidget")}</CardTitle>
          <CardDescription>{t("changelogWidgetDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t("changelogWidgetComingSoon")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
