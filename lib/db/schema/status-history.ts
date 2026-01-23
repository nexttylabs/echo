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
  pgTable,
  serial,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";
import { user } from "./auth";

export const statusHistory = pgTable(
  "status_history",
  {
    historyId: serial("historyId").primaryKey(),
    feedbackId: integer("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    oldStatus: text("oldStatus").notNull(),
    newStatus: text("newStatus").notNull(),
    changedBy: text("changedBy").references(() => user.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changedAt").defaultNow().notNull(),
    comment: text("comment"),
  },
  (table) => ({
    feedbackIdx: index("idx_status_history_feedbackId").on(table.feedbackId),
    changedAtIdx: index("idx_status_history_changedAt").on(table.changedAt),
  }),
);

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  feedback: one(feedback, {
    fields: [statusHistory.feedbackId],
    references: [feedback.feedbackId],
  }),
  changedByUser: one(user, {
    fields: [statusHistory.changedBy],
    references: [user.id],
  }),
}));

export type StatusHistory = typeof statusHistory.$inferSelect;
export type NewStatusHistory = typeof statusHistory.$inferInsert;
