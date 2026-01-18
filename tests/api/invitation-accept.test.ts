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
import { buildAcceptInvitationHandler } from "@/app/api/invitations/accept/handler";
import { invitations, organizationMembers } from "@/lib/db/schema";

type FakeDeps = Parameters<typeof buildAcceptInvitationHandler>[0];

type SelectReturn<T> = {
  from: () => {
    where: () => {
      limit: (count: number) => Promise<T[]>;
    };
  };
};

type InsertReturn = {
  values: (values: Record<string, unknown>) => Promise<unknown>;
};

type UpdateReturn = {
  set: (values: Record<string, unknown>) => {
    where: () => Promise<unknown>;
  };
};

const now = new Date("2026-01-01T00:00:00.000Z");

const makeDeps = () => {
  const auth: FakeDeps["auth"] = {
    api: {
      getSession: async () => ({ user: { id: "user_1" } }),
    },
  };

  let invitationRecord: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
    acceptedAt: Date | null;
  } | null = {
    id: "inv_1",
    organizationId: "org_1",
    email: "test@example.com",
    role: "member",
    token: "token_123",
    expiresAt: new Date("2026-01-10T00:00:00.000Z"),
    acceptedAt: null,
  };

  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => (invitationRecord ? [invitationRecord] : []),
      }),
    }),
  });

  let insertedMember: Record<string, unknown> | null = null;
  let updatedInvitation: Record<string, unknown> | null = null;

  const insert = (table?: unknown) => ({
    values: async (values: Record<string, unknown>) => {
      if (table === organizationMembers) {
        insertedMember = values;
      }
      return {};
    },
  });

  const update = (table?: unknown) => ({
    set: (values: Record<string, unknown>) => {
      if (table === invitations) {
        updatedInvitation = values;
      }
      return {
        where: async () => ({}),
      };
    },
  });

  const db: FakeDeps["db"] = {
    select: select as unknown as () => SelectReturn<typeof invitationRecord>,
    transaction: async (fn) =>
      fn({
        insert: insert as unknown as () => InsertReturn,
        update: update as unknown as () => UpdateReturn,
      }),
  };

  return {
    auth,
    db,
    setInvitation: (next: typeof invitationRecord) => {
      invitationRecord = next;
    },
    getInsertedMember: () => insertedMember,
    getUpdatedInvitation: () => updatedInvitation,
  } satisfies FakeDeps & {
    setInvitation: (next: typeof invitationRecord) => void;
    getInsertedMember: () => Record<string, unknown> | null;
    getUpdatedInvitation: () => Record<string, unknown> | null;
  };
};

describe("POST /api/invitations/accept", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildAcceptInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token_123" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for invalid token", async () => {
    const deps = makeDeps();
    deps.setInvitation(null);
    const handler = buildAcceptInvitationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: "missing" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 410 for expired token", async () => {
    const deps = makeDeps();
    deps.setInvitation({
      id: "inv_1",
      organizationId: "org_1",
      email: "test@example.com",
      role: "member",
      token: "token_123",
      expiresAt: new Date("2025-12-01T00:00:00.000Z"),
      acceptedAt: null,
    });
    const handler = buildAcceptInvitationHandler(deps, () => now);
    const res = await handler(
      new Request("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token_123" }),
      }),
    );
    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.error).toBe("邀请已过期");
  });

  it("returns 409 for already accepted invitations", async () => {
    const deps = makeDeps();
    deps.setInvitation({
      id: "inv_1",
      organizationId: "org_1",
      email: "test@example.com",
      role: "member",
      token: "token_123",
      expiresAt: new Date("2026-01-10T00:00:00.000Z"),
      acceptedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    const handler = buildAcceptInvitationHandler(deps, () => now);
    const res = await handler(
      new Request("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token_123" }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it("adds member and marks accepted", async () => {
    const deps = makeDeps();
    const handler = buildAcceptInvitationHandler(deps, () => now);
    const res = await handler(
      new Request("http://localhost/api/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token_123" }),
      }),
    );
    expect(res.status).toBe(200);
    const member = deps.getInsertedMember();
    expect(member?.organizationId).toBe("org_1");
    expect(member?.userId).toBe("user_1");
    expect(member?.role).toBe("member");

    const updated = deps.getUpdatedInvitation();
    expect(updated?.acceptedAt).toEqual(now);
  });
});
