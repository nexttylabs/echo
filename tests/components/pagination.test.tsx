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

import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import "../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Pagination", () => {
  let Pagination: typeof import("@/components/shared/pagination").Pagination;

  beforeAll(async () => {
    ({ Pagination } = await import("@/components/shared/pagination"));
  });

  afterEach(() => {
    cleanup();
  });

  it("renders jump controls", () => {
    const { getByText } = render(
      <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />
    );
    expect(getByText("pagination.jumpTo")).toBeTruthy();
  });
});
