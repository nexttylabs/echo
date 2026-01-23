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
import { parseFeedbackPrefill } from "@/lib/feedback/prefill";

const params = new URLSearchParams({
  title: "导出报告错位",
  description: "PDF 排版错位",
  type: "bug",
  priority: "high",
});

describe("parseFeedbackPrefill", () => {
  it("parses known fields", () => {
    expect(parseFeedbackPrefill(params)).toEqual({
      title: "导出报告错位",
      description: "PDF 排版错位",
      type: "bug",
      priority: "high",
    });
  });

  it("ignores unknown fields", () => {
    const extra = new URLSearchParams({ title: "x", source: "email" });
    expect(parseFeedbackPrefill(extra)).toEqual({ title: "x" });
  });

  it("validates type enum", () => {
    const invalid = new URLSearchParams({ title: "test", type: "invalid" });
    expect(parseFeedbackPrefill(invalid)).toEqual({ title: "test" });
  });

  it("validates priority enum", () => {
    const invalid = new URLSearchParams({ title: "test", priority: "urgent" });
    expect(parseFeedbackPrefill(invalid)).toEqual({ title: "test" });
  });
});
