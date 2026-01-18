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

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getOrgContext } from "@/lib/auth/org-context";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { getRequestUrl } from "@/lib/http/get-request-url";

export default async function AdminFeedbackListPage() {
  const t = await getTranslations();
  const headerList = await headers();
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    redirect("/login");
  }

  if (!db) {
    throw new Error("Database not configured");
  }

  let organizationId: string | null = null;

  try {
    const url = getRequestUrl(headerList, "/admin/feedback");
    const context = await getOrgContext({
      request: { nextUrl: url, headers: headerList, cookies: cookieStore },
      db,
      userId: session.user.id,
      requireMembership: true,
    });
    organizationId = context.organizationId;
  } catch {
    organizationId = null;
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">{t('common.noOrganization')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('feedback.pageTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('feedback.pageDescription')}</p>
      </div>
      <FeedbackList
        organizationId={organizationId}
        page={1}
        pageSize={20}
        sortBy="createdAt"
        sortOrder="desc"
        basePath="/admin/feedback"
        canDelete
      />
    </div>
  );
}
