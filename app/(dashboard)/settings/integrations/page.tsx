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

import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { GitHubIntegrationClient } from "./github-integration-client";

export async function generateMetadata() {
  const t = await getTranslations("settings.integrations");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default async function IntegrationsSettingsPage() {
  const t = await getTranslations("settings.integrations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      {/* GitHub Integration Card */}
      <Suspense fallback={<LoadingCard />}>
        <GitHubIntegrationClient />
      </Suspense>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-medium">{t("comingSoon.title")}</h4>
            <p className="text-sm text-muted-foreground">{t("comingSoon.description")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
