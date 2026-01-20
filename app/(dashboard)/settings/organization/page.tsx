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
import { OrganizationForm } from "@/components/settings/organization-form";
import { OrganizationMembersList } from "@/components/settings/organization-members-list";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import type { UserRole } from "@/lib/auth/permissions";
import { organizationMembers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "组织管理 - Echo",
};

export default async function OrganizationSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (!db) {
      throw new Error("Database connection not available");
  }

  // Get all user organizations and find current one
  const organizations = await getUserOrganizations(db, session.user.id);
  
  if (organizations.length === 0) {
    redirect("/settings/organizations/new");
  }

  // Get current organization from cookie
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get("orgId")?.value ?? null;
  const currentOrgId = cookieOrgId || organizations[0]?.id || null;
  
  // Find the current organization and get role from it
  const organization = organizations.find(org => org.id === currentOrgId) || organizations[0];
  const userRole = (organization?.role as UserRole) || "customer";

  if (userRole !== "owner" && userRole !== "admin") {
    redirect("/settings/profile");
  }

  if (!organization) {
    redirect("/settings/organizations/new");
  }

  const members = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      name: user.name,
      email: user.email,
    })
    .from(organizationMembers)
    .innerJoin(user, eq(organizationMembers.userId, user.id))
    .where(eq(organizationMembers.organizationId, organization.id));

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">组织管理</h1>
        <p className="text-muted-foreground">管理您的组织信息和成员</p>
      </div>

      <OrganizationForm
        organizationId={organization.id}
        initialName={organization.name}
        initialSlug={organization.slug}
        initialDescription={organization.description ?? ""}
      />

      <InviteMemberForm organizationId={organization.id} />

      <OrganizationMembersList 
        organizationId={organization.id} 
        currentUserId={session.user.id}
        initialMembers={members}
      />
    </div>
  );
}
