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

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NoAccessPage() {
  const t = useTranslations("errors.noAccess");
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("message")}
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("backToDashboard")}
        </Link>
        <Link
          href="/settings"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          {t("viewSettings")}
        </Link>
      </div>
    </div>
  );
}
