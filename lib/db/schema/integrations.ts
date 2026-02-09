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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { feedback } from "./feedback";

/**
 * Unified integrations table - supports all provider types.
 * Replaces provider-specific tables like github_integrations.
 */
export const integrations = pgTable(
  "integrations",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    
    // Provider type: 'github', 'jira', 'linear', 'slack', 'discord'
    type: text("type").notNull(),
    
    // Integration name (user-defined, e.g., "Main GitHub Repo")
    name: text("name"),
    
    // Enabled state
    enabled: boolean("enabled").notNull().default(true),
    
    // OAuth tokens (should be encrypted in production)
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    
    // Provider-specific configuration (JSON)
    // GitHub: { owner, repo }
    // Jira: { siteUrl, projectKey }
    // Linear: { teamId }
    // Slack: { channelId, webhookUrl }
    config: jsonb("config").$type<Record<string, unknown>>(),
    
    // Sync settings (JSON)
    syncSettings: jsonb("syncSettings").$type<{
      triggerStatuses?: string[];
      syncStatusChanges?: boolean;
      syncComments?: boolean;
      autoAddLabels?: boolean;
      statusMapping?: Record<string, string>;
      labelMapping?: Record<string, string>;
    }>(),
    
    // Connection metadata
    connectedBy: text("connectedBy"),
    lastSyncAt: timestamp("lastSyncAt"),
    webhookSecret: text("webhookSecret"),
    
    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdx: index("idx_integrations_orgId").on(table.organizationId),
    typeIdx: index("idx_integrations_type").on(table.type),
    orgTypeIdx: index("idx_integrations_org_type").on(
      table.organizationId,
      table.type
    ),
  })
);

/**
 * External issues table - tracks links between feedback and external issues.
 * Supports multiple providers linking to the same feedback.
 */
export const externalIssues = pgTable(
  "external_issues",
  {
    id: serial("id").primaryKey(),
    
    // Reference to local feedback
    feedbackId: integer("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    
    // Reference to integration
    integrationId: integer("integrationId")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    
    // External system identifiers
    externalId: text("externalId").notNull(), // e.g., GitHub issue node_id
    externalNumber: integer("externalNumber"), // e.g., GitHub issue #123
    externalUrl: text("externalUrl"),
    externalStatus: text("externalStatus"),
    
    // Sync tracking
    lastSyncedAt: timestamp("lastSyncedAt"),
    syncError: text("syncError"),
    
    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    feedbackIdx: index("idx_external_issues_feedbackId").on(table.feedbackId),
    integrationIdx: index("idx_external_issues_integrationId").on(
      table.integrationId
    ),
    externalIdIdx: index("idx_external_issues_externalId").on(
      table.externalId
    ),
    // Unique constraint: one external issue per feedback per integration
    uniqueFeedbackIntegration: uniqueIndex(
      "idx_external_issues_feedback_integration"
    ).on(table.feedbackId, table.integrationId),
  })
);

// Relations
export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
  externalIssues: many(externalIssues),
}));

export const externalIssuesRelations = relations(externalIssues, ({ one }) => ({
  feedback: one(feedback, {
    fields: [externalIssues.feedbackId],
    references: [feedback.feedbackId],
  }),
  integration: one(integrations, {
    fields: [externalIssues.integrationId],
    references: [integrations.id],
  }),
}));

// Type exports
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type ExternalIssue = typeof externalIssues.$inferSelect;
export type NewExternalIssue = typeof externalIssues.$inferInsert;
