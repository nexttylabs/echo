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
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  canSubmitOnBehalf,
  hasAllPermissions,
  hasPermission,
} from "@/lib/auth/permissions";

describe("permissions", () => {
  it("maps roles to expected permissions", () => {
    expect(ROLE_PERMISSIONS.admin).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
        PERMISSIONS.DELETE_FEEDBACK,
        PERMISSIONS.MANAGE_ORG,
      ]),
    );

    expect(ROLE_PERMISSIONS.product_manager).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
        PERMISSIONS.DELETE_FEEDBACK,
      ]),
    );

    expect(ROLE_PERMISSIONS.developer).toEqual(
      expect.arrayContaining([PERMISSIONS.CREATE_FEEDBACK]),
    );

    expect(ROLE_PERMISSIONS.customer_support).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
      ]),
    );

    expect(ROLE_PERMISSIONS.customer).toEqual(
      expect.arrayContaining([PERMISSIONS.CREATE_FEEDBACK]),
    );
  });

  it("checks permissions by role", () => {
    expect(hasPermission("admin", PERMISSIONS.MANAGE_ORG)).toBe(true);
    expect(hasPermission("developer", PERMISSIONS.DELETE_FEEDBACK)).toBe(false);
    expect(hasPermission("customer", PERMISSIONS.CREATE_FEEDBACK)).toBe(true);
  });

  it("checks multiple permissions (all-of)", () => {
    expect(
      hasAllPermissions("admin", [
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.MANAGE_ORG,
      ]),
    ).toBe(true);

    expect(
      hasAllPermissions("developer", [
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.DELETE_FEEDBACK,
      ]),
    ).toBe(false);
  });

  it("checks submit-on-behalf permission", () => {
    expect(canSubmitOnBehalf("customer_support")).toBe(true);
    expect(canSubmitOnBehalf("customer")).toBe(false);
  });
});
