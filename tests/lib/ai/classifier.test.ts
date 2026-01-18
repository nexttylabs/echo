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

import { describe, it, expect } from "vitest";
import {
  classifyFeedback,
  classifyType,
  classifyPriority,
} from "@/lib/services/ai/classifier";

describe("AI Classifier", () => {
  describe("classifyType", () => {
    it("should classify bugs correctly", () => {
      expect(classifyType("App crashes on startup")).toBe("bug");
      expect(classifyType("无法登录系统")).toBe("bug");
      expect(classifyType("Error 500 when saving")).toBe("bug");
    });

    it("should classify features correctly", () => {
      expect(classifyType("希望添加导出功能")).toBe("feature");
      expect(classifyType("Suggest adding dark mode")).toBe("feature");
      expect(classifyType("Would like to see search")).toBe("feature");
    });

    it("should classify issues correctly", () => {
      expect(classifyType("How to use the app?")).toBe("issue");
      expect(classifyType("问题：如何重置密码")).toBe("issue");
      expect(classifyType("求助：不清楚怎么操作")).toBe("issue");
    });

    it("should default to other for unclear content", () => {
      expect(classifyType("Just saying hello")).toBe("other");
      expect(classifyType("Thanks for the great app")).toBe("other");
    });
  });

  describe("classifyPriority", () => {
    it("should classify high priority correctly", () => {
      expect(classifyPriority("紧急：系统无法使用")).toBe("high");
      expect(classifyPriority("Critical bug blocking all users")).toBe("high");
    });

    it("should classify low priority correctly", () => {
      expect(classifyPriority("建议：改进颜色搭配")).toBe("low");
      expect(classifyPriority("Nice to have feature")).toBe("low");
    });

    it("should default to medium priority", () => {
      expect(classifyPriority("Something broke")).toBe("medium");
    });
  });

  describe("classifyFeedback", () => {
    it("should return classification with confidence", () => {
      const result = classifyFeedback(
        "App崩溃无法使用",
        "点击按钮后应用闪退，完全无法使用",
      );

      expect(result.type).toBe("bug");
      expect(result.priority).toBe("high");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("should provide reasons for classification", () => {
      const result = classifyFeedback("希望添加导出功能");

      expect(result.reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("希望")]),
      );
    });

    it("should handle empty description", () => {
      const result = classifyFeedback("Bug in login page");

      expect(result.type).toBe("bug");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should limit reasons to 3", () => {
      const result = classifyFeedback(
        "崩溃错误无法失败异常",
        "故障不能不工作没反应卡住卡死闪退",
      );

      expect(result.reasons.length).toBeLessThanOrEqual(3);
    });
  });
});
