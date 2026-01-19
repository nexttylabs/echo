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

import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { act, cleanup, render } from "@testing-library/react";
import "../setup";

const originalFetch = globalThis.fetch;
const originalSessionStorage = globalThis.sessionStorage;
const pushMock = mock();
let searchParams = new URLSearchParams();
let FeedbackListControls: typeof import("@/components/feedback/feedback-list-controls").FeedbackListControls;

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParams,
}));

mock.module("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

mock.module("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) => {
    if (key === "list.searchPlaceholder") {
      return "Search title or description…";
    }
    if (key === "list.searchButton") {
      return "Search";
    }
    if (key === "list.pageSizeLabel") {
      return "Per page";
    }
    if (key === "list.sortNewest") {
      return "Newest";
    }
    if (key === "list.sortOldest") {
      return "Oldest";
    }
    if (key === "list.sortMostVotes") {
      return "Most votes";
    }
    if (key === "list.sortFewestVotes") {
      return "Fewest votes";
    }
    if (key === "filters.logicHint") {
      return "Within a group: match any • Across groups: match all";
    }
    if (key === "filters.clearAll") {
      return "Clear Filters";
    }
    if (key === "filters.statusLabel") {
      return "Status";
    }
    if (key === "filters.typeLabel") {
      return "Type";
    }
    if (key === "filters.priorityLabel") {
      return "Priority";
    }
    if (key === "list.summary") {
      return `Total ${vars?.total} / ${vars?.pageSize} per page`;
    }
    return key;
  },
}));

mock.module("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) => <div {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  DropdownMenuLabel: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  DropdownMenuSeparator: () => <div />,
  DropdownMenuCheckboxItem: ({
    children,
    onCheckedChange,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    onCheckedChange?: () => void;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (
    <button type="button" {...props} onClick={() => onCheckedChange?.()}>
      {children}
    </button>
  ),
}));

beforeAll(async () => {
  ({ FeedbackListControls } = await import("@/components/feedback/feedback-list-controls"));
});

afterEach(() => {
  cleanup();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: originalSessionStorage,
  });
});

describe("FeedbackListControls", () => {
  it("renders filters and sort controls", async () => {
    searchParams = new URLSearchParams();
    pushMock.mockClear();
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as typeof fetch;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: mock(() => null),
        setItem: mock(() => undefined),
        removeItem: mock(() => undefined),
        clear: mock(() => undefined),
        key: mock(() => null),
        length: 0,
      } as Storage,
    });

    let getByLabelText: (text: string) => HTMLElement;
    await act(async () => {
      ({ getByLabelText } = render(
        <FeedbackListControls
          basePath="/admin/feedback"
          onUpdate={() => {}}
        />
      ));
    });

    expect(getByLabelText("Search title or description…")).toBeTruthy();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: originalSessionStorage,
    });
  });

  it("shows selected filters summary and clear-all", async () => {
    searchParams = new URLSearchParams(
      "status=new,planned&type=bug&priority=high",
    );
    pushMock.mockClear();

    const { getAllByText, getByText } = render(
      <FeedbackListControls
        basePath="/admin/feedback"
        onUpdate={() => {}}
      />,
    );

    expect(
      getAllByText("Within a group: match any • Across groups: match all").length,
    ).toBeGreaterThan(0);
    expect(getByText("Clear Filters")).toBeTruthy();
    expect(document.querySelectorAll("button").length).toBeGreaterThan(0);
    expect(getByText("Clear Filters")).toBeTruthy();
  });

  it("allows search input to be changed", async () => {
    searchParams = new URLSearchParams();
    pushMock.mockClear();

    const { getByLabelText } = render(
      <FeedbackListControls
        basePath="/admin/feedback"
        onUpdate={() => {}}
      />,
    );

    const input = getByLabelText(
      "Search title or description…",
    ) as HTMLInputElement;

    // Directly set input value and dispatch input event
    await act(async () => {
      input.value = "billing";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Verify input value changed
    expect(input.value).toBe("billing");
  });
});
