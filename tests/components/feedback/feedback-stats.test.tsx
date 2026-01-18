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
import { afterEach, describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { FeedbackStats } from "@/components/feedback/feedback-stats";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("FeedbackStats", () => {
  it("uses a bounded page size when fetching stats", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mockFetch = mock(async (_input: RequestInfo | URL) => {
      return new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 });
    });

    globalThis.fetch = mockFetch as typeof fetch;

    render(<FeedbackStats organizationId="org-1" />);

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
    });

    const requestUrl = String(mockFetch.mock.calls[0]?.[0]);
    const url = new URL(requestUrl, "http://localhost");
    expect(url.searchParams.get("pageSize")).toBe("100");
  });
});
