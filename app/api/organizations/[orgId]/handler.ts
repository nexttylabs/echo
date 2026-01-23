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
import { eq, and } from "drizzle-orm";
import { createOrganizationSchema } from "@/lib/validations/organizations";
import { organizations, organizationMembers } from "@/lib/db/schema";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type OrganizationDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string; role?: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
    update: Database["update"];
  };
};

type RouteContext = {
  params: Promise<{ orgId: string }>;
};

export function buildGetOrganizationHandler(deps: OrganizationDeps) {
  return async function GET(req: Request, context: RouteContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;

    const [org] = await deps.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ data: org });
  };
}

export function buildUpdateOrganizationHandler(deps: OrganizationDeps) {
  return async function PUT(req: Request, context: RouteContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;

    // Check if user is admin of this organization or system admin
    const [membership] = await deps.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (membership && membership.role !== "admin" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = createOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { name, description } = parsed.data;

    const [updated] = await deps.db
      .update(organizations)
      .set({ name, description })
      .where(eq(organizations.id, orgId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  };
}
