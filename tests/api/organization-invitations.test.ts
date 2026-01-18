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

import { describe, expect, it } from "bun:test";
import { buildCreateInvitationHandler } from "@/app/api/organizations/[orgId]/invitations/handler";
import { invitations } from "@/lib/db/schema";

type FakeDeps = Parameters<typeof buildCreateInvitationHandler>[0];

type SelectReturn = {
  from: () => {
    where: () => {
      limit: (count: number) => Promise<Array<{ role: string }>>;
    };
  };
};

type InsertReturn = {
  values: (values: Record<string, unknown>) => {
    returning: () => Promise<Array<{ id: string }>>;
  };
};

const makeDeps = () => {
  const auth: FakeDeps["auth"] = {
    api: {
      getSession: async () => ({ user: { id: "user_1", role: "admin" } }),
    },
  };

  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => [{ role: "admin" }],
      }),
    }),
  });

  let invitationValues: Record<string, unknown> | null = null;
  let sentEmail: { to: string; subject: string; html: string } | null = null;

  const insert = (table?: unknown) => ({
    values: (values: Record<string, unknown>) => {
      if (table === invitations) {
        invitationValues = values;
      }
      return {
        returning: async () => [{ id: "inv_1" }],
      };
    },
  });

  const db: FakeDeps["db"] = {
    select: select as unknown as () => SelectReturn,
    insert: insert as unknown as () => InsertReturn,
  };

  const email: FakeDeps["email"] = {
    sendEmail: async (payload) => {
      sentEmail = payload;
    },
  };

  return {
    auth,
    db,
    email,
    getInvitationValues: () => invitationValues,
    getSentEmail: () => sentEmail,
  } satisfies FakeDeps & {
    getInvitationValues: () => Record<string, unknown> | null;
    getSentEmail: () => { to: string; subject: string; html: string } | null;
  };
};

const makeDepsWithRole = (role: string | null) => {
  const deps = makeDeps();
  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => (role ? [{ role }] : []),
      }),
    }),
  });
  deps.db.select = select as unknown as () => SelectReturn;
  return deps;
};

describe("POST /api/organizations/:orgId/invitations", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildCreateInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/invitations", { method: "POST" }),
      { params: { orgId: "org_1" } },
    );
    expect(res.status).toBe(401);
  });

  it("rejects non-admin members", async () => {
    const deps = makeDepsWithRole("member");
    const handler = buildCreateInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "member" }),
      }),
      { params: { orgId: "org_1" } },
    );
    expect(res.status).toBe(403);
  });

  it("rejects non-members", async () => {
    const deps = makeDepsWithRole(null);
    const handler = buildCreateInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "member" }),
      }),
      { params: { orgId: "org_1" } },
    );
    expect(res.status).toBe(403);
  });

  it("creates invitation and sends email", async () => {
    const deps = makeDeps();
    const handler = buildCreateInvitationHandler(deps);
    const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://app.test";

    try {
      const res = await handler(
        new Request("http://localhost/api/organizations/org_1/invitations", {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", role: "member" }),
        }),
        { params: { orgId: "org_1" } },
      );

      expect(res.status).toBe(201);
      const invitationValues = deps.getInvitationValues();
      expect(invitationValues?.organizationId).toBe("org_1");
      expect(invitationValues?.email).toBe("test@example.com");
      expect(invitationValues?.role).toBe("member");
      expect(typeof invitationValues?.token).toBe("string");
      expect(invitationValues?.token).toBeDefined();

      const sentEmail = deps.getSentEmail();
      expect(sentEmail?.to).toBe("test@example.com");
      expect(sentEmail?.subject).toBe("加入组织的邀请");
      expect(sentEmail?.html).toContain("http://app.test/invite/");
      expect(sentEmail?.html).toContain(String(invitationValues?.token));
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalUrl;
    }
  });

  it("returns 400 on invalid body", async () => {
    const deps = makeDeps();
    const handler = buildCreateInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/invitations", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email", role: "" }),
      }),
      { params: { orgId: "org_1" } },
    );
    expect(res.status).toBe(400);
  });
});
