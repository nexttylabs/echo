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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getUserOrganization } from "@/lib/auth/organization";
import { db } from "@/lib/db";
import { getPortalSettings } from "@/lib/services/portal-settings";
import type { UserRole } from "@/lib/auth/permissions";

export async function getPortalAdminContext() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (!db) {
    throw new Error("Database connection not available");
  }

  const organization = await getUserOrganization(db, session.user.id);
  if (!organization) {
    redirect("/settings/organizations/new");
  }

  const resolvedRole = (organization.role as UserRole) ?? "customer";
  const isAdminOrPM = resolvedRole === "admin" || resolvedRole === "product_manager";

  if (!isAdminOrPM) {
    redirect("/settings/profile");
  }

  const portalConfig = await getPortalSettings(organization.id);

  return {
    organization,
    portalConfig,
    role: resolvedRole,
  };
}
