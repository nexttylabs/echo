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

import { describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { FeedbackBulkActions } from "@/components/feedback/feedback-bulk-actions";
import "../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    key === "bulk.selectedCount" ? `${vars?.count} selected` : key,
}));

describe("FeedbackBulkActions", () => {
  it("renders selection count", () => {
    const { getByText } = render(
      <FeedbackBulkActions
        selectedIds={[1, 2]}
        onClear={() => {}}
        onCompleted={() => {}}
      />
    );
    expect(getByText("2 selected")).toBeTruthy();
  });
});
