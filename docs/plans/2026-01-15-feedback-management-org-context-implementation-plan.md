# Feedback Organization Context Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce organization-aware feedback management across all pages and APIs with a unified org context resolver and a dashboard-only org switcher.

**Architecture:** Add a server-side org context resolver that reads org ID from URL > header > cookie, validates membership, and is used by all feedback routes. Add a dashboard org switcher that writes org selection to cookie and URL.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Bun test, Next cookies/headers.

---

### Task 1: Add organization context resolver + tests

**Files:**
- Create: `lib/auth/org-context.ts`
- Create: `tests/lib/org-context.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getOrgContext } from "@/lib/auth/org-context";

const makeRequest = (options: {
  query?: Record<string, string>;
  headerOrgId?: string;
  cookieOrgId?: string;
}) => {
  const url = new URL("https://example.com");
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  return {
    nextUrl: url,
    headers: new Headers(
      options.headerOrgId ? { "x-organization-id": options.headerOrgId } : undefined,
    ),
    cookies: {
      get: (name: string) => (name === "orgId" && options.cookieOrgId ? { value: options.cookieOrgId } : undefined),
    },
  } as const;
};

const makeDb = (hasMember: boolean) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => (hasMember ? [{ role: "admin" }] : []),
      }),
    }),
  }),
});

describe("getOrgContext", () => {
  it("prefers query over header and cookie", async () => {
    const req = makeRequest({ query: { organizationId: "org_query" }, headerOrgId: "org_header", cookieOrgId: "org_cookie" });
    const context = await getOrgContext({ request: req, db: makeDb(true), userId: "user_1" });
    expect(context.organizationId).toBe("org_query");
    expect(context.source).toBe("query");
  });

  it("throws when membership missing", async () => {
    const req = makeRequest({ cookieOrgId: "org_cookie" });
    await expect(
      getOrgContext({ request: req, db: makeDb(false), userId: "user_1", requireMembership: true })
    ).rejects.toThrow("Access denied");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/org-context.test.ts`
Expected: FAIL with module not found or missing exports.

**Step 3: Write minimal implementation**

```ts
import { assertOrganizationAccess } from "@/lib/auth/organization";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type OrgContextSource = "query" | "header" | "cookie" | "explicit";

export type OrgContext = {
  organizationId: string;
  memberRole: string | null;
  source: OrgContextSource;
};

export async function getOrgContext(options: {
  request: { nextUrl: URL; headers: Headers; cookies?: { get: (name: string) => { value: string } | undefined } };
  db: Pick<Database, "select">;
  userId?: string | null;
  organizationId?: string | null;
  requireMembership?: boolean;
}): Promise<OrgContext> {
  const { request, db, userId, organizationId, requireMembership } = options;
  const queryOrgId = request.nextUrl.searchParams.get("organizationId");
  const headerOrgId = request.headers.get("x-organization-id");
  const cookieOrgId = request.cookies?.get("orgId")?.value ?? null;

  const resolved = organizationId || queryOrgId || headerOrgId || cookieOrgId;
  const source: OrgContextSource = organizationId
    ? "explicit"
    : queryOrgId
      ? "query"
      : headerOrgId
        ? "header"
        : "cookie";

  if (!resolved) {
    throw new Error("Missing organization");
  }

  let memberRole: string | null = null;
  if (userId) {
    const member = await assertOrganizationAccess(db, userId, resolved);
    memberRole = member.role;
  } else if (requireMembership) {
    throw new Error("Access denied");
  }

  return { organizationId: resolved, memberRole, source };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/org-context.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth/org-context.ts tests/lib/org-context.test.ts
git commit -m "feat: add org context resolver"
```

---

### Task 2: Add user organization list helper + tests

**Files:**
- Modify: `lib/auth/organization.ts`
- Create: `tests/lib/user-organizations.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getUserOrganizations } from "@/lib/auth/organization";

const makeDb = (rows: Array<{ id: string; name: string; slug: string; role: string }>) => ({
  select: () => ({
    from: () => ({
      innerJoin: () => ({
        where: async () => rows,
      }),
    }),
  }),
});

describe("getUserOrganizations", () => {
  it("returns organization list for user", async () => {
    const db = makeDb([{ id: "org_1", name: "Org", slug: "org", role: "admin" }]);
    const orgs = await getUserOrganizations(db as never, "user_1");
    expect(orgs).toHaveLength(1);
    expect(orgs[0].id).toBe("org_1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/user-organizations.test.ts`
Expected: FAIL with missing export.

**Step 3: Write minimal implementation**

```ts
export async function getUserOrganizations(
  db: Database,
  userId: string
): Promise<UserOrganization[]> {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/user-organizations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth/organization.ts tests/lib/user-organizations.test.ts
git commit -m "feat: add user organization list helper"
```

---

### Task 3: Add dashboard organization switcher (client component)

**Files:**
- Create: `components/dashboard/organization-switcher.tsx`
- Modify: `components/dashboard/index.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";

describe("OrganizationSwitcher", () => {
  it("is defined", () => {
    expect(OrganizationSwitcher).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/organization-switcher.test.ts`
Expected: FAIL (missing file).

**Step 3: Write minimal implementation**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrgOption = { id: string; name: string; slug: string; role: string };

type Props = {
  organizations: OrgOption[];
  currentOrgId: string;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function OrganizationSwitcher({ organizations, currentOrgId }: Props) {
  const [value, setValue] = useState(currentOrgId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (orgId: string) => {
    setValue(orgId);
    const params = new URLSearchParams(searchParams);
    params.set("organizationId", orgId);
    document.cookie = `orgId=${orgId};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};samesite=lax`;
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="选择组织" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/organization-switcher.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add components/dashboard/organization-switcher.tsx components/dashboard/index.ts tests/components/organization-switcher.test.ts
git commit -m "feat: add dashboard org switcher"
```

---

### Task 4: Wire org context into dashboard and feedback pages

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `app/(dashboard)/feedback/page.tsx`
- Modify: `app/admin/feedback/page.tsx`
- Modify: `app/admin/feedback/[id]/page.tsx`
- Modify: `app/admin/feedback/[id]/edit/page.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getOrgContext } from "@/lib/auth/org-context";

describe("dashboard org context", () => {
  it("uses cookie org when query missing", async () => {
    const request = {
      nextUrl: new URL("https://example.com/dashboard"),
      headers: new Headers(),
      cookies: { get: () => ({ value: "org_cookie" }) },
    } as const;
    const context = await getOrgContext({ request, db: { select: () => ({}) } as never, userId: null });
    expect(context.organizationId).toBe("org_cookie");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/org-context.test.ts`
Expected: FAIL until implementations are hooked in.

**Step 3: Write minimal implementation**

- In `app/(dashboard)/dashboard/page.tsx`, use `getUserOrganizations` to fetch org list and `getOrgContext` to resolve the active org.
- If no `orgId` cookie exists, default to the first org, set cookie, and use that for stats.
- Render `OrganizationSwitcher` (dashboard only) with org list and active org id.
- In `app/(dashboard)/feedback/page.tsx` and `app/admin/feedback/page.tsx`, remove hardcoded org id and resolve using `getOrgContext` with membership required.

**Step 4: Run tests to verify pass**

Run: `bun test tests/lib/org-context.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/page.tsx app/(dashboard)/feedback/page.tsx app/admin/feedback/page.tsx app/admin/feedback/[id]/page.tsx app/admin/feedback/[id]/edit/page.tsx
git commit -m "feat: use org context in dashboard and admin pages"
```

---

### Task 5: Enforce org context in feedback APIs (list and similar)

**Files:**
- Modify: `app/api/feedback/route.ts`
- Modify: `app/api/feedback/similar/route.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getOrgContext } from "@/lib/auth/org-context";

describe("feedback list API org enforcement", () => {
  it("throws when organization is missing", async () => {
    const request = { nextUrl: new URL("https://example.com/api/feedback"), headers: new Headers() } as const;
    await expect(getOrgContext({ request, db: { select: () => ({}) } as never, userId: "user" })).rejects.toThrow("Missing organization");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/org-context.test.ts`
Expected: FAIL until API uses resolver consistently.

**Step 3: Write minimal implementation**

- Replace manual `organizationId` resolution with `getOrgContext`.
- Require membership for authenticated routes.
- Use `context.organizationId` in feedback list and similar queries.

**Step 4: Run tests to verify pass**

Run: `bun test tests/lib/org-context.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/feedback/route.ts app/api/feedback/similar/route.ts
git commit -m "feat: enforce org context in feedback list APIs"
```

---

### Task 6: Enforce org context in feedback detail and child APIs

**Files:**
- Modify: `app/api/feedback/[id]/route.ts`
- Modify: `app/api/feedback/[id]/comments/route.ts`
- Modify: `app/api/feedback/[id]/vote/route.ts`
- Modify: `app/api/feedback/[id]/duplicates/route.ts`
- Modify: `app/api/feedback/[id]/suggest-tags/route.ts`
- Modify: `app/api/feedback/[id]/processing-status/route.ts`
- Modify: `app/api/feedback/[id]/reclassify/route.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getOrgContext } from "@/lib/auth/org-context";

describe("feedback detail API org enforcement", () => {
  it("throws when user is not a member", async () => {
    const request = { nextUrl: new URL("https://example.com/api/feedback/1"), headers: new Headers(), cookies: { get: () => ({ value: "org_1" }) } } as const;
    const db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }) };
    await expect(getOrgContext({ request, db: db as never, userId: "user", requireMembership: true })).rejects.toThrow("Access denied");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/org-context.test.ts`
Expected: FAIL until enforced.

**Step 3: Write minimal implementation**

- Resolve org context at the start of each route.
- For id-based operations, verify the feedback’s `organizationId` matches the resolved org before returning or mutating.
- If mismatch, return 404.

**Step 4: Run tests to verify pass**

Run: `bun test tests/lib/org-context.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/feedback/[id]/route.ts app/api/feedback/[id]/comments/route.ts app/api/feedback/[id]/vote/route.ts app/api/feedback/[id]/duplicates/route.ts app/api/feedback/[id]/suggest-tags/route.ts app/api/feedback/[id]/processing-status/route.ts app/api/feedback/[id]/reclassify/route.ts
git commit -m "feat: enforce org context in feedback detail APIs"
```

---

### Task 7: Update API v1 and public routes for org context consistency

**Files:**
- Modify: `app/api/v1/feedback/route.ts`
- Modify: `app/api/v1/feedback/[id]/route.ts`
- Modify: `app/[organizationSlug]/page.tsx`
- Modify: `app/[organizationSlug]/feedback/[id]/page.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getOrgContext } from "@/lib/auth/org-context";

describe("public portal org resolution", () => {
  it("accepts explicit organization id", async () => {
    const request = { nextUrl: new URL("https://example.com"), headers: new Headers() } as const;
    const context = await getOrgContext({ request, db: { select: () => ({}) } as never, organizationId: "org_explicit" });
    expect(context.organizationId).toBe("org_explicit");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/org-context.test.ts`
Expected: FAIL until explicit org support is used.

**Step 3: Write minimal implementation**

- Keep API v1 using API key org id, but pass the resolved org explicitly to the resolver (or bypass if not required).
- Ensure portal routes resolve org via slug and pass explicit org id to avoid cookie contamination.

**Step 4: Run tests to verify pass**

Run: `bun test tests/lib/org-context.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/v1/feedback/route.ts app/api/v1/feedback/[id]/route.ts app/[organizationSlug]/page.tsx app/[organizationSlug]/feedback/[id]/page.tsx
git commit -m "feat: align org context for v1 and portal routes"
```

---

### Task 8: Final verification and cleanup

**Files:**
- Modify: `docs/plans/2026-01-15-feedback-management-org-context-implementation-plan.md`

**Step 1: Run unit tests**

Run: `bun test tests/lib/org-context.test.ts tests/lib/user-organizations.test.ts`
Expected: PASS

**Step 2: Run lint (acknowledge baseline issues)**

Run: `bun run lint`
Expected: FAIL due to pre-existing lint errors in `tests/e2e/**`.

**Step 3: Commit**

```bash
git add docs/plans/2026-01-15-feedback-management-org-context-implementation-plan.md
git commit -m "chore: record verification steps"
```
