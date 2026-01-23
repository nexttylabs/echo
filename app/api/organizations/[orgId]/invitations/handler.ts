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
import { randomBytes, randomUUID } from "crypto";
import type { db as database } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { buildInviteExpiry } from "@/lib/invitations";
import { sendEmail } from "@/lib/services/email";
import { createInvitationSchema } from "@/lib/validations/invitations";

type Database = NonNullable<typeof database>;

type CreateInvitationDeps = {
  auth: {
    api: {
      getSession: (args: { headers: Headers }) => Promise<{ user: { id: string } } | null>;
    };
  };
  db: {
    select: Database["select"];
    insert: Database["insert"];
  };
  email?: {
    sendEmail: typeof sendEmail;
  };
};

type InvitationParams = { orgId: string };

type InvitationContext = {
  params: InvitationParams | Promise<InvitationParams>;
};

export function buildCreateInvitationHandler(deps: CreateInvitationDeps) {
  return async function POST(req: Request, context: InvitationContext) {
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

    const parsed = createInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { email, role } = parsed.data;
    const { orgId } = await Promise.resolve(context.params);

    let member;
    try {
      member = await assertOrganizationAccess(deps.db, session.user.id, orgId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null);
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 },
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = buildInviteExpiry(new Date());

    const [invitation] = await deps.db
      .insert(invitations)
      .values({
        id: randomUUID(),
        organizationId: orgId,
        email,
        role,
        token,
        expiresAt,
      })
      .returning();

    const inviteUrl = `${baseUrl}/invite/${token}`;
    const mailer = deps.email?.sendEmail ?? sendEmail;
    await mailer({
      to: email,
      subject: "加入组织的邀请",
      html: `<p>点击链接接受邀请：<a href="${inviteUrl}">${inviteUrl}</a></p>`,
    });

    return NextResponse.json({ data: invitation }, { status: 201 });
  };
}
