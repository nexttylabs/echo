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
} from "drizzle-orm/pg-core";
import { feedback } from "./feedback";

export const tags = pgTable("tags", {
  tagId: serial("tagId").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color").default("#3b82f6"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const feedbackTags = pgTable(
  "feedback_tags",
  {
    id: serial("id").primaryKey(),
    feedbackId: integer("feedbackId")
      .notNull()
      .references(() => feedback.feedbackId, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tags.tagId, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    feedbackIdIdx: index("idx_feedback_tags_feedbackId").on(table.feedbackId),
    tagIdIdx: index("idx_feedback_tags_tagId").on(table.tagId),
    uniqueFeedbackTag: index("idx_feedback_tags_unique").on(
      table.feedbackId,
      table.tagId,
    ),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  feedbackTags: many(feedbackTags),
}));

export const feedbackTagsRelations = relations(feedbackTags, ({ one }) => ({
  feedback: one(feedback, {
    fields: [feedbackTags.feedbackId],
    references: [feedback.feedbackId],
  }),
  tag: one(tags, {
    fields: [feedbackTags.tagId],
    references: [tags.tagId],
  }),
}));

export const PREDEFINED_TAGS = [
  {
    name: "Performance",
    slug: "performance",
    keywords: [
      "performance",
      "slow",
      "lag",
      "性能",
      "慢",
      "卡顿",
      "延迟",
      "优化",
    ],
  },
  {
    name: "UI/UX",
    slug: "ui-ux",
    keywords: [
      "ui",
      "ux",
      "interface",
      "design",
      "layout",
      "界面",
      "设计",
      "布局",
      "体验",
    ],
  },
  {
    name: "Security",
    slug: "security",
    keywords: [
      "security",
      "auth",
      "permission",
      "安全",
      "权限",
      "认证",
      "登录",
    ],
  },
  {
    name: "Mobile",
    slug: "mobile",
    keywords: ["mobile", "ios", "android", "app", "phone", "移动", "手机"],
  },
  {
    name: "API",
    slug: "api",
    keywords: ["api", "endpoint", "integration", "接口", "集成"],
  },
  {
    name: "Database",
    slug: "database",
    keywords: ["database", "db", "query", "data", "数据库", "查询", "数据"],
  },
  {
    name: "Documentation",
    slug: "documentation",
    keywords: [
      "docs",
      "documentation",
      "guide",
      "tutorial",
      "文档",
      "指南",
      "教程",
    ],
  },
  {
    name: "Accessibility",
    slug: "accessibility",
    keywords: ["a11y", "accessibility", "screen reader", "无障碍", "辅助"],
  },
  {
    name: "Localization",
    slug: "localization",
    keywords: [
      "i18n",
      "l10n",
      "localization",
      "translation",
      "language",
      "国际化",
      "翻译",
      "语言",
    ],
  },
  {
    name: "Testing",
    slug: "testing",
    keywords: ["test", "testing", "spec", "测试"],
  },
  {
    name: "Billing",
    slug: "billing",
    keywords: [
      "billing",
      "payment",
      "price",
      "subscription",
      "账单",
      "支付",
      "价格",
      "订阅",
    ],
  },
  {
    name: "Integration",
    slug: "integration",
    keywords: ["integration", "webhook", "third-party", "集成", "第三方"],
  },
] as const;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type FeedbackTag = typeof feedbackTags.$inferSelect;
export type NewFeedbackTag = typeof feedbackTags.$inferInsert;
