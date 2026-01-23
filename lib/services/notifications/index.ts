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

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  notifications,
  feedback,
  user,
  notificationPreferences,
  NotificationType,
  type NotificationTypeEnum,
  type NotificationData,
  type Notification,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/services/email";
import {
  generateStatusChangeEmail,
  generateNewCommentEmail,
} from "@/lib/services/email/templates";
import { logger } from "@/lib/logger";

async function getUserPreferences(userId: string): Promise<{
  statusChange: boolean;
  newComment: boolean;
}> {
  if (!db) {
    return { statusChange: true, newComment: true };
  }

  const [prefs] = await db
    .select({
      statusChange: notificationPreferences.statusChange,
      newComment: notificationPreferences.newComment,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return prefs || { statusChange: true, newComment: true };
}

async function createAndSendNotification(
  userId: string,
  type: NotificationTypeEnum,
  feedbackId: number,
  data: NotificationData,
) {
  if (!db) {
    logger.error("Database not configured for notifications");
    return;
  }

  const prefs = await getUserPreferences(userId);

  if (type === NotificationType.STATUS_CHANGE && !prefs.statusChange) {
    logger.info({ userId, type }, "User has disabled status change notifications");
    return;
  }

  if (type === NotificationType.NEW_COMMENT && !prefs.newComment) {
    logger.info({ userId, type }, "User has disabled new comment notifications");
    return;
  }

  const [userData] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData) {
    logger.error({ userId }, "User not found for notification");
    return;
  }

  const [feedbackData] = await db
    .select({ title: feedback.title })
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1);

  if (!feedbackData) {
    logger.error({ feedbackId }, "Feedback not found for notification");
    return;
  }

  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      feedbackId,
      data,
    })
    .returning();

  sendNotificationEmail(notification, userData.email, feedbackData.title).catch(
    (error) => {
      logger.error({ error, notificationId: notification.notificationId }, "Error sending notification email");
      db?.update(notifications)
        .set({ status: "failed", error: error.message })
        .where(eq(notifications.notificationId, notification.notificationId))
        .catch((e) => logger.error({ error: e }, "Failed to update notification status"));
    },
  );
}

async function sendNotificationEmail(
  notification: Notification,
  userEmail: string,
  feedbackTitle: string,
) {
  if (!db) return;

  const { type, feedbackId, data } = notification;
  const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feedback/${feedbackId}`;

  let emailResult;

  if (type === NotificationType.STATUS_CHANGE && data) {
    const { subject, html } = generateStatusChangeEmail({
      feedbackTitle,
      feedbackId,
      oldStatus: data.oldStatus || "unknown",
      newStatus: data.newStatus || "unknown",
      feedbackUrl,
    });
    emailResult = await sendEmail({ to: userEmail, subject, html });
  } else if (type === NotificationType.NEW_COMMENT && data) {
    const { subject, html } = generateNewCommentEmail({
      feedbackTitle,
      feedbackId,
      authorName: data.authorName || "Anonymous",
      commentContent: data.commentContent || "",
      feedbackUrl,
    });
    emailResult = await sendEmail({ to: userEmail, subject, html });
  } else {
    logger.error({ type }, "Unknown notification type");
    return;
  }

  if (emailResult.success) {
    await db
      .update(notifications)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(notifications.notificationId, notification.notificationId));
  } else {
    await db
      .update(notifications)
      .set({ status: "failed", error: emailResult.error })
      .where(eq(notifications.notificationId, notification.notificationId));
  }
}

export async function notifyStatusChange(
  feedbackId: number,
  oldStatus: string,
  newStatus: string,
) {
  if (!db) return;

  const [feedbackData] = await db
    .select({ submittedBy: feedback.submittedBy })
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1);

  if (!feedbackData?.submittedBy) {
    return;
  }

  await createAndSendNotification(
    feedbackData.submittedBy,
    NotificationType.STATUS_CHANGE,
    feedbackId,
    { oldStatus, newStatus },
  );
}

export async function notifyNewComment(
  feedbackId: number,
  authorId: string,
  authorName: string,
  commentContent: string,
) {
  if (!db) return;

  const [feedbackData] = await db
    .select({ submittedBy: feedback.submittedBy })
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1);

  if (!feedbackData?.submittedBy) {
    return;
  }

  if (feedbackData.submittedBy === authorId) {
    return;
  }

  await createAndSendNotification(
    feedbackData.submittedBy,
    NotificationType.NEW_COMMENT,
    feedbackId,
    { authorId, authorName, commentContent },
  );
}
