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
import { eq } from "drizzle-orm";
import type { db as database } from "@/lib/db";
import { invitations, organizationMembers } from "@/lib/db/schema";

const TOKEN_REQUIRED = "Token is required";

type Database = NonNullable<typeof database>;

type AcceptInvitationDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
    transaction: Database["transaction"];
  };
};

type NowProvider = () => Date;

export function buildAcceptInvitationHandler(
  deps: AcceptInvitationDeps,
  nowProvider: NowProvider = () => new Date(),
) {
  return async function POST(req: Request) {
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

    if (!body || typeof body !== "object" || !("token" in body)) {
      return NextResponse.json({ error: TOKEN_REQUIRED }, { status: 400 });
    }

    const token = (body as { token?: unknown }).token;
    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ error: TOKEN_REQUIRED }, { status: 400 });
    }

    const [invitation] = await deps.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 });
    }

    const now = nowProvider();
    if (invitation.expiresAt <= now) {
      return NextResponse.json({ error: "邀请已过期" }, { status: 410 });
    }

    await deps.db.transaction(async (tx) => {
      await tx.insert(organizationMembers).values({
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: invitation.role,
      });

      await tx
        .update(invitations)
        .set({ acceptedAt: now })
        .where(eq(invitations.id, invitation.id));
    });

    return NextResponse.json({ message: "Invitation accepted" }, { status: 200 });
  };
}
