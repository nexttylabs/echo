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
import en from "@/messages/en.json";

const requiredKeys = [
  "feedback.list.searchPlaceholder",
  "feedback.list.searchButton",
  "feedback.list.sortLabel",
  "feedback.list.pageSizeLabel",
  "feedback.list.summary",
  "feedback.list.empty",
  "feedback.list.error",
  "feedback.list.filtersEmpty",
  "feedback.list.hasVotes",
  "feedback.list.hasReplies",
  "feedback.list.boolYes",
  "feedback.list.boolNo",
  "feedback.list.selectLabel",
  "feedback.list.selectAll",
  "feedback.list.delete",
  "feedback.pagination.jumpTo",
  "feedback.pagination.go",
  "feedback.bulk.selectedCount",
  "feedback.bulk.clearSelection",
  "feedback.bulk.deleteConfirmTitle",
  "feedback.bulk.deleteConfirmDesc",
  "feedback.vote.vote",
  "feedback.vote.voted",
  "feedback.relative.daysAgo",
  "feedback.detail.createdAt",
  "feedback.detail.updatedAt",
  "feedback.detail.feedbackId",
  "feedback.detail.votes",
  "feedback.detail.description",
  "feedback.detail.attachments",
  "feedback.detail.votesTitle",
  "feedback.detail.statusHistory",
  "feedback.detail.backToList",
  "feedback.detail.customerInfo",
  "feedback.detail.customerName",
  "feedback.detail.customerEmail",
  "feedback.detail.customerPhone",
];

const get = (obj: Record<string, unknown>, path: string) =>
  path.split(".").reduce((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], obj);

describe("feedback i18n keys", () => {
  it("contains required keys", () => {
    requiredKeys.forEach((key) => {
      expect(get(en as Record<string, unknown>, key)).toBeTruthy();
    });
  });
});
