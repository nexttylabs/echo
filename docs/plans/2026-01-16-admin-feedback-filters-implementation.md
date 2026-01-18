# Admin Feedback Filters & Sorting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add URL-driven filters/sorting/pagination to /admin/feedback, including assignee/hasVotes/hasReplies, plus members API with client caching.

**Architecture:** Server-side query parameters drive list data. A new members endpoint provides assignee candidates. Frontend controls update URL, triggering fetches. Data remains in existing feedback API.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind v4, Bun, Drizzle ORM.

---

### Task 1: Add organization members list endpoint

**Files:**
- Create: `app/api/organizations/[orgId]/members/route.ts`
- Create: `app/api/organizations/[orgId]/members/handler.ts`
- Test: `tests/api/organization-members-list.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

describe("GET /api/organizations/[orgId]/members", () => {
  it("returns members with displayName", async () => {
    const mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          innerJoin: mock(() => ({
            where: mock(() => Promise.resolve([
              { userId: "user_1", displayName: "Ada" },
            ])),
          })),
        })),
      })),
    };

    mock.module("@/lib/auth/config", () => ({
      auth: { api: { getSession: mock(() => Promise.resolve({ user: { id: "user_1" } })) } },
    }));

    mock.module("@/lib/db", () => ({ db: mockDb }));

    const { GET } = await import("@/app/api/organizations/[orgId]/members/route");
    const req = new NextRequest("http://localhost:3000/api/organizations/org_1/members");
    const res = await GET(req, { params: Promise.resolve({ orgId: "org_1" }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0]).toHaveProperty("userId");
    expect(json.data[0]).toHaveProperty("displayName");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/organization-members-list.test.ts`
Expected: FAIL (module not found or handler missing)

**Step 3: Write minimal implementation**

```ts
// handler.ts
import { NextResponse } from "next/server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { organizationMembers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function buildListMembersHandler({ auth, db }: { auth: any; db: any }) {
  return async function GET(req: Request, context: { params: { orgId: string } | Promise<{ orgId: string }> }) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId } = await Promise.resolve(context.params);
    try {
      await assertOrganizationAccess(db, session.user.id, orgId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db
      .select({
        userId: organizationMembers.userId,
        displayName: user.name,
        email: user.email,
      })
      .from(organizationMembers)
      .innerJoin(user, eq(organizationMembers.userId, user.id))
      .where(eq(organizationMembers.organizationId, orgId));

    const data = rows.map((row: any) => ({
      userId: row.userId,
      displayName: row.displayName ?? row.email ?? "未知成员",
    }));

    return NextResponse.json({ data }, { status: 200 });
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/organization-members-list.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/organizations/[orgId]/members/route.ts app/api/organizations/[orgId]/members/handler.ts tests/api/organization-members-list.test.ts
git commit -m "feat: add organization members list endpoint"
```

---

### Task 2: Add query param parsing/serialization helpers

**Files:**
- Create: `lib/feedback/filters.ts`
- Test: `tests/feedback/filters.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { parseCsvParam, serializeCsvParam } from "@/lib/feedback/filters";

describe("filters helpers", () => {
  it("parses csv into array", () => {
    expect(parseCsvParam("a,b")).toEqual(["a", "b"]);
  });

  it("serializes array into csv", () => {
    expect(serializeCsvParam(["a", "b"])).toBe("a,b");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/feedback/filters.test.ts`
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

```ts
export function parseCsvParam(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeCsvParam(values: string[]) {
  return values.filter(Boolean).join(",");
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/feedback/filters.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/feedback/filters.ts tests/feedback/filters.test.ts
git commit -m "chore: add feedback filter helpers"
```

---

### Task 3: Add Feedback list controls UI (filters + sorting)

**Files:**
- Create: `components/feedback/feedback-list-controls.tsx`
- Modify: `components/feedback/feedback-list.tsx`
- Modify: `components/shared/pagination.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { FeedbackListControls } from "@/components/feedback/feedback-list-controls";

describe("FeedbackListControls", () => {
  it("renders filters and sort controls", () => {
    const { getByLabelText } = render(
      <FeedbackListControls
        organizationId="org_1"
        total={10}
        pageSize={20}
        onUpdate={() => {}}
      />
    );
    expect(getByLabelText("搜索反馈")).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: FAIL (component missing)

**Step 3: Write minimal implementation**

- Add controls for search, status/type/priority/assignee/hasVotes/hasReplies, and sort
- Read/write URL params via `useSearchParams` + `useRouter`
- Reset page to 1 on change
- Add cached assignee list loading
- Update `FeedbackList` to pass current params and render controls
- Add `aria-label` to pagination icon buttons and replace "..." with "…"

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback-list-controls.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/feedback/feedback-list-controls.tsx components/feedback/feedback-list.tsx components/shared/pagination.tsx
git commit -m "feat: add feedback list controls"
```

---

### Task 4: Extend /api/feedback filtering for new params

**Files:**
- Modify: `app/api/feedback/route.ts`
- Modify: `app/api/feedback/handler.ts`
- Test: `tests/api/feedback-filter.test.ts`

**Step 1: Write the failing test**

```ts
it("filters by assignee and hasVotes", async () => {
  const req = new NextRequest("http://localhost:3000/api/feedback?assignee=user_1&hasVotes=true&organizationId=org_1");
  const res = await GET(req);
  expect(res.status).toBe(200);
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/feedback-filter.test.ts`
Expected: FAIL (missing behavior)

**Step 3: Write minimal implementation**

- Parse CSV params for `status/type/priority/assignee/hasVotes/hasReplies`
- Apply `assignee` filter (includes `unassigned`)
- Apply `hasVotes` filter (`voteCount > 0` or `= 0`)
- Apply `hasReplies` filter (`replyCount > 0` or `= 0`)

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/feedback-filter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/feedback/route.ts app/api/feedback/handler.ts tests/api/feedback-filter.test.ts
git commit -m "feat: add feedback filters for assignee and replies"
```

---

### Task 5: Full verification

**Step 1: Run lint**

Run: `bun run lint`
Expected: 0 errors

**Step 2: Run relevant tests**

Run: `bun test tests/api/organization-members-list.test.ts tests/feedback/filters.test.ts tests/components/feedback-list-controls.test.tsx tests/api/feedback-filter.test.ts`
Expected: PASS

**Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: finalize feedback filters"
```
