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
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export type WidgetConfig = {
  theme?: "light" | "dark" | "auto";
  primaryColor?: string;
  buttonText?: string;
  buttonPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  fields?: {
    showType?: boolean;
    showPriority?: boolean;
    showDescription?: boolean;
    requireEmail?: boolean;
  };
  types?: string[];
  customCSS?: string;
};

export type PortalThemeConfig = {
  mode?: "light" | "dark" | "system";
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  fontFamily?: string;
  customCSS?: string;
};

export type PortalCopyConfig = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  emptyStateMessage?: string;
  successMessage?: string;
  placeholders?: {
    titleInput?: string;
    descriptionInput?: string;
  };
};

export type PortalSeoConfig = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  favicon?: string;
  noIndex?: boolean;
};

export type PortalSharingConfig = {
  enabled?: boolean;
  allowPublicVoting?: boolean;
  allowPublicComments?: boolean;
  showVoteCount?: boolean;
  showAuthor?: boolean;
  socialSharing?: {
    twitter?: boolean;
    linkedin?: boolean;
    facebook?: boolean;
  };
};

export type PortalConfig = {
  theme?: PortalThemeConfig;
  copy?: PortalCopyConfig;
  seo?: PortalSeoConfig;
  sharing?: PortalSharingConfig;
  languages?: string[];
  defaultLanguage?: string;
  modules?: {
    feedback?: boolean;
    roadmap?: boolean;
    changelog?: boolean;
    help?: boolean;
  };
};

export const organizationSettings = pgTable(
  "organization_settings",
  {
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" })
      .primaryKey(),
    widgetConfig: jsonb("widgetConfig").$type<WidgetConfig>(),
    portalConfig: jsonb("portalConfig").$type<PortalConfig>(),
    customDomain: text("customDomain"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    orgIdx: index("idx_org_settings_orgId").on(table.organizationId),
    customDomainUnique: unique("unique_org_custom_domain").on(table.customDomain),
  })
);

export const organizationSettingsRelations = relations(
  organizationSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSettings.organizationId],
      references: [organizations.id],
    }),
  })
);

export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;
