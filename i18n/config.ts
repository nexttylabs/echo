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

export const DEFAULT_LOCALE = "en" as const;
export const SUPPORTED_LOCALES = ["en", "zh-CN", "jp"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string): AppLocale | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "zh" || normalized === "zh-cn" || normalized.startsWith("zh-")) return "zh-CN";
  if (normalized === "ja" || normalized === "jp" || normalized.startsWith("ja-")) return "jp";
  return null;
}

export function getPreferredLocaleFromHeader(header: string | null): AppLocale | null {
  if (!header) return null;
  const locales = header.split(",").map((part) => part.split(";")[0]?.trim());
  for (const locale of locales) {
    if (!locale) continue;
    const supported = normalizeLocale(locale);
    if (supported) return supported;
  }
  return null;
}
