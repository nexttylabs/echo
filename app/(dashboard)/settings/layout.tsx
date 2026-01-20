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
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { SettingsSidebar } from "@/components/settings";
import { getUserOrganizations } from "@/lib/auth/organization";
import type { UserRole } from "@/lib/auth/permissions";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  // Get user role from current organization (same logic as dashboard layout)
  let userRole: UserRole = "customer";
  
  if (db) {
    const organizations = await getUserOrganizations(db, session.user.id);
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get("orgId")?.value ?? null;
    
    // Check if the cookie org exists in user's organizations
    // If not, fall back to the first available organization
    let currentOrg = cookieOrgId 
      ? organizations.find((org) => org.id === cookieOrgId) 
      : null;
    
    // Fallback to first org if cookie org is not found (stale cookie)
    if (!currentOrg && organizations.length > 0) {
      currentOrg = organizations[0];
    }
    
    userRole = (currentOrg?.role as UserRole) || "customer";
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SettingsSidebar userRole={userRole} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

