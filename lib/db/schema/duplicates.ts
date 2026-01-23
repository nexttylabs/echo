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
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";
import { user } from "./auth";

export const duplicateFeedback = pgTable(
  "duplicate_feedback",
  {
    id: serial("id").primaryKey(),
    originalFeedbackId: integer("originalFeedbackId")
      .references(() => feedback.feedbackId, { onDelete: "cascade" })
      .notNull(),
    duplicateFeedbackId: integer("duplicateFeedbackId")
      .references(() => feedback.feedbackId, { onDelete: "cascade" })
      .notNull(),
    similarity: integer("similarity").notNull(), // 0-100
    status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'rejected'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    confirmedBy: text("confirmedBy").references(() => user.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmedAt"),
  },
  (table) => ({
    originalIdx: index("idx_duplicate_original").on(table.originalFeedbackId),
    duplicateIdx: index("idx_duplicate_duplicate").on(table.duplicateFeedbackId),
    uniquePair: unique("unique_duplicate_pair").on(
      table.originalFeedbackId,
      table.duplicateFeedbackId,
    ),
  }),
);

export const duplicateFeedbackRelations = relations(
  duplicateFeedback,
  ({ one }) => ({
    originalFeedback: one(feedback, {
      fields: [duplicateFeedback.originalFeedbackId],
      references: [feedback.feedbackId],
      relationName: "originalFeedback",
    }),
    duplicateFeedbackRef: one(feedback, {
      fields: [duplicateFeedback.duplicateFeedbackId],
      references: [feedback.feedbackId],
      relationName: "duplicateFeedbackRef",
    }),
    confirmedByUser: one(user, {
      fields: [duplicateFeedback.confirmedBy],
      references: [user.id],
    }),
  }),
);

export type DuplicateFeedback = typeof duplicateFeedback.$inferSelect;
export type NewDuplicateFeedback = typeof duplicateFeedback.$inferInsert;
