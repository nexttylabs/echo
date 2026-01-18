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

import { describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

mock.module("@/lib/auth/config", () => ({
  auth: {
    api: {
      getSession: mock(() => Promise.resolve({ user: { id: "u1" } })),
    },
  },
}));

mock.module("@/lib/auth/org-context", () => ({
  getOrgContext: mock(() =>
    Promise.resolve({ organizationId: "org_1", memberRole: "developer" }),
  ),
}));

mock.module("@/lib/db", () => ({ db: null }));

describe("POST /api/feedback/bulk", () => {
  it("returns 500 when db is missing", async () => {
    const { POST } = await import("@/app/api/feedback/bulk/route");
    const req = new NextRequest("http://localhost/api/feedback/bulk", {
      method: "POST",
      body: JSON.stringify({ action: "delete", ids: [1] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
