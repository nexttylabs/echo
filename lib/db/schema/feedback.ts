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
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { attachments } from "./attachments";
import { user } from "./auth";
import { feedbackTags } from "./tags";

export type CustomerInfo = {
  name: string;
  email: string;
  phone?: string;
};

export const feedback = pgTable(
  "feedback",
  {
    feedbackId: serial("feedbackId").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: text("type").notNull(),
    priority: text("priority").notNull(),
    status: text("status").notNull().default("new"),
    organizationId: text("organizationId").notNull(),
    submittedOnBehalf: boolean("submittedOnBehalf").notNull().default(false),
    submittedBy: text("submittedBy").references(() => user.id, {
      onDelete: "set null",
    }),
    customerInfo: jsonb("customerInfo").$type<CustomerInfo | null>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deletedAt"),
    autoClassified: boolean("autoClassified").default(false).notNull(),
    processingStatus: text("processingStatus", {
      enum: ["pending", "processing", "completed", "failed"],
    }).default("pending"),
    processedAt: timestamp("processedAt"),
    // GitHub integration fields
    githubIssueId: integer("githubIssueId"),
    githubIssueNumber: integer("githubIssueNumber"),
    githubIssueUrl: text("githubIssueUrl"),
    githubSyncedAt: timestamp("githubSyncedAt"),
    githubStatus: text("githubStatus"),
  },
  (table) => ({
    orgIdx: index("idx_feedback_orgId").on(table.organizationId),
    statusIdx: index("idx_feedback_status").on(table.status),
    createdAtIdx: index("idx_feedback_createdAt").on(table.createdAt),
    submittedByIdx: index("idx_feedback_submittedBy").on(table.submittedBy),
    deletedAtIdx: index("idx_feedback_deletedAt").on(table.deletedAt),
    githubIssueIdIdx: index("idx_feedback_githubIssueId").on(table.githubIssueId),
  }),
);

export const feedbackRelations = relations(feedback, ({ many }) => ({
  attachments: many(attachments),
  feedbackTags: many(feedbackTags),
}));

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
