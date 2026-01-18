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
import { assertOrganizationAccess } from "@/lib/auth/organization";

const makeDb = (member: { role: string } | null) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => (member ? [member] : []),
      }),
    }),
  }),
});

describe("assertOrganizationAccess", () => {
  it("returns member when user belongs to organization", async () => {
    const db = makeDb({ role: "admin" });
    const member = await assertOrganizationAccess(db, "user_1", "org_1");
    expect(member.role).toBe("admin");
  });

  it("throws when user is not a member", async () => {
    const db = makeDb(null);
    await expect(
      assertOrganizationAccess(db, "user_1", "org_1"),
    ).rejects.toThrow("Access denied");
  });
});
