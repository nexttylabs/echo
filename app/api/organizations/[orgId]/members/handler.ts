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

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { db as database } from "@/lib/db";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { organizationMembers, user } from "@/lib/db/schema";

type Database = NonNullable<typeof database>;

type ListMembersDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
  };
};

type ListMembersParams = { orgId: string };

type ListMembersContext = {
  params: ListMembersParams | Promise<ListMembersParams>;
};

export function buildListMembersHandler(deps: ListMembersDeps) {
  return async function GET(req: Request, context: ListMembersContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await Promise.resolve(context.params);

    try {
      await assertOrganizationAccess(deps.db, session.user.id, orgId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await deps.db
      .select({
        userId: organizationMembers.userId,
        displayName: user.name,
        email: user.email,
        avatarUrl: user.image,
      })
      .from(organizationMembers)
      .innerJoin(user, eq(organizationMembers.userId, user.id))
      .where(eq(organizationMembers.organizationId, orgId));

    const data = rows.map((row) => ({
      userId: row.userId,
      displayName: row.displayName ?? row.email ?? "未知成员",
      avatarUrl: row.avatarUrl ?? null,
    }));

    return NextResponse.json({ data }, { status: 200 });
  };
}
