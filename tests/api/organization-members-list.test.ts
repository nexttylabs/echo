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

import { afterEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

afterEach(() => {
  mock.restore();
});

describe("GET /api/organizations/[orgId]/members", () => {
  it("returns members with displayName", async () => {
    const memberRow = {
      userId: "user_1",
      displayName: "Ada",
      email: "ada@example.com",
      avatarUrl: null,
    };
    const mockDb = {
      select: (fields?: unknown) => {
        if (fields) {
          return {
            from: () => ({
              innerJoin: () => ({
                where: async () => [memberRow],
              }),
            }),
          };
        }

        return {
          from: () => ({
            where: () => ({
              limit: async () => [{ role: "admin" }],
            }),
          }),
        };
      },
    };

    mock.module("@/lib/auth/config", () => ({
      auth: {
        api: {
          getSession: mock(() => Promise.resolve({ user: { id: "user_1" } })),
        },
      },
    }));

    mock.module("@/lib/db", () => ({ db: mockDb }));
    const { GET } = await import(
      "@/app/api/organizations/[orgId]/members/route"
    );
    const req = new NextRequest(
      "http://localhost:3000/api/organizations/org_1/members",
    );
    const res = await GET(req, {
      params: Promise.resolve({ orgId: "org_1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0]).toHaveProperty("userId");
    expect(json.data[0]).toHaveProperty("displayName");
  });
});
