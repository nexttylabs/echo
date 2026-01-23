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
import { parseCsvParam, serializeCsvParam } from "@/lib/feedback/filters";

describe("filters helpers", () => {
  it("parses csv into array", () => {
    expect(parseCsvParam("a,b")).toEqual(["a", "b"]);
  });

  it("serializes array into csv", () => {
    expect(serializeCsvParam(["a", "b"])).toBe("a,b");
  });
});
