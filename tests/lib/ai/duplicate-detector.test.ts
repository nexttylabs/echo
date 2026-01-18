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
  calculateSimilarity,
  findDuplicates,
  batchFindDuplicates,
} from "@/lib/services/ai/duplicate-detector";

describe("Duplicate Detector", () => {
  describe("calculateSimilarity", () => {
    it("should detect identical titles", () => {
      const result = calculateSimilarity(
        "App crashes on startup",
        "",
        "App crashes on startup",
        "",
      );
      expect(result.score).toBeGreaterThan(0.9);
    });

    it("should detect similar titles with typos", () => {
      const result = calculateSimilarity(
        "App crashes on startup",
        "",
        "App crashe on stratup",
        "",
      );
      expect(result.score).toBeGreaterThan(0.7);
    });

    it("should detect similar descriptions", () => {
      const result = calculateSimilarity(
        "Login issue",
        "Cannot login to my account, says invalid password",
        "Login issue",
        "Having trouble logging in, password not working",
      );
      expect(result.score).toBeGreaterThan(0.6);
    });

    it("should not flag unrelated feedback", () => {
      const result = calculateSimilarity(
        "Add dark mode",
        "Please add dark mode to the app",
        "Database performance is slow",
        "Queries are taking too long",
      );
      expect(result.score).toBeLessThan(0.4);
    });

    it("should provide reasons for high similarity", () => {
      const result = calculateSimilarity(
        "Application crashes when clicking save button",
        "The app freezes and crashes every time I click the save button",
        "Application crashes when clicking save button",
        "App crashes on save button click",
      );
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain("similar");
    });

    it("should handle empty strings", () => {
      const result = calculateSimilarity("", "", "", "");
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("should handle Chinese text", () => {
      const result = calculateSimilarity(
        "应用程序崩溃",
        "点击保存按钮后崩溃",
        "应用程序崩溃",
        "保存按钮点击后崩溃",
      );
      expect(result.score).toBeGreaterThan(0.6);
    });
  });

  describe("findDuplicates", () => {
    const existingFeedbacks = [
      {
        feedbackId: 1,
        title: "App crashes on startup",
        description: "The app crashes when I open it",
      },
      {
        feedbackId: 2,
        title: "Add dark mode feature",
        description: "Please add dark mode to the app",
      },
      {
        feedbackId: 3,
        title: "Login not working",
        description: "Cannot log in with my credentials",
      },
    ];

    it("should find duplicates above threshold", () => {
      const duplicates = findDuplicates(
        "App crashes on startup",
        "The app crashes when I open it",
        existingFeedbacks,
        undefined,
        0.75,
      );

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].feedbackId).toBe(1);
    });

    it("should exclude specified feedback ID", () => {
      const duplicates = findDuplicates(
        "App crashes on startup",
        "The app crashes when I open it",
        existingFeedbacks,
        1,
        0.75,
      );

      expect(duplicates.every((d) => d.feedbackId !== 1)).toBe(true);
    });

    it("should sort by similarity descending", () => {
      const duplicates = findDuplicates(
        "App crashes and login issues",
        "Multiple problems with the app",
        existingFeedbacks,
        undefined,
        0.3,
      );

      if (duplicates.length >= 2) {
        expect(duplicates[0].similarity).toBeGreaterThanOrEqual(
          duplicates[1].similarity,
        );
      }
    });

    it("should return empty array for unique feedback", () => {
      const duplicates = findDuplicates(
        "Completely unique feedback title",
        "This description has nothing in common with others",
        existingFeedbacks,
        undefined,
        0.75,
      );

      expect(duplicates.length).toBe(0);
    });

    it("should respect custom threshold", () => {
      const highThreshold = findDuplicates(
        "App crashes sometimes",
        "It crashes occasionally",
        existingFeedbacks,
        undefined,
        0.9,
      );

      const lowThreshold = findDuplicates(
        "App crashes sometimes",
        "It crashes occasionally",
        existingFeedbacks,
        undefined,
        0.5,
      );

      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });
  });

  describe("batchFindDuplicates", () => {
    const allFeedbacks = [
      {
        feedbackId: 1,
        title: "App crashes on startup",
        description: "The app crashes when I open it",
      },
      {
        feedbackId: 2,
        title: "Add dark mode feature",
        description: "Please add dark mode to the app",
      },
      {
        feedbackId: 3,
        title: "App crashes when opening",
        description: "Application crashes on open",
      },
    ];

    it("should process multiple feedbacks", () => {
      const results = batchFindDuplicates(
        [
          { feedbackId: 1, title: "App crashes on startup", description: "Test" },
          { feedbackId: 2, title: "Add dark mode feature", description: "Test" },
        ],
        allFeedbacks,
        0.75,
      );

      expect(results.length).toBe(2);
      expect(results[0].feedbackId).toBe(1);
      expect(results[1].feedbackId).toBe(2);
    });

    it("should exclude self from results", () => {
      const results = batchFindDuplicates(
        [{ feedbackId: 1, title: "App crashes on startup", description: "Test" }],
        allFeedbacks,
        0.75,
      );

      const selfInDuplicates = results[0].duplicates.some(
        (d) => d.feedbackId === 1,
      );
      expect(selfInDuplicates).toBe(false);
    });
  });
});
