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
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const githubIntegrations = pgTable(
  "github_integrations",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accessToken: text("accessToken").notNull(),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    labelMapping: jsonb("labelMapping").$type<Record<string, string>>(),
    statusMapping: jsonb("statusMapping").$type<Record<string, string>>(),
    autoSync: boolean("autoSync").notNull().default(true),
    webhookSecret: text("webhookSecret"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdx: index("idx_github_integrations_orgId").on(table.organizationId),
  }),
);

export const githubIntegrationsRelations = relations(
  githubIntegrations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [githubIntegrations.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type GitHubIntegration = typeof githubIntegrations.$inferSelect;
export type NewGitHubIntegration = typeof githubIntegrations.$inferInsert;
