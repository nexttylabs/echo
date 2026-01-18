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
import { isHealthStatusOk, resolveOrganizationSlug } from "./test-utils";

describe("resolveOrganizationSlug", () => {
  it("returns slug when present", () => {
    const slug = resolveOrganizationSlug({
      data: { organization: { slug: "acme" } },
    });
    expect(slug).toBe("acme");
  });

  it("throws when slug is missing", () => {
    expect(() => resolveOrganizationSlug({ data: {} })).toThrow();
  });
});

describe("isHealthStatusOk", () => {
  it("returns true for ok or connected", () => {
    expect(isHealthStatusOk("ok")).toBe(true);
    expect(isHealthStatusOk("connected")).toBe(true);
  });

  it("returns false for other values", () => {
    expect(isHealthStatusOk("warning")).toBe(false);
  });
});
