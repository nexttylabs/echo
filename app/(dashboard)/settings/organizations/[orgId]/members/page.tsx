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

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { OrganizationMembersList } from "@/components/settings/organization-members-list";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { organizationMembers, user } from "@/lib/db/schema";

export default async function OrganizationMembersPage({
  params,
}: {
  params: { orgId: string };
}) {
  const { orgId } = await Promise.resolve(params);
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user.id ?? null;

  const members = db
    ? await db
        .select({
          userId: organizationMembers.userId,
          role: organizationMembers.role,
          name: user.name,
          email: user.email,
        })
        .from(organizationMembers)
        .leftJoin(user, eq(user.id, organizationMembers.userId))
        .where(eq(organizationMembers.organizationId, orgId))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            成员管理
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            管理当前组织成员并发送新的邀请
          </p>
        </div>

        <InviteMemberForm organizationId={orgId} />
        <OrganizationMembersList
          organizationId={orgId}
          currentUserId={currentUserId}
          initialMembers={members}
        />
      </div>
    </div>
  );
}
