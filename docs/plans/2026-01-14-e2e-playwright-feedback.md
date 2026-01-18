# Playwright Feedback Submission E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Playwright E2E smoke test that registers a user, opens the organization portal, submits feedback, and confirms it appears in the list.

**Architecture:** Use Playwright for browser automation and `page.request` to call `/api/auth/register` in the same browser context to seed a user+organization, then drive the portal UI to create a feedback post. Store test config in `playwright.config.ts` with a local dev server and standard artifacts.

**Tech Stack:** Playwright, Bun, Next.js App Router, better-auth, Drizzle/Postgres.

### Task 1: Add the failing E2E test (red)

**Files:**
- Create: `tests/e2e/feedback-submit.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e+${Date.now()}@example.com`;
}

function uniqueTitle() {
  return `E2E feedback ${Date.now()}`;
}

test("feedback submission from portal creates a new post", async ({ page }) => {
  const email = uniqueEmail();
  const password = "StrongPass123!";
  const name = "E2E User";

  const register = await page.request.post("/api/auth/register", {
    data: { name, email, password },
  });

  expect(register.ok()).toBeTruthy();
  const json = await register.json();
  const slug = json?.data?.organization?.slug;
  expect(slug).toBeTruthy();

  const title = uniqueTitle();

  await page.goto(`/${slug}`);
  await page.getByRole("button", { name: "Submit Feedback" }).click();

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("This is an E2E submission.");
  await page.getByRole("button", { name: "Create Post" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: FAIL because Playwright is not installed/configured.

### Task 2: Add Playwright tooling/configuration (green for tooling)

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Step 1: Write minimal Playwright config**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

**Step 2: Add scripts/deps**

- Add devDependency: `@playwright/test`
- Add script: `"test:e2e": "bunx playwright test"`
- Add script: `"test:e2e:ui": "bunx playwright test --ui"`

**Step 3: Ignore Playwright artifacts**

Add to `.gitignore`:
```
playwright-report/
test-results/
.playwright/
```

**Step 4: Run the failing test again**

Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: FAIL due to missing/incorrect behavior in the app (if any), or PASS if flow works end-to-end.

### Task 3: Make the test pass (minimal changes)

**Files:**
- Modify (if needed): `components/portal/create-post-dialog.tsx`
- Modify (if needed): `components/portal/feedback-board.tsx`
- Modify (if needed): `app/[organizationSlug]/page.tsx`
- Modify (if needed): `tests/e2e/feedback-submit.spec.ts`

**Step 1: Observe failure and identify the minimal fix**

Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: FAIL with a clear reason (e.g., button labels differ, missing fields, redirect to login).

**Step 2: Apply minimal code change**

Examples (only if needed):
- If button label mismatches, prefer role/label selectors or update labels.
- If dialog doesn’t open due to auth, ensure register call sets cookies (use `page.request` only, not a separate request context).

**Step 3: Re-run the test**

Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: PASS.

**Step 4: Commit**

```bash
git add playwright.config.ts package.json .gitignore tests/e2e/feedback-submit.spec.ts
# plus any modified app files if needed
git commit -m "test: add Playwright E2E feedback submission"
```

### Task 4: Document local E2E prerequisites

**Files:**
- Modify: `README.md`

**Step 1: Add E2E run instructions**

Add a short section:
- Set `DATABASE_URL` and `BETTER_AUTH_SECRET`
- Run migrations: `bun run db:migrate`
- Run: `bun run test:e2e`

**Step 2: Verify docs**

Run: `rg -n "E2E" README.md`
Expected: section present.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add Playwright E2E setup"
```
