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
import { organizationMemberRoleSchema } from "@/lib/validations/organizations";

describe("organizationMemberRoleSchema", () => {
  it("accepts known organization roles", () => {
    expect(organizationMemberRoleSchema.safeParse("admin").success).toBe(true);
    expect(
      organizationMemberRoleSchema.safeParse("product_manager").success,
    ).toBe(true);
    expect(organizationMemberRoleSchema.safeParse("developer").success).toBe(
      true,
    );
    expect(
      organizationMemberRoleSchema.safeParse("customer_support").success,
    ).toBe(true);
  });

  it("rejects non-organization roles", () => {
    expect(organizationMemberRoleSchema.safeParse("customer").success).toBe(
      false,
    );
    expect(organizationMemberRoleSchema.safeParse("member").success).toBe(false);
  });
});
