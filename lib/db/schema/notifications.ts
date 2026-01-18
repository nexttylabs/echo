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

import {
  boolean,
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { feedback } from "./feedback";

export const NotificationType = {
  STATUS_CHANGE: "status_change",
  NEW_COMMENT: "new_comment",
} as const;

export type NotificationTypeEnum =
  (typeof NotificationType)[keyof typeof NotificationType];

export type NotificationData = {
  oldStatus?: string;
  newStatus?: string;
  authorId?: string;
  authorName?: string;
  commentContent?: string;
};

export const notifications = pgTable(
  "notifications",
  {
    notificationId: serial("notificationId").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<NotificationTypeEnum>(),
    feedbackId: serial("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    data: jsonb("data").$type<NotificationData>(),
    status: text("status").notNull().default("pending"),
    sentAt: timestamp("sentAt"),
    error: text("error"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_notifications_userId").on(table.userId),
    statusIdx: index("idx_notifications_status").on(table.status),
    typeIdx: index("idx_notifications_type").on(table.type),
  }),
);

export const notificationPreferences = pgTable("notification_preferences", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  statusChange: boolean("statusChange").notNull().default(true),
  newComment: boolean("newComment").notNull().default(true),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
