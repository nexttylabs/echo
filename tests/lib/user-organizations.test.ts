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
import { getUserOrganizations } from "@/lib/auth/organization";

const makeDb = (
  rows: Array<{ id: string; name: string; slug: string; role: string }>,
) => ({
  select: () => ({
    from: () => ({
      innerJoin: () => ({
        where: async () => rows,
      }),
    }),
  }),
});

describe("getUserOrganizations", () => {
  it("returns organization list for user", async () => {
    const db = makeDb([
      { id: "org_1", name: "Org", slug: "org", role: "admin" },
    ]);
    const orgs = await getUserOrganizations(db as never, "user_1");
    expect(orgs).toHaveLength(1);
    expect(orgs[0].id).toBe("org_1");
  });
});
