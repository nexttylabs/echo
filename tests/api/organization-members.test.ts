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

import { describe, expect, it } from "bun:test";
import { buildRemoveMemberHandler } from "@/app/api/organizations/[orgId]/members/[memberId]/handler";
import { buildUpdateMemberRoleHandler } from "@/app/api/organizations/[orgId]/members/[memberId]/handler";
import { organizationMembers } from "@/lib/db/schema";

type FakeDeps = Parameters<typeof buildRemoveMemberHandler>[0];

type SelectLimitReturn = {
  from: () => {
    where: () => {
      limit: (count: number) => Promise<Array<{ role: string }>>;
    };
  };
};

type SelectWhereReturn = {
  from: () => {
    where: () => Promise<Array<{ count: number }>>;
  };
};

type DeleteReturn = {
  where: () => Promise<void>;
};

type UpdateReturn = {
  set: () => {
    where: () => {
      returning: () => Promise<Array<{ userId: string; role: string }>>;
    };
  };
};

type DepsOptions = {
  sessionUserId?: string;
  requesterRole?: string | null;
  targetRole?: string | null;
  adminCount?: number;
};

const makeDeps = (options: DepsOptions = {}) => {
  const sessionUserId = options.sessionUserId ?? "user_1";
  const requesterRole =
    options.requesterRole === undefined ? "admin" : options.requesterRole;
  const targetRole =
    options.targetRole === undefined ? "member" : options.targetRole;
  const adminCount = options.adminCount ?? 1;

  const auth: FakeDeps["auth"] = {
    api: {
      getSession: async () => ({ user: { id: sessionUserId } }),
    },
  };

  const memberResults: Array<Array<{ role: string }>> = [
    requesterRole ? [{ role: requesterRole }] : [],
    targetRole ? [{ role: targetRole }] : [],
  ];

  const select = (fields?: unknown) => {
    if (fields) {
      return {
        from: () => ({
          where: async () => [{ count: adminCount }],
        }),
      };
    }

    return {
      from: () => ({
        where: () => ({
          limit: async () => memberResults.shift() ?? [],
        }),
      }),
    };
  };

  let deleteCalled = false;
  const del = (table?: unknown) => ({
    where: async () => {
      if (table === organizationMembers) {
        deleteCalled = true;
      }
    },
  });

  const db: FakeDeps["db"] = {
    select: select as unknown as () => SelectLimitReturn | SelectWhereReturn,
    delete: del as unknown as () => DeleteReturn,
  };

  return {
    auth,
    db,
    getDeleteCalled: () => deleteCalled,
  } satisfies FakeDeps & { getDeleteCalled: () => boolean };
};

const makeUpdateDeps = (
  options: DepsOptions & { updateResultRole?: string } = {},
) => {
  const base = makeDeps(options);
  const updateRole = options.updateResultRole ?? "developer";

  const update = () => ({
    set: () => ({
      where: () => ({
        returning: async () => [{ userId: "user_2", role: updateRole }],
      }),
    }),
  });

  base.db.update = update as unknown as () => UpdateReturn;

  return base;
};

describe("DELETE /api/organizations/:orgId/members/:memberId", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(401);
  });

  it("rejects non-admin members", async () => {
    const deps = makeDeps({ requesterRole: "member" });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(403);
  });

  it("rejects non-members", async () => {
    const deps = makeDeps({ requesterRole: null });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when target member missing", async () => {
    const deps = makeDeps({ targetRole: null });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(404);
  });

  it("blocks removing the last admin", async () => {
    const deps = makeDeps({ targetRole: "admin", adminCount: 1 });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("组织至少需要一个管理员");
  });

  it("blocks self removal", async () => {
    const deps = makeDeps({ sessionUserId: "user_2" });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("不能移除自己");
  });

  it("removes member when allowed", async () => {
    const deps = makeDeps({ targetRole: "member", adminCount: 2 });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(200);
    expect(deps.getDeleteCalled()).toBe(true);
  });

  it("allows removing an admin when more than one admin exists", async () => {
    const deps = makeDeps({ targetRole: "admin", adminCount: 2 });
    const handler = buildRemoveMemberHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "DELETE",
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(200);
    expect(deps.getDeleteCalled()).toBe(true);
  });
});

describe("PUT /api/organizations/:orgId/members/:memberId", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeUpdateDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(401);
  });

  it("rejects non-admin members", async () => {
    const deps = makeUpdateDeps({ requesterRole: "member" });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(403);
  });

  it("rejects non-members", async () => {
    const deps = makeUpdateDeps({ requesterRole: null });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid role", async () => {
    const deps = makeUpdateDeps();
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "guest" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when target member missing", async () => {
    const deps = makeUpdateDeps({ targetRole: null });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(404);
  });

  it("blocks demoting the last admin", async () => {
    const deps = makeUpdateDeps({ targetRole: "admin", adminCount: 1 });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("组织至少需要一个管理员");
  });

  it("updates role when allowed", async () => {
    const deps = makeUpdateDeps({
      targetRole: "developer",
      adminCount: 2,
      updateResultRole: "product_manager",
    });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "product_manager" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.role).toBe("product_manager");
  });
});
