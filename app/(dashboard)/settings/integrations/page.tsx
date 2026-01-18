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

export async function generateMetadata() {
  const t = await getTranslations("settings.integrations");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function IntegrationsSettingsPage() {
  const t = await getTranslations("settings.integrations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>{t("availableTitle")}</CardTitle>
          <CardDescription>{t("availableDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                  <span className="text-lg">🔗</span>
                </div>
                <div>
                  <h4 className="font-medium">{t("slack")}</h4>
                  <p className="text-sm text-muted-foreground">{t("slackDesc")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <h4 className="font-medium">{t("jira")}</h4>
                  <p className="text-sm text-muted-foreground">{t("jiraDesc")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <h4 className="font-medium">{t("linear")}</h4>
                  <p className="text-sm text-muted-foreground">{t("linearDesc")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <h4 className="font-medium">{t("discord")}</h4>
                  <p className="text-sm text-muted-foreground">{t("discordDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
