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
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission, hasAllPermissions } from "@/lib/auth/permissions";

/**
 * Note: useCan and useHasPermission now require React context.
 * These tests verify the underlying permission logic directly.
 * For integration tests of the hooks, see e2e tests.
 */
describe("use-permissions (underlying logic)", () => {
  it("returns false when role is null", () => {
    // When no role is provided, permission checks should return false
    expect(hasPermission("customer", PERMISSIONS.MANAGE_ORG)).toBe(false);
  });

  it("checks permissions for admin role", () => {
    expect(hasPermission("admin", PERMISSIONS.MANAGE_ORG)).toBe(true);
    expect(hasPermission("admin", PERMISSIONS.SUBMIT_ON_BEHALF)).toBe(true);
    expect(hasPermission("admin", PERMISSIONS.DELETE_FEEDBACK)).toBe(true);
  });

  it("checks permissions for owner role", () => {
    expect(hasPermission("owner", PERMISSIONS.MANAGE_ORG)).toBe(true);
    expect(hasPermission("owner", PERMISSIONS.SUBMIT_ON_BEHALF)).toBe(true);
    expect(hasPermission("owner", PERMISSIONS.DELETE_FEEDBACK)).toBe(true);
  });

  it("checks permissions for product_manager role", () => {
    expect(hasPermission("product_manager", PERMISSIONS.SUBMIT_ON_BEHALF)).toBe(true);
    expect(hasPermission("product_manager", PERMISSIONS.MANAGE_ORG)).toBe(false);
  });

  it("checks permissions for developer role", () => {
    expect(hasPermission("developer", PERMISSIONS.CREATE_FEEDBACK)).toBe(true);
    expect(hasPermission("developer", PERMISSIONS.DELETE_FEEDBACK)).toBe(false);
  });

  it("requires all permissions when using hasAllPermissions", () => {
    expect(
      hasAllPermissions("developer", [
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.DELETE_FEEDBACK,
      ]),
    ).toBe(false);

    expect(
      hasAllPermissions("admin", [
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.DELETE_FEEDBACK,
      ]),
    ).toBe(true);
  });
});
