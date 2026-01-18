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
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { FeedbackEditForm } from "@/components/feedback/feedback-edit-form";
import { canEditFeedback, type UserRole } from "@/lib/auth/permissions";
import { getOrgContext } from "@/lib/auth/org-context";
import { getRequestUrl } from "@/lib/http/get-request-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackEditPage({ params }: PageProps) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role as UserRole | undefined;
  if (!userRole || !canEditFeedback(userRole)) {
    redirect("/admin/feedback");
  }

  const { id } = await params;
  const feedbackId = parseInt(id);

  if (isNaN(feedbackId)) {
    notFound();
  }

  if (!db) {
    throw new Error("Database not configured");
  }

  let organizationId: string | null = null;
  try {
    const url = getRequestUrl(
      headerList,
      `/admin/feedback/${feedbackId}/edit`,
    );
    const context = await getOrgContext({
      request: { nextUrl: url, headers: headerList, cookies: cookieStore },
      db,
      userId: session.user.id,
      requireMembership: true,
    });
    organizationId = context.organizationId;
  } catch {
    notFound();
  }

  const [row] = await db
    .select({
      title: feedback.title,
      description: feedback.description,
      deletedAt: feedback.deletedAt,
    })
    .from(feedback)
    .where(
      and(
        eq(feedback.feedbackId, feedbackId),
        eq(feedback.organizationId, organizationId ?? ""),
      ),
    )
    .limit(1);

  if (!row || row.deletedAt !== null) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <FeedbackEditForm
        feedbackId={feedbackId}
        initialTitle={row.title}
        initialDescription={row.description}
      />
    </div>
  );
}
