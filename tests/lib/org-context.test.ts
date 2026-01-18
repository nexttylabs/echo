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
import { getOrgContext } from "@/lib/auth/org-context";

const makeRequest = (options: {
  query?: Record<string, string>;
  headerOrgId?: string;
  cookieOrgId?: string;
}) => {
  const url = new URL("https://example.com");
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  return {
    nextUrl: url,
    headers: new Headers(
      options.headerOrgId ? { "x-organization-id": options.headerOrgId } : undefined,
    ),
    cookies: {
      get: (name: string) =>
        name === "orgId" && options.cookieOrgId
          ? { value: options.cookieOrgId }
          : undefined,
    },
  } as const;
};

const makeDb = (hasMember: boolean) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => (hasMember ? [{ role: "admin" }] : []),
      }),
    }),
  }),
});

describe("getOrgContext", () => {
  it("prefers query over header and cookie", async () => {
    const req = makeRequest({
      query: { organizationId: "org_query" },
      headerOrgId: "org_header",
      cookieOrgId: "org_cookie",
    });
    const context = await getOrgContext({
      request: req,
      db: makeDb(true),
      userId: "user_1",
    });
    expect(context.organizationId).toBe("org_query");
    expect(context.source).toBe("query");
  });

  it("throws when membership missing", async () => {
    const req = makeRequest({ cookieOrgId: "org_cookie" });
    await expect(
      getOrgContext({
        request: req,
        db: makeDb(false),
        userId: "user_1",
        requireMembership: true,
      }),
    ).rejects.toThrow("Access denied");
  });

  it("accepts explicit organization id", async () => {
    const req = makeRequest({});
    const context = await getOrgContext({
      request: req,
      db: makeDb(true),
      organizationId: "org_explicit",
    });
    expect(context.organizationId).toBe("org_explicit");
    expect(context.source).toBe("explicit");
  });
});
