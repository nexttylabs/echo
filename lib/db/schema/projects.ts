/*
 * Copyright (c) 2026 Echo Team
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
  uuid,
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

export const projects = pgTable(
  "projects",
  {
    projectId: uuid("projectId").defaultRandom().primaryKey(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
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
    orgIdx: index("idx_projects_orgId").on(table.organizationId),
    slugOrgUnique: unique("unique_slug_org").on(table.slug, table.organizationId),
    customDomainUnique: unique("unique_custom_domain").on(table.customDomain),
  }),
);

export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
