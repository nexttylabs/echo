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
import { buildSimilarResponse } from "@/lib/feedback/find-similar";

const sample = [
  {
    feedbackId: 1,
    title: "批量导入联系人功能请求",
    description: "需要支持 CSV 格式导入联系人列表",
  },
];

describe("buildSimilarResponse", () => {
  it("returns scored suggestions", () => {
    const result = buildSimilarResponse("批量导入联系人", "CSV 格式导入", sample);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("feedbackId", 1);
    expect(result[0]).toHaveProperty("similarity");
  });

  it("returns empty array when no matches", () => {
    const result = buildSimilarResponse("completely unrelated", "", sample);
    expect(result.length).toBe(0);
  });

  it("handles empty existing feedbacks", () => {
    const result = buildSimilarResponse("test", "test", []);
    expect(result).toEqual([]);
  });
});
