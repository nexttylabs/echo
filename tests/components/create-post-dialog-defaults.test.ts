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

describe("CreatePostDialog defaults", () => {
  it("fills missing values with defaults", async () => {
    const mod = await import("@/components/portal/create-post-dialog");
    const values = mod.buildDefaultFeedbackValues();
    expect(values.title).toBe("");
    expect(values.description).toBe("");
    expect(values.type).toBe("feature");
    expect(values.priority).toBe("medium");
  });

  it("respects provided initial values", async () => {
    const mod = await import("@/components/portal/create-post-dialog");
    const values = mod.buildDefaultFeedbackValues({
      title: "Hello",
      description: "World",
      type: "bug",
      priority: "high",
    });
    expect(values.title).toBe("Hello");
    expect(values.description).toBe("World");
    expect(values.type).toBe("bug");
    expect(values.priority).toBe("high");
  });
});
