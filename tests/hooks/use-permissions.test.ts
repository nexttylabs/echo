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
import { useCan, useHasPermission } from "@/hooks/use-permissions";

describe("use-permissions", () => {
  it("returns false when session has no role", () => {
    expect(useCan(PERMISSIONS.CREATE_FEEDBACK, null)).toBe(false);
    expect(useHasPermission(PERMISSIONS.CREATE_FEEDBACK, null)).toBe(false);
  });

  it("checks permissions for the current role", () => {
    const session = { user: { role: "admin" } } as {
      user: { role: string };
    };

    expect(useCan(PERMISSIONS.MANAGE_ORG, session)).toBe(true);
    expect(useCan(PERMISSIONS.SUBMIT_ON_BEHALF, session)).toBe(true);
  });

  it("requires all permissions when passed a list", () => {
    const session = { user: { role: "developer" } } as {
      user: { role: string };
    };

    expect(
      useHasPermission(
        [
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.DELETE_FEEDBACK,
      ],
        session,
      ),
    ).toBe(false);
  });
});
