# Organization-Only Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove project/board concepts and consolidate all data and UX at the organization level, with a public portal at `/<organizationSlug>` and three fixed sections: Feedback, Roadmap, Changelog.

**Architecture:** Drop the `projects` table and all `projectId` references. Introduce organization-level settings for portal/widget/custom domain (new `organization_settings` table). Update routes, APIs, and UI to be organization-scoped only. Public portal uses org slug paths (`/<orgSlug>`, `/<orgSlug>/roadmap`, `/<orgSlug>/changelog`).

**Tech Stack:** Next.js App Router, Drizzle ORM, PostgreSQL, TypeScript, Tailwind, Bun.

---

## Task 1: Add organization settings schema + drop project references in DB

**Files:**
- Create: `lib/db/schema/organization-settings.ts`
- Modify: `lib/db/schema/organizations.ts`
- Modify: `lib/db/schema/feedback.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/db/migrations/0019_remove_projects_add_org_settings.sql`

**Step 1: Write failing schema test (optional if no schema tests exist)**
- If schema tests exist, add a test in `tests/lib/organization-settings-schema.test.ts` to assert default config merging or type presence. Otherwise skip.

**Step 2: Write organization settings schema**
- Create `lib/db/schema/organization-settings.ts`:
```ts
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
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

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSettings.organizationId],
    references: [organizations.id],
  }),
}));

export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;
```

**Step 3: Remove `projectId` from feedback schema**
- Update `lib/db/schema/feedback.ts`:
  - Remove import of `projects`.
  - Remove `projectId` column and `idx_feedback_projectId` index.

**Step 4: Update schema index exports**
- Remove `projects` export, add `organization-settings` export in `lib/db/schema/index.ts`.

**Step 5: Write migration**
- Create `lib/db/migrations/0019_remove_projects_add_org_settings.sql`:
```sql
DROP TABLE IF EXISTS "projects" CASCADE;
ALTER TABLE "feedback" DROP COLUMN IF EXISTS "projectId";
DROP INDEX IF EXISTS "idx_feedback_projectId";

CREATE TABLE "organization_settings" (
  "organizationId" text PRIMARY KEY REFERENCES "organizations"("id") ON DELETE cascade,
  "widgetConfig" jsonb,
  "portalConfig" jsonb,
  "customDomain" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "idx_org_settings_orgId" ON "organization_settings" ("organizationId");
ALTER TABLE "organization_settings" ADD CONSTRAINT "unique_org_custom_domain" UNIQUE ("customDomain");
```

**Step 6: Commit**
```bash
git add lib/db/schema/organization-settings.ts lib/db/schema/feedback.ts lib/db/schema/index.ts lib/db/migrations/0019_remove_projects_add_org_settings.sql

git commit -m "feat: add organization settings and drop project schema"
```

---

## Task 2: Replace portal settings service with organization-scoped service

**Files:**
- Modify: `lib/services/portal-settings.ts`

**Step 1: Write failing test for portal settings (if applicable)**
- Add/adjust test in `tests/lib/portal-settings.test.ts` (create if missing) to assert organization-scoped read/write.

**Step 2: Update service implementation**
- Replace `projectId` params with `organizationId` and query `organizationSettings`:
```ts
import { organizationSettings, PortalConfig } from "@/lib/db/schema";

export async function getPortalSettings(organizationId: string): Promise<PortalConfig | null> { /* ... */ }
export async function updatePortalSettings<T extends keyof PortalConfig>(
  organizationId: string,
  section: T,
  data: PortalConfig[T]
): Promise<{ success: boolean; error?: string }> { /* ... */ }
export async function updateFullPortalConfig(
  organizationId: string,
  config: PortalConfig
): Promise<{ success: boolean; error?: string }> { /* ... */ }
```
- Ensure `organization_settings` row exists (insert on first write if missing).

**Step 3: Commit**
```bash
git add lib/services/portal-settings.ts

git commit -m "refactor: scope portal settings to organization"
```

---

## Task 3: Remove project APIs and adjust feedback API

**Files:**
- Delete: `app/api/projects/route.ts`
- Delete: `app/api/projects/[projectId]/route.ts`
- Modify: `app/api/feedback/route.ts`
- Modify: `app/api/feedback/handler.ts`
- Modify: `lib/validators/feedback.ts`

**Step 1: Update feedback validation**
- Remove `projectId` from `feedbackSchema`.

**Step 2: Update feedback POST handler**
- Remove `projectId` insert in `app/api/feedback/handler.ts`.

**Step 3: Update feedback GET handler**
- Remove `projectId` filter logic from `app/api/feedback/route.ts`.

**Step 4: Remove project APIs**
- Delete both project route files and update any import references.

**Step 5: Commit**
```bash
git add app/api/feedback/route.ts app/api/feedback/handler.ts lib/validators/feedback.ts

git rm app/api/projects/route.ts app/api/projects/[projectId]/route.ts

git commit -m "refactor: remove project APIs and projectId in feedback"
```

---

## Task 4: Update portal routing to organization-only public paths

**Files:**
- Create: `app/[organizationSlug]/page.tsx`
- Create: `app/[organizationSlug]/roadmap/page.tsx`
- Create: `app/[organizationSlug]/changelog/page.tsx`
- Delete: `app/portal/page.tsx`
- Delete: `app/portal/[orgSlug]/[projectSlug]/page.tsx`
- Modify: `components/portal/portal-shell.tsx`
- Modify: `components/portal/portal-nav.tsx`

**Step 1: Add org portal pages**
- `app/[organizationSlug]/page.tsx` should load org by slug and render Feedback tab.
- Roadmap/Changelog pages can be placeholder components for now (e.g. empty states) but must render PortalShell with proper section links.

**Step 2: Update PortalShell to accept only `organizationId`**
- Remove `projectId` prop; pass organizationId only.

**Step 3: Ensure PortalNav highlights active tab by pathname**
- Keep `usePathname` and ensure section hrefs are `/${orgSlug}`, `/${orgSlug}/roadmap`, `/${orgSlug}/changelog`.

**Step 4: Commit**
```bash
git add app/[organizationSlug]/page.tsx app/[organizationSlug]/roadmap/page.tsx app/[organizationSlug]/changelog/page.tsx components/portal/portal-shell.tsx components/portal/portal-nav.tsx

git rm app/portal/page.tsx app/portal/[orgSlug]/[projectSlug]/page.tsx

git commit -m "feat: move public portal to organization routes"
```

---

## Task 5: Update widget and embedded feedback to org-only

**Files:**
- Modify: `app/widget/[organizationId]/[projectId]/page.tsx` → move to `app/widget/[organizationId]/page.tsx`
- Modify: `components/feedback/embedded-feedback-form.tsx`
- Modify: `components/widget/widget-form.tsx`
- Modify: `components/project/embed-code-generator.tsx` (or delete if unused)

**Step 1: Replace widget route**
- New route: `app/widget/[organizationId]/page.tsx` reads organization settings and portal/widget configs.
- Update embed code to use `/widget/${organizationId}` only.

**Step 2: Update embedded feedback form**
- Remove `projectId` prop and any submit payload usage.

**Step 3: Commit**
```bash
git add app/widget/[organizationId]/page.tsx components/feedback/embedded-feedback-form.tsx components/widget/widget-form.tsx

git rm app/widget/[organizationId]/[projectId]/page.tsx

git commit -m "refactor: org-only widget and embedded feedback"
```

---

## Task 6: Remove project UI and update settings to organization portal

**Files:**
- Delete: `components/project/*`
- Delete: `app/(dashboard)/settings/projects/**`
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/mobile-sidebar.tsx`
- Modify: `components/layout/dashboard-layout.tsx`
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `components/settings/settings-sidebar.tsx`
- Create: `app/(dashboard)/settings/organization/portal/page.tsx`
- Modify: `components/portal/portal-settings-shell.tsx`
- Modify: `components/portal/portal-overview.tsx`
- Modify: portal settings forms to accept `organizationId` instead of `projectId`

**Step 1: Remove project UI**
- `git rm -r components/project app/(dashboard)/settings/projects`

**Step 2: Update layout/sidebar to remove project list**
- Remove `projects` props and related UI sections.

**Step 3: Update portal settings UI for organization**
- `PortalSettingsShell` becomes org-only (no selector).
- Update `PortalModulesPanel` + settings forms to accept `organizationId`.
- Add new route `/settings/organization/portal` to render portal settings with organization context.

**Step 4: Commit**
```bash
git add components/layout/sidebar.tsx components/layout/mobile-sidebar.tsx components/layout/dashboard-layout.tsx app/(dashboard)/layout.tsx components/portal/portal-settings-shell.tsx components/portal/portal-overview.tsx components/portal/portal-modules-panel.tsx components/portal/settings-forms/* app/(dashboard)/settings/organization/portal/page.tsx components/settings/settings-sidebar.tsx

git rm -r components/project app/(dashboard)/settings/projects

git commit -m "refactor: remove project UI and move portal settings to organization"
```

---

## Task 7: Update internal services and routes for organization context

**Files:**
- Delete: `lib/projects/get-projects.ts`
- Delete: `lib/projects/get-project-for-settings.ts`
- Delete: `lib/routes/projects.ts`
- Modify: `app/api/internal/domain-lookup/route.ts`
- Modify: `lib/services/github-sync.ts` (if it references projects)

**Step 1: Remove project helper modules**
- `git rm lib/projects/get-projects.ts lib/projects/get-project-for-settings.ts lib/routes/projects.ts`

**Step 2: Update domain lookup**
- Query `organizationSettings.customDomain` joined to `organizations`.
- Response should include `orgSlug` and `organizationId` only.

**Step 3: Commit**
```bash
git add app/api/internal/domain-lookup/route.ts

git rm lib/projects/get-projects.ts lib/projects/get-project-for-settings.ts lib/routes/projects.ts

git commit -m "refactor: drop project helpers and update domain lookup"
```

---

## Task 8: Clean up tests for project removal + add org-portal tests

**Files:**
- Delete: `tests/api/projects.test.ts`
- Delete: `tests/lib/routes/projects.test.ts`
- Delete or update: `tests/components/portal-project-switcher.test.tsx`
- Update: `tests/app/portal-page.test.ts`
- Update: `tests/components/layout/sidebar.test.tsx`
- Update: `tests/components/project-settings-tabs.test.tsx`
- Update: any project-based tests to org equivalents

**Step 1: Update portal page test**
- Point to new `app/[organizationSlug]/page.tsx` exports (or test for sections construction via helper).

**Step 2: Remove project-only tests**
- Remove tests that validate project routes/components.

**Step 3: Add org portal nav test**
- Add a test that ensures portal sections are `/${orgSlug}`, `/${orgSlug}/roadmap`, `/${orgSlug}/changelog`.

**Step 4: Commit**
```bash
git add tests/app/portal-page.test.ts tests/components/layout/sidebar.test.tsx

git rm tests/api/projects.test.ts tests/lib/routes/projects.test.ts tests/components/portal-project-switcher.test.tsx tests/components/project-settings-tabs.test.tsx

git commit -m "test: align portal and layout tests to org-only model"
```

---

## Task 9: Docs cleanup (minimal)

**Files:**
- Modify: `docs/route-role-visibility.md`
- Modify: `docs/user-story-tracking.md`

**Step 1: Replace project routes with organization routes**
- Remove references to `/settings/projects/*` and `/widget/[organizationId]/[projectId]`.
- Add `/settings/organization/portal` and `/<organizationSlug>`.

**Step 2: Commit**
```bash
git add docs/route-role-visibility.md docs/user-story-tracking.md

git commit -m "docs: update routes for organization-only model"
```

---

## Task 10: Verification

**Step 1: Run tests (expect current baseline lint warnings still present)**
```bash
bun run lint
bun test
```
Expected: lint may still warn as before; new tests should pass.

**Step 2: Manual smoke**
- Visit `/settings/organization/portal` and confirm portal settings render.
- Visit `/<organizationSlug>` and see tabs for Feedback/Roadmap/Changelog.
- Visit `/widget/<organizationId>` and submit feedback (no projectId in payload).

---

Plan complete and saved to `docs/plans/2026-01-10-organization-only-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
