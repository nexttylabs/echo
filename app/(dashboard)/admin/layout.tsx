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
import { getUserRoleInOrganization } from "@/lib/auth/organization";

export default async function AdminLayout({
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

  // Get current organization ID from cookie
  const cookieStore = await cookies();
  const currentOrgId = cookieStore.get("orgId")?.value;

  if (!db || !currentOrgId) {
    redirect("/no-access");
  }

  // Get user's role in the current organization
  const role = await getUserRoleInOrganization(db, session.user.id, currentOrgId);

  // Only admin or owner can access admin pages
  if (role !== "admin" && role !== "owner" && role !== "product_manager") {
    redirect("/no-access");
  }

  return <>{children}</>;
}

