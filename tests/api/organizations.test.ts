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

import { describe, it, expect } from "bun:test";
import { buildCreateOrganizationHandler } from "@/app/api/organizations/handler";
import { organizations } from "@/lib/db/schema";

type FakeDeps = Parameters<typeof buildCreateOrganizationHandler>[0];

type SelectReturn = {
  from: () => {
    where: () => {
      limit: (count: number) => Promise<unknown[]>;
    };
  };
};

type InsertReturn = {
  values: (values: Record<string, unknown>) => {
    returning: () => Promise<Array<{ id: string; slug: string }>>;
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
        limit: async () => [],
      }),
    }),
  });

  let organizationValues: Record<string, unknown> | null = null;

  const insert = (table?: unknown) => ({
    values: (values: Record<string, unknown>) => {
      if (table === organizations) {
        organizationValues = values;
      }
      return {
        returning: async () => [{ id: "org_1", slug: "acme-1234" }],
      };
    },
  });

  const db: FakeDeps["db"] = {
    select: select as unknown as () => SelectReturn,
    transaction: async (fn) =>
      fn({
        insert: insert as unknown as () => InsertReturn,
      }),
  };

  return { auth, db, getOrganizationValues: () => organizationValues } satisfies FakeDeps &
    {
      getOrganizationValues: () => Record<string, unknown> | null;
    };
};

const makeDepsWithCollision = () => {
  const deps = makeDeps();
  let callCount = 0;
  const select = () => ({
    from: () => ({
      where: () => ({
        limit: async () => {
          callCount += 1;
          return callCount === 1 ? [{ id: "org_existing" }] : [];
        },
      }),
    }),
  });

  deps.db.select = select as unknown as () => SelectReturn;
  return deps;
};

describe("POST /api/organizations", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildCreateOrganizationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("creates organization and admin membership", async () => {
    const deps = makeDeps();
    const handler = buildCreateOrganizationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name: "Acme", description: "Test" }),
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.slug).toBeDefined();
    expect(deps.getOrganizationValues()?.description).toBe("Test");
  });

  it("retries slug generation when collision occurs", async () => {
    const handler = buildCreateOrganizationHandler(makeDepsWithCollision());
    const res = await handler(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name: "Acme" }),
      }),
    );
    expect(res.status).toBe(201);
  });

  it("allows non-admin users to create organizations", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => ({
      user: { id: "user_1", role: "customer" },
    });
    const handler = buildCreateOrganizationHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name: "Acme" }),
      }),
    );
    expect(res.status).toBe(201);
    expect(deps.getOrganizationValues()).toBeDefined();
  });
});
