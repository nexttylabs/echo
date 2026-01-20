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
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { createOrganizationSchema } from "@/lib/validations/organizations";
import { organizations, organizationMembers } from "@/lib/db/schema";
import { generateSlug } from "@/lib/utils/slug";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type CreateOrganizationDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string; role?: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
    transaction: Database["transaction"];
  };
};

export function buildCreateOrganizationHandler(deps: CreateOrganizationDeps) {
  return async function POST(req: Request) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Any authenticated user can create organizations - they become the owner

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

    let slug = generateSlug(name);
    let counter = 0;
    while (true) {
      const existing = await deps.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!existing.length) break;
      counter += 1;
      slug = `${generateSlug(name)}-${counter}`;
    }

    const organizationId = randomUUID();

    const [org] = await deps.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(organizations)
        .values({ id: organizationId, name, slug, description })
        .returning();
      await tx.insert(organizationMembers).values({
        organizationId,
        userId: session.user.id,
        role: "owner",
      });
      return [created];
    });

    return NextResponse.json({ data: { ...org, description } }, { status: 201 });
  };
}
