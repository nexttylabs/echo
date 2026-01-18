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
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { FeedbackDetailView } from "@/components/feedback/feedback-detail-view";
import { InternalNotes } from "@/components/comment/internal-notes";
import { PublicComments } from "@/components/comment/public-comments";
import { canDeleteFeedback, canEditFeedback, canUpdateFeedbackStatus, type UserRole } from "@/lib/auth/permissions";
import { getOrgContext } from "@/lib/auth/org-context";
import { getRequestUrl } from "@/lib/http/get-request-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: headerList });

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const feedbackId = parseInt(id);

  if (isNaN(feedbackId)) {
    notFound();
  }

  if (!db) {
    throw new Error("Database not configured");
  }

  let memberRole: UserRole | null = null;
  let organizationId: string | null = null;
  try {
    const url = getRequestUrl(headerList, `/admin/feedback/${feedbackId}`);
    const context = await getOrgContext({
      request: { nextUrl: url, headers: headerList, cookies: cookieStore },
      db,
      userId: session.user.id,
      requireMembership: true,
    });
    memberRole = (context.memberRole as UserRole) ?? null;
    organizationId = context.organizationId;
  } catch {
    notFound();
  }

  const result = await getFeedbackById(db, feedbackId, {
    userId: session.user.id,
  });

  if (!result || "deleted" in result) {
    notFound();
  }

  if (!organizationId || result.feedback.organizationId !== organizationId) {
    notFound();
  }

  const canEdit = !!memberRole && canEditFeedback(memberRole);
  const canDelete = !!memberRole && canDeleteFeedback(memberRole);
  const canUpdateStatus = !!memberRole && canUpdateFeedbackStatus(memberRole);

  return (
    <div className="container mx-auto py-8 px-4">
      <FeedbackDetailView
        feedback={{
          feedbackId: result.feedback.feedbackId,
          title: result.feedback.title,
          description: result.feedback.description,
          type: result.feedback.type,
          priority: result.feedback.priority,
          status: result.feedback.status,
          createdAt: result.feedback.createdAt.toISOString(),
          updatedAt: result.feedback.updatedAt.toISOString(),
          submittedOnBehalf: result.feedback.submittedOnBehalf,
          customerInfo: result.feedback.customerInfo as {
            name: string;
            email: string;
            phone?: string;
          } | null,
          attachments: result.attachments.map((a) => ({
            attachmentId: a.attachmentId,
            fileName: a.fileName,
            filePath: a.filePath,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            createdAt: a.createdAt.toISOString(),
          })),
          votes: {
            count: result.votes.count,
            list: result.votes.list.map((v) => ({
              voteId: v.voteId,
              visitorId: v.visitorId,
              userId: v.userId,
              userName: v.userName,
              userEmail: v.userEmail,
              createdAt: v.createdAt.toISOString(),
            })),
            userVote: result.votes.userVote,
          },
          statusHistory: result.statusHistory.map((h) => ({
            historyId: h.historyId,
            oldStatus: h.oldStatus,
            newStatus: h.newStatus,
            changedBy: h.changedBy,
            changedAt: h.changedAt.toISOString(),
            comment: h.comment,
          })),
        }}
        canEdit={canEdit}
        canDelete={canDelete}
        canUpdateStatus={canUpdateStatus}
      >
        {/* Comments section in main content area */}
        <PublicComments
          feedbackId={feedbackId}
          isAuthenticated={true}
          organizationId={organizationId}
        />

        {memberRole && (
          <InternalNotes
            feedbackId={feedbackId}
            canDelete={memberRole === "admin"}
            currentUserId={session.user.id}
          />
        )}
      </FeedbackDetailView>
    </div>
  );
}
