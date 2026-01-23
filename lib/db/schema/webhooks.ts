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
import { organizations } from "./organizations";

export const webhooks = pgTable(
  "webhooks",
  {
    webhookId: serial("webhookId").primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret"),
    events: jsonb("events").$type<string[]>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdx: index("idx_webhooks_orgId").on(table.organizationId),
    enabledIdx: index("idx_webhooks_enabled").on(table.enabled),
  }),
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    eventId: serial("eventId").primaryKey(),
    webhookId: integer("webhookId")
      .notNull()
      .references(() => webhooks.webhookId, { onDelete: "cascade" }),
    eventType: text("eventType").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status", {
      enum: ["pending", "sending", "delivered", "failed"],
    })
      .notNull()
      .default("pending"),
    responseStatus: integer("responseStatus"),
    responseBody: text("responseBody"),
    retryCount: integer("retryCount").notNull().default(0),
    maxRetries: integer("maxRetries").notNull().default(3),
    nextRetryAt: timestamp("nextRetryAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    webhookIdx: index("idx_webhook_events_webhookId").on(table.webhookId),
    statusIdx: index("idx_webhook_events_status").on(table.status),
    nextRetryIdx: index("idx_webhook_events_nextRetry").on(table.nextRetryAt),
  }),
);

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
  events: many(webhookEvents),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookEvents.webhookId],
    references: [webhooks.webhookId],
  }),
}));

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
