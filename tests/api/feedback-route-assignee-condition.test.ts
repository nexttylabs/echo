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

describe("Feedback route assignee condition", () => {
  it("returns null when no assignee filters are provided", async () => {
    const mod = await import("@/app/api/feedback/route");
    expect(typeof mod.buildAssigneeCondition).toBe("function");
    expect(mod.buildAssigneeCondition([])).toBe(null);
  });

  it("returns a SQL condition when filters exist", async () => {
    const mod = await import("@/app/api/feedback/route");
    const condition = mod.buildAssigneeCondition(["unassigned", "user-1"]);
    expect(condition).toBeTruthy();
  });
});
