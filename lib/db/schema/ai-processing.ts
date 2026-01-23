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
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";

export type ClassificationResult = {
  type: string;
  priority: string;
  confidence: number;
  reasons: string[];
};

export type TagSuggestionResult = {
  name: string;
  slug: string;
  confidence: number;
};

export type DuplicateCandidateResult = {
  feedbackId: number;
  similarity: number;
};

export const aiProcessingResults = pgTable(
  "ai_processing_results",
  {
    id: serial("id").primaryKey(),
    feedbackId: integer("feedbackId")
      .references(() => feedback.feedbackId, { onDelete: "cascade" })
      .notNull(),
    classification: jsonb("classification").$type<ClassificationResult | null>(),
    tagSuggestions: jsonb("tagSuggestions").$type<TagSuggestionResult[] | null>(),
    duplicateCandidates: jsonb("duplicateCandidates").$type<
      DuplicateCandidateResult[] | null
    >(),
    processingTime: integer("processingTime"),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .default("pending")
      .notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    feedbackIdx: index("idx_ai_results_feedback").on(table.feedbackId),
    statusIdx: index("idx_ai_results_status").on(table.status),
  }),
);

export const aiProcessingResultsRelations = relations(
  aiProcessingResults,
  ({ one }) => ({
    feedback: one(feedback, {
      fields: [aiProcessingResults.feedbackId],
      references: [feedback.feedbackId],
    }),
  }),
);

export type AIProcessingResult = typeof aiProcessingResults.$inferSelect;
export type NewAIProcessingResult = typeof aiProcessingResults.$inferInsert;
