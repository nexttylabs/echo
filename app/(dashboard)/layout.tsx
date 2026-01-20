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
import { getUserOrganizations } from "@/lib/auth/organization";
import { DashboardLayout } from "@/components/layout";
import type { UserRole } from "@/lib/auth/permissions";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch organizations
  let organizations: Array<{ id: string; name: string; slug: string; role: string }> = [];
  let currentOrgId: string | null = null;

  if (db) {
    organizations = await getUserOrganizations(db, session.user.id);
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get("orgId")?.value ?? null;
    currentOrgId = cookieOrgId || organizations[0]?.id || null;
  }

  // Get user role from current organization membership
  const currentOrg = organizations.find((org) => org.id === currentOrgId);
  const userRole = (currentOrg?.role as UserRole) || "customer";

  return (
    <DashboardLayout
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: userRole,
      }}
      organizations={organizations}
      currentOrgId={currentOrgId}
    >
      {children}
    </DashboardLayout>
  );
}
