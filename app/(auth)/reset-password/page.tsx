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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { auth } from "@/lib/auth/config";

export default async function ResetPasswordPage() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    // Invalid session cookie, continue
  }

  if (session) {
    redirect("/dashboard");
  }

  const t = await getTranslations("auth.resetPassword");

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
