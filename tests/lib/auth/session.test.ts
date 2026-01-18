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

import { describe, it, expect, mock } from "bun:test";
import { NextRequest } from "next/server";

mock.module("@/lib/auth/config", () => ({
  auth: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        return headers.get("x-test-auth") === "1"
          ? { user: { id: "u_test" } }
          : null;
      },
    },
  },
}));

const { getServerSession } = await import("@/lib/auth/session");

describe("getServerSession", () => {
  it("returns null when no session", async () => {
    const req = new NextRequest("http://localhost");
    const session = await getServerSession(req);
    expect(session).toBeNull();
  });

  it("returns session when present", async () => {
    const req = new NextRequest("http://localhost", {
      headers: { "x-test-auth": "1" },
    });
    const session = await getServerSession(req);
    expect(session).toEqual({ user: { id: "u_test" } });
  });
});
