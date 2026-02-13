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
import { Hero } from "@/components/landing/hero";
import "../../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "login" ? "登录" : key),
}));

mock.module("next/link", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

mock.module("@/components/layout/language-switcher", () => ({
  LanguageMenuItems: () => <div>Language</div>,
  LanguageSwitcher: () => <button data-testid="language-switcher" />,
}));

describe("Hero", () => {
  it("renders language switcher before login button", () => {
    const { getByTestId, getByText } = render(<Hero />);
    const switcher = getByTestId("language-switcher");
    const login = getByText("登录");

    const relation = switcher.compareDocumentPosition(login);
    expect(Boolean(relation & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });
});
