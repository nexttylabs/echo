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
  unique,
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";
import { user } from "./auth";

export const votes = pgTable(
  "votes",
  {
    voteId: serial("voteId").primaryKey(),
    feedbackId: serial("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    visitorId: text("visitorId"),
    userId: text("userId").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    feedbackIdx: index("idx_votes_feedbackId").on(table.feedbackId),
    userIdx: index("idx_votes_userId").on(table.userId),
    uniqueVote: unique("unique_vote").on(table.feedbackId, table.visitorId),
  }),
);

export const votesRelations = relations(votes, ({ one }) => ({
  feedback: one(feedback, {
    fields: [votes.feedbackId],
    references: [feedback.feedbackId],
  }),
  user: one(user, {
    fields: [votes.userId],
    references: [user.id],
  }),
}));

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
