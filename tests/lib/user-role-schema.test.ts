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
import { userRoleSchema } from "@/lib/validations/auth";

describe("userRoleSchema", () => {
  it("accepts known roles", () => {
    expect(userRoleSchema.safeParse("customer").success).toBe(true);
    expect(userRoleSchema.safeParse("admin").success).toBe(true);
    expect(userRoleSchema.safeParse("product_manager").success).toBe(true);
    expect(userRoleSchema.safeParse("developer").success).toBe(true);
    expect(userRoleSchema.safeParse("customer_support").success).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(userRoleSchema.safeParse("guest").success).toBe(false);
  });
});
