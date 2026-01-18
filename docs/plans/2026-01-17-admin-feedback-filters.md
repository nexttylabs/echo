# Admin Feedback Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve `/admin/feedback` filtering clarity with a visible summary bar, AND-logic explanation, and simplified sort options (time, votes), while preserving URL-driven filters.

**Architecture:** Keep `FeedbackList` client-driven and URL-based. `FeedbackListControls` owns filter UI state, URL updates, and summary rendering. Sorting uses existing `sortBy/sortOrder` parameters. All UI strings remain in `messages/*.json` via `next-intl`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Bun test.

---

### Task 0: Restore lint baseline (per user approval, no tests)

**Files:**
- Modify: `components/feedback/feedback-detail-view.tsx:116`
- Modify: `components/shared/pagination.tsx:55`

**Step 1: Fix JSX parse error in detail view**

```tsx
<div className="flex items-start gap-4">
  <Button
    variant="ghost"
    size="icon"
    onClick={handleBack}
    aria-label={t("detail.backToList")}
    className="shrink-0 mt-1"
  >
    <ArrowLeft className="w-5 h-5" />
  </Button>
  <div className="flex-1">
    ...
  </div>
</div>
```

**Step 2: Fix prefer-const and unused index**

```tsx
const startPage = Math.max(2, currentPage - Math.floor((maxVisible - 2) / 2));
const endPage = Math.min(totalPages - 1, startPage + maxVisible - 3);
...
{pageNumbers.map((page) => (
  ...
))}
```

**Step 3: Run lint to confirm baseline repaired**

Run: `bun run lint`
Expected: no parsing errors; warnings acceptable only if unrelated.

---

### Task 1: Add tests for filter summary and debounce behavior

**Files:**
- Modify: `tests/components/feedback-list-controls.test.tsx`

**Step 1: Write failing tests**

```tsx
it("shows selected filters summary and clear-all", async () => {
  const searchParams = new URLSearchParams(
    "status=new,planned&type=bug&priority=high"
  );
  // mock useSearchParams to return searchParams
  // render and assert chips + logic hint + clear button
});

it("debounces search input before pushing URL", async () => {
  // render, change input, assert push not called immediately,
  // await 350ms, assert push called once
});
```

**Step 2: Run test to verify failure**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: FAIL due to missing summary bar + debounce behavior.

---

### Task 2: Implement summary bar and debounce in controls

**Files:**
- Modify: `components/feedback/feedback-list-controls.tsx`

**Step 1: Implement minimal code changes**

```tsx
const [searchInput, setSearchInput] = useState(query);
useEffect(() => setSearchInput(query), [query]);
useEffect(() => {
  const timeout = setTimeout(() => {
    if (searchInput !== query) {
      updateParams({ query: searchInput || null });
    }
  }, 300);
  return () => clearTimeout(timeout);
}, [searchInput, query]);

const filterGroups = [
  { key: "status", label: t("filters.statusLabel"), values: status, formatter: ... },
  { key: "type", label: t("filters.typeLabel"), values: type, formatter: ... },
  { key: "priority", label: t("filters.priorityLabel"), values: priority, formatter: ... },
  { key: "hasVotes", label: t("list.hasVotes"), values: hasVotes, formatter: ... },
  { key: "hasReplies", label: t("list.hasReplies"), values: hasReplies, formatter: ... },
].filter(group => group.values.length > 0);
```

**Step 2: Update summary UI**

```tsx
<div className="flex flex-wrap items-center gap-2 overflow-x-auto">
  {filterGroups.length === 0 ? (
    <span className="text-xs text-muted-foreground">{t("list.filtersEmpty")}</span>
  ) : (
    filterGroups.map((group, groupIndex) => (
      <div key={group.key} className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{group.label} {group.values.length}</span>
        {group.values.map(value => (
          <Button ... onClick={() => toggleValue(group.key, value)}>...</Button>
        ))}
        {groupIndex < filterGroups.length - 1 && (
          <span className="text-xs text-muted-foreground">AND</span>
        )}
      </div>
    ))
  )}
  <span className="text-xs text-muted-foreground">{t("filters.logicHint")}</span>
  <Button variant="ghost" size="sm" onClick={clearAll}>{t("filters.clearAll")}</Button>
</div>
```

**Step 3: Simplify sort options**

```tsx
const SORT_OPTIONS = [
  { value: "createdAt:desc", label: t("list.sortNewest") },
  { value: "createdAt:asc", label: t("list.sortOldest") },
  { value: "voteCount:desc", label: t("list.sortMostVotes") },
  { value: "voteCount:asc", label: t("list.sortFewestVotes") },
] as const;
```

**Step 4: Run test to verify pass**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: PASS

---

### Task 3: Update translations

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/jp.json`

**Step 1: Add keys**

```json
"filters": {
  ...,
  "logicHint": "Within a group: match any • Across groups: match all"
},
"list": {
  ...,
  "sortNewest": "Newest",
  "sortOldest": "Oldest",
  "sortMostVotes": "Most votes",
  "sortFewestVotes": "Fewest votes"
}
```

**Step 2: Verify app compiles**

Run: `bun run lint`
Expected: no errors.

---

### Task 4: Update controls tests for new labels

**Files:**
- Modify: `tests/components/feedback-list-controls.test.tsx`

**Step 1: Adjust translation mock**

```tsx
if (key === "filters.logicHint") return "Within a group: match any • Across groups: match all";
if (key === "list.sortNewest") return "Newest";
...
```

**Step 2: Run test suite**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: PASS

---

### Task 5: Final verification

**Files:**
- None

**Step 1: Run lint**

Run: `bun run lint`
Expected: PASS (0 errors).

