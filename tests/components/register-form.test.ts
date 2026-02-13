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
import { createElement } from "react";
import "../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
  }),
}));

mock.module("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));

import { RegisterForm } from "@/components/auth/register-form";

describe("RegisterForm", () => {
  it("renders social sign-in buttons", () => {
    const { getAllByRole } = render(createElement(RegisterForm));

    expect(getAllByRole("button", { name: /google/i }).length).toBeGreaterThan(0);
    expect(getAllByRole("button", { name: /github/i }).length).toBeGreaterThan(0);
  });
});
