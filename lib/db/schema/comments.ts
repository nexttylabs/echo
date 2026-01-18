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

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";
import { user } from "./auth";

export const comments = pgTable(
  "comments",
  {
    commentId: serial("commentId").primaryKey(),
    feedbackId: serial("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    // User info (for logged in users) - nullable for guest comments
    userId: text("userId").references(() => user.id, { onDelete: "set null" }),
    // Guest info (for anonymous users)
    authorName: text("authorName"),
    authorEmail: text("authorEmail"),
    guestToken: text("guestToken"),
    content: text("content").notNull(),
    isInternal: boolean("isInternal").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    feedbackIdIdx: index("idx_comments_feedbackId").on(table.feedbackId),
    isInternalIdx: index("idx_comments_isInternal").on(table.isInternal),
    internalFeedbacksIdx: index("idx_comments_internal_feedbacks").on(
      table.feedbackId,
      table.isInternal,
    ),
    guestTokenIdx: index("idx_comments_guestToken").on(table.guestToken),
  }),
);

export const commentsRelations = relations(comments, ({ one }) => ({
  feedback: one(feedback, {
    fields: [comments.feedbackId],
    references: [feedback.feedbackId],
  }),
  author: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
