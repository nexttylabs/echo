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
import { getDefaultPortalI18n } from "@/lib/portal/i18n";

describe("portal i18n", () => {
  it("returns default locale", () => {
    expect(getDefaultPortalI18n().defaultLocale).toBe("en");
  });

  it("includes supported locales", () => {
    const { supportedLocales } = getDefaultPortalI18n();
    expect(supportedLocales).toEqual(["en", "zh-CN", "jp"]);
  });
});
