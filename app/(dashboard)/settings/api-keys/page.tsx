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

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ApiKeysList } from "@/components/settings/api-keys-list";
import { getUserRoleInOrganization } from "@/lib/auth/organization";
import type { UserRole } from "@/lib/auth/permissions";

export async function generateMetadata() {
  const t = await getTranslations("settings.apiKeys");
  return {
    title: `${t("pageTitle")} - Echo`,
  };
}

export default async function ApiKeysSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const t = await getTranslations("settings.apiKeys");

  if (!session?.user) {
    redirect("/login");
  }

  // Get user role from current organization
  const cookieStore = await cookies();
  const currentOrgId = cookieStore.get("orgId")?.value;

  let userRole: UserRole = "customer";
  if (db && currentOrgId) {
    const role = await getUserRoleInOrganization(db, session.user.id, currentOrgId);
    userRole = role || "customer";
  }

  if (userRole !== "owner" && userRole !== "admin" && userRole !== "product_manager") {
    redirect("/settings/profile");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <ApiKeysList />
    </div>
  );
}
