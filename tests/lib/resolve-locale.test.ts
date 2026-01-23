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

mock.module("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => (name === "NEXT_LOCALE" ? { value: "zh-CN" } : undefined),
    }),
  headers: () => Promise.resolve(new Headers({ "accept-language": "jp,en;q=0.8" })),
}));

const { resolveRequestLocale } = await import("@/i18n/resolve-locale");

describe("resolveRequestLocale", () => {
  it("prefers locale cookie over accept-language", async () => {
    await expect(resolveRequestLocale()).resolves.toBe("zh-CN");
  });
});
