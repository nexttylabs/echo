# Admin Feedback Route Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all feedback management routes under `/admin`, removing legacy `/feedback` and `/feedback/new` dashboard paths.

**Architecture:** Keep admin list and detail at `/admin/feedback` and `/admin/feedback/[id]`, add `/admin/feedback/new` by moving the submit-on-behalf page, and delete the old dashboard feedback list. Update all internal links and list defaults to use the `/admin` base. No redirects.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Bun.

### Task 1: Remove legacy dashboard feedback list route

**Files:**
- Delete: `app/(dashboard)/feedback/page.tsx`

**Step 1: Write the failing test**

```ts
// tests/e2e/feedback-management.spec.ts (add a case asserting /feedback is 404)
// Example (Playwright):
// await page.goto("/feedback");
// await expect(page.getByText("Not Found")).toBeVisible();
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/e2e/feedback-management.spec.ts`
Expected: FAIL because `/feedback` still exists

**Step 3: Remove the legacy route**

```ts
// Delete file: app/(dashboard)/feedback/page.tsx
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/e2e/feedback-management.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/(dashboard)/feedback/page.tsx tests/e2e/feedback-management.spec.ts
git commit -m "refactor: remove legacy feedback list route"
```

### Task 2: Move submit-on-behalf route under /admin

**Files:**
- Move: `app/(dashboard)/feedback/new/page.tsx` → `app/(dashboard)/admin/feedback/new/page.tsx`

**Step 1: Write the failing test**

```ts
// tests/e2e/feedback-customer.spec.ts (update /feedback/new -> /admin/feedback/new and assert old path 404)
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/e2e/feedback-customer.spec.ts`
Expected: FAIL with old URL

**Step 3: Move the route file**

```bash
mkdir -p app/(dashboard)/admin/feedback/new
mv app/(dashboard)/feedback/new/page.tsx app/(dashboard)/admin/feedback/new/page.tsx
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/e2e/feedback-customer.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/(dashboard)/admin/feedback/new/page.tsx app/(dashboard)/feedback/new/page.tsx tests/e2e/feedback-customer.spec.ts
git commit -m "refactor: move submit-on-behalf route under admin"
```

### Task 3: Update navigation links to /admin

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/dashboard/quick-actions.tsx`
- Modify: `components/dashboard/recent-feedback-list.tsx`

**Step 1: Write the failing test**

```ts
// tests/e2e/feedback-management.spec.ts or a unit test
// Assert sidebar/quick-actions links resolve to /admin/feedback and /admin/feedback/new
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/e2e/feedback-management.spec.ts`
Expected: FAIL (links still /feedback)

**Step 3: Update links**

```ts
// sidebar: /feedback -> /admin/feedback
// quick-actions: /feedback -> /admin/feedback
// recent-feedback-list: /feedback -> /admin/feedback, /feedback/new -> /admin/feedback/new
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/e2e/feedback-management.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add components/layout/sidebar.tsx components/dashboard/quick-actions.tsx components/dashboard/recent-feedback-list.tsx tests/e2e/feedback-management.spec.ts
git commit -m "refactor: point feedback navigation to admin routes"
```

### Task 4: Default feedback list base path to /admin

**Files:**
- Modify: `components/feedback/feedback-list.tsx`
- Modify: `components/feedback/feedback-list-item.tsx`

**Step 1: Write the failing test**

```ts
// tests/components/feedback/feedback-list.test.tsx (new)
// Render FeedbackList without basePath and assert item links are /admin/feedback/:id
```

**Step 2: Run test to verify it fails**

Run: `bun run test tests/components/feedback/feedback-list.test.tsx`
Expected: FAIL because default basePath is /feedback

**Step 3: Update defaults**

```ts
// basePath default: "/feedback" -> "/admin/feedback"
```

**Step 4: Run test to verify it passes**

Run: `bun run test tests/components/feedback/feedback-list.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/feedback/feedback-list.tsx components/feedback/feedback-list-item.tsx tests/components/feedback/feedback-list.test.tsx
git commit -m "refactor: default feedback list links to admin"
```

### Task 5: Verification

**Files:**
- (No new files)

**Step 1: Run lint**

Run: `bun run lint`
Expected: Warnings only; no new errors

**Step 2: Smoke-check routes**

- `/admin/feedback` loads list
- `/admin/feedback/[id]` loads detail
- `/admin/feedback/new` loads submit-on-behalf form
- `/feedback` and `/feedback/new` 404

**Step 3: Commit (if needed)**

```bash
git add -A
git commit -m "chore: verify admin feedback routes"
```
