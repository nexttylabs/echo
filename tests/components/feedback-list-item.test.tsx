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

import { describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { FeedbackListItem } from "@/components/feedback/feedback-list-item";
import "../setup";

const push = mock();
mock.module("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

mock.module("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "list.selectLabel") {
      return "Select feedback";
    }
    if (key === "list.delete") {
      return "Delete feedback";
    }
    return key;
  },
  useLocale: () => "en",
}));

describe("FeedbackListItem", () => {
  it("renders selection checkbox", () => {
    const { getByLabelText } = render(
      <FeedbackListItem
        feedback={{
          feedbackId: 1,
          title: "Title",
          description: "Desc",
          type: "bug",
          priority: "low",
          status: "new",
          createdAt: new Date().toISOString(),
          voteCount: 2,
        }}
        canDelete
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(getByLabelText("Select feedback")).toBeTruthy();
  });
});
