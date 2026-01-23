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

import { relations } from "drizzle-orm";
import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { feedback } from "./feedback";

export const attachments = pgTable(
  "attachments",
  {
    attachmentId: serial("attachmentId").primaryKey(),
    feedbackId: integer("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    fileName: text("fileName").notNull(),
    filePath: text("filePath").notNull(),
    fileSize: integer("fileSize").notNull(),
    mimeType: text("mimeType").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    feedbackIdx: index("idx_attachments_feedbackId").on(table.feedbackId),
  }),
);

export const attachmentRelations = relations(attachments, ({ one }) => ({
  feedback: one(feedback, {
    fields: [attachments.feedbackId],
    references: [feedback.feedbackId],
  }),
}));

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
