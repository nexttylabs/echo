# Admin Feedback Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the admin feedback list/detail UX with i18n consistency, safer row interactions, bulk actions, and pagination controls.

**Architecture:** Keep `/admin/feedback` client-driven. `FeedbackList` owns selection and refresh; `FeedbackListControls` manages filters/sort/page size; a new bulk API route performs multi-row updates with permission checks and status history inserts. All UI strings and relative dates are localized via `next-intl`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, next-intl, Tailwind CSS, Bun, Drizzle ORM.

### Task 1: i18n foundations for feedback admin UI

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/jp.json`

**Step 1: Write the failing test**

Add a minimal test that references new translation keys so missing keys fail.

```ts
// tests/components/feedback-i18n-keys.test.ts
import { describe, expect, it } from "bun:test";
import en from "@/messages/en.json";

const requiredKeys = [
  "feedback.list.searchPlaceholder",
  "feedback.list.searchButton",
  "feedback.list.sortLabel",
  "feedback.list.pageSizeLabel",
  "feedback.list.summary",
  "feedback.list.empty",
  "feedback.list.error",
  "feedback.pagination.jumpTo",
  "feedback.pagination.go",
  "feedback.bulk.selectedCount",
  "feedback.bulk.deleteConfirmTitle",
  "feedback.bulk.deleteConfirmDesc",
  "feedback.vote.vote",
  "feedback.vote.voted",
  "feedback.relative.daysAgo",
];

const get = (obj: Record<string, unknown>, path: string) =>
  path.split(".").reduce((acc, key) => (acc as any)?.[key], obj);

describe("feedback i18n keys", () => {
  it("contains required keys", () => {
    requiredKeys.forEach((key) => {
      expect(get(en as any, key)).toBeTruthy();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback-i18n-keys.test.ts`
Expected: FAIL with missing translation keys.

**Step 3: Write minimal implementation**

Add the required keys to each locale file. Example (English):

```json
"feedback": {
  "list": {
    "searchPlaceholder": "Search title or description…",
    "searchButton": "Search",
    "sortLabel": "Sort",
    "pageSizeLabel": "Per page",
    "summary": "Total {total} / {pageSize} per page",
    "empty": "No feedback yet",
    "error": "Error: {message}"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "jumpTo": "Go to",
    "go": "Go"
  },
  "bulk": {
    "selectedCount": "{count} selected",
    "updateStatus": "Update status",
    "updatePriority": "Update priority",
    "delete": "Delete",
    "deleteConfirmTitle": "Delete selected feedback?",
    "deleteConfirmDesc": "Deleted feedback will no longer appear in the list."
  },
  "vote": {
    "vote": "Vote",
    "voted": "Voted",
    "count": "{count} votes"
  },
  "relative": {
    "today": "Today",
    "yesterday": "Yesterday",
    "daysAgo": "{count} days ago"
  },
  "detail": {
    "createdAt": "Created",
    "updatedAt": "Updated",
    "feedbackId": "Feedback ID",
    "votes": "Votes",
    "description": "Description",
    "attachments": "Attachments",
    "votesTitle": "Votes",
    "statusHistory": "Status History"
  },
  "actions": {
    "label": "Feedback actions"
  }
}
```

Mirror the same keys in `messages/zh-CN.json` and `messages/jp.json` with localized strings.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback-i18n-keys.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add messages/en.json messages/zh-CN.json messages/jp.json tests/components/feedback-i18n-keys.test.ts
git commit -m "test: assert feedback admin i18n keys"
```

### Task 2: Update list controls (remove assignee, add page-size, i18n labels)

**Files:**
- Modify: `components/feedback/feedback-list-controls.tsx`
- Modify: `components/feedback/feedback-list.tsx`
- Modify: `tests/components/feedback-list-controls.test.tsx`

**Step 1: Write the failing test**

Update the list controls test to expect i18n-driven labels and page size select.

```ts
// tests/components/feedback-list-controls.test.tsx
mock.module("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    key === "feedback.list.searchPlaceholder"
      ? "Search title or description…"
      : key === "feedback.list.searchButton"
        ? "Search"
        : key,
}));

// ...in test
expect(getByLabelText("Search title or description…")).toBeTruthy();
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: FAIL because translations and page size are not wired.

**Step 3: Write minimal implementation**

- Remove assignee state, members fetch, and dropdown.
- Add `useTranslations("feedback")` and replace hardcoded strings.
- Add a page-size `<Select>` that updates `pageSize` param.
- Update `FeedbackList` to read `pageSize` from query and pass into fetch.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/feedback/feedback-list-controls.tsx components/feedback/feedback-list.tsx tests/components/feedback-list-controls.test.tsx
git commit -m "feat: localize feedback list controls and drop assignee filter"
```

### Task 3: Safer list items + selection + vote display

**Files:**
- Modify: `components/feedback/feedback-list-item.tsx`
- Modify: `components/feedback/vote-button.tsx`
- Add: `tests/components/feedback-list-item.test.tsx`

**Step 1: Write the failing test**

Create a test that ensures clicking the delete button does not trigger row navigation and that selection checkbox renders.

```tsx
// tests/components/feedback-list-item.test.tsx
import { describe, expect, it, mock } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { FeedbackListItem } from "@/components/feedback/feedback-list-item";
import "../setup";

const push = mock();
mock.module("next/navigation", () => ({ useRouter: () => ({ push }) }));
mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

it("does not navigate when delete is clicked", () => {
  const { getByLabelText } = render(
    <FeedbackListItem
      feedback={{
        feedbackId: 1,
        title: "Title",
        description: "Desc",
        type: "bug",
        priority: "low",
        status: "new",
        createdAt: new Date().toISOString(),
        voteCount: 2,
      }}
      canDelete
      isSelected={false}
      onSelect={() => {}}
    />
  );

  fireEvent.click(getByLabelText("feedback.list.delete"));
  expect(push).not.toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback-list-item.test.tsx`
Expected: FAIL (no selection props, missing aria label, row click uses Link).

**Step 3: Write minimal implementation**

- Replace outer `<Link>` with a `<Card>` that calls `router.push` on click.
- Add checkbox and `isSelected/onSelect` props; stop propagation on checkbox, vote, and delete.
- Replace `VoteButton` in the list with a non-clickable badge showing `{count} votes`.
- Localize status/type/priority labels and relative dates using `useTranslations` and `useLocale`.
- Localize vote button text in `components/feedback/vote-button.tsx` using `useTranslations("feedback")`.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback-list-item.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/feedback/feedback-list-item.tsx components/feedback/vote-button.tsx tests/components/feedback-list-item.test.tsx
git commit -m "feat: safer feedback list items with selection and i18n"
```

### Task 4: Bulk action UI + list state refresh

**Files:**
- Modify: `components/feedback/feedback-list.tsx`
- Add: `components/feedback/feedback-bulk-actions.tsx`

**Step 1: Write the failing test**

Add a component test that shows the bulk action bar after selecting rows.

```tsx
// tests/components/feedback-bulk-actions.test.tsx
import { describe, expect, it, mock } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { FeedbackBulkActions } from "@/components/feedback/feedback-bulk-actions";
import "../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    key === "feedback.bulk.selectedCount" ? `${vars?.count} selected` : key,
}));

it("renders selection count", () => {
  const { getByText } = render(
    <FeedbackBulkActions
      selectedIds={[1, 2]}
      onClear={() => {}}
      onCompleted={() => {}}
    />
  );
  expect(getByText("2 selected")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback-bulk-actions.test.tsx`
Expected: FAIL (component missing).

**Step 3: Write minimal implementation**

- Create `FeedbackBulkActions` to render count, status/priority selects, and delete button.
- Call `POST /api/feedback/bulk` for bulk actions.
- In `FeedbackList`, track `selectedIds`, pass selection props to items, and show the bulk bar when `selectedIds.length > 0`.
- Add a header checkbox to select all on the current page; clear selection on refresh.
- Use `fetchFeedback` as a `useCallback` so bulk actions can refresh the list after success.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback-bulk-actions.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/feedback/feedback-list.tsx components/feedback/feedback-bulk-actions.tsx tests/components/feedback-bulk-actions.test.tsx
git commit -m "feat: bulk actions UI for feedback list"
```

### Task 5: Bulk API route (status/priority/delete)

**Files:**
- Add: `app/api/feedback/bulk/route.ts`
- Modify: `tests/api/feedback-filter.test.ts`
- Add: `tests/api/feedback-bulk.test.ts`

**Step 1: Write the failing test**

Add tests for validation and permissions on bulk actions.

```ts
// tests/api/feedback-bulk.test.ts
import { describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

mock.module("@/lib/auth/config", () => ({
  auth: { api: { getSession: mock(() => Promise.resolve({ user: { id: "u1" } })) } },
}));

mock.module("@/lib/auth/org-context", () => ({
  getOrgContext: mock(() => Promise.resolve({ organizationId: "org_1", memberRole: "developer" })),
}));

mock.module("@/lib/db", () => ({ db: null }));

it("returns 500 when db is missing", async () => {
  const { POST } = await import("@/app/api/feedback/bulk/route");
  const req = new NextRequest("http://localhost/api/feedback/bulk", {
    method: "POST",
    body: JSON.stringify({ action: "delete", ids: [1] }),
  });
  const res = await POST(req);
  expect(res.status).toBe(500);
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/feedback-bulk.test.ts`
Expected: FAIL (route not found).

**Step 3: Write minimal implementation**

- Create `app/api/feedback/bulk/route.ts` with a discriminated union schema.
- Enforce permissions using `canUpdateFeedbackStatus`, `canEditFeedback`, `canDeleteFeedback`.
- Load existing rows for org + ids + not deleted.
- For status updates, insert status history rows with old/new status.
- For delete, set `deletedAt` and `updatedAt`.
- Return `{ updatedCount }`.

**Step 4: Update filter test (assignee removal)**

Update `tests/api/feedback-filter.test.ts` to remove `assignee` from the query and rename the test to "should accept hasVotes filters".

**Step 5: Run tests to verify they pass**

Run: `bun test tests/api/feedback-bulk.test.ts tests/api/feedback-filter.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add app/api/feedback/bulk/route.ts tests/api/feedback-bulk.test.ts tests/api/feedback-filter.test.ts
git commit -m "feat: add bulk feedback actions API"
```

### Task 6: Detail view i18n + pagination enhancements

**Files:**
- Modify: `components/feedback/feedback-detail-view.tsx`
- Modify: `components/shared/pagination.tsx`

**Step 1: Write the failing test**

Add a test for pagination controls showing jump input labels.

```ts
// tests/components/pagination.test.tsx
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { Pagination } from "@/components/shared/pagination";
import "../setup";

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

it("renders jump controls", () => {
  const { getByText } = render(
    <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
  );
  expect(getByText("feedback.pagination.jumpTo")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/pagination.test.tsx`
Expected: FAIL (pagination has no jump controls).

**Step 3: Write minimal implementation**

- Localize detail view labels and date formatting via `useTranslations` + `useLocale`.
- Update `Pagination` to include a small jump-to input + button, and localize labels.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/pagination.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/feedback/feedback-detail-view.tsx components/shared/pagination.tsx tests/components/pagination.test.tsx
git commit -m "feat: localize feedback detail view and enhance pagination"
```

### Task 7: Verification

**Files:**
- None

**Step 1: Run test suite**

Run: `bun test`
Expected: PASS (note existing domain lookup warnings are acceptable).

**Step 2: Manual smoke check**

Run: `bun dev` and verify `/admin/feedback` list selection, bulk actions, pagination, and detail view labels in all locales.

**Step 3: Commit (if needed)**

If any fixes were required after smoke testing:

```bash
git add .
git commit -m "fix: address admin feedback UX regressions"
```
