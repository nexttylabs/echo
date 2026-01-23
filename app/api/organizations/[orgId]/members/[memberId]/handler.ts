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

import { NextResponse } from "next/server";
import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import type { db as database } from "@/lib/db";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { organizationMembers } from "@/lib/db/schema";
import { organizationMemberRoleSchema } from "@/lib/validations/organizations";

type Database = NonNullable<typeof database>;

type RemoveMemberDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
    delete: Database["delete"];
    update?: Database["update"];
  };
};

type RemoveMemberParams = { orgId: string; memberId: string };

type RemoveMemberContext = {
  params: RemoveMemberParams | Promise<RemoveMemberParams>;
};

const updateRoleSchema = z.object({
  role: organizationMemberRoleSchema,
});

export function buildRemoveMemberHandler(deps: RemoveMemberDeps) {
  return async function DELETE(req: Request, context: RemoveMemberContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, memberId } = await Promise.resolve(context.params);

    if (memberId === session.user.id) {
      return NextResponse.json({ error: "不能移除自己" }, { status: 400 });
    }

    let requester;
    try {
      requester = await assertOrganizationAccess(deps.db, session.user.id, orgId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [target] = await deps.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const [adminCount] = await deps.db
      .select({ count: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.role, "admin"),
        ),
      );

    if (target.role === "admin" && adminCount.count === 1) {
      return NextResponse.json(
        { error: "组织至少需要一个管理员" },
        { status: 400 },
      );
    }

    await deps.db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      );

    return NextResponse.json({ message: "成员已移除" }, { status: 200 });
  };
}

type UpdateMemberRoleDeps = Omit<RemoveMemberDeps, "db"> & {
  db: {
    select: Database["select"];
    update: Database["update"];
  };
};

export function buildUpdateMemberRoleHandler(deps: UpdateMemberRoleDeps) {
  return async function PUT(req: Request, context: RemoveMemberContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { role } = parsed.data;
    const { orgId, memberId } = await Promise.resolve(context.params);

    let requester;
    try {
      requester = await assertOrganizationAccess(deps.db, session.user.id, orgId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [target] = await deps.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const [adminCount] = await deps.db
      .select({ count: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.role, "admin"),
        ),
      );

    if (target.role === "admin" && role !== "admin" && adminCount.count === 1) {
      return NextResponse.json(
        { error: "组织至少需要一个管理员" },
        { status: 400 },
      );
    }

    const [updated] = await deps.db
      .update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      )
      .returning();

    return NextResponse.json({ data: updated }, { status: 200 });
  };
}
