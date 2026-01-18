# Resource Ownership Check Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable organization membership check and apply it to existing org-scoped APIs to ensure cross-org data isolation.

**Architecture:** Create a small `assertOrganizationAccess` helper that checks membership via `organizationMembers` and throws on failure. Update org-scoped handlers to use the helper and keep their existing admin-role enforcement logic.

**Tech Stack:** Next.js App Router, TypeScript, Bun, Drizzle ORM

### Task 1: Add organization access helper + tests

**Files:**
- Create: `lib/auth/organization.ts`
- Create: `tests/lib/organization-access.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "bun:test";
import { assertOrganizationAccess } from "@/lib/auth/organization";

const makeDb = (member: { role: string } | null) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => (member ? [member] : []),
      }),
    }),
  }),
});

describe("assertOrganizationAccess", () => {
  it("returns member when user belongs to organization", async () => {
    const db = makeDb({ role: "admin" });
    const member = await assertOrganizationAccess(db, "user_1", "org_1");
    expect(member.role).toBe("admin");
  });

  it("throws when user is not a member", async () => {
    const db = makeDb(null);
    await expect(
      assertOrganizationAccess(db, "user_1", "org_1"),
    ).rejects.toThrow("Access denied");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/organization-access.test.ts`
Expected: FAIL with module not found or missing export.

**Step 3: Write minimal implementation**

```typescript
import { and, eq } from "drizzle-orm";
import { organizationMembers } from "@/lib/db/schema";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type AccessDb = {
  select: Database["select"];
};

export async function assertOrganizationAccess(
  db: AccessDb,
  userId: string,
  organizationId: string,
) {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new Error("Access denied");
  }

  return member;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/organization-access.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth/organization.ts tests/lib/organization-access.test.ts
git commit -m "feat: add organization access helper"
```

### Task 2: Apply helper to organization invitations handler

**Files:**
- Modify: `app/api/organizations/[orgId]/invitations/handler.ts`
- Modify: `tests/api/organization-invitations.test.ts`

**Step 1: Write the failing test**

Add a test:

```typescript
it("rejects non-members", async () => {
  const deps = makeDepsWithRole(null);
  const handler = buildCreateInvitationHandler(deps);
  const res = await handler(
    new Request("http://localhost/api/organizations/org_1/invitations", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", role: "member" }),
    }),
    { params: { orgId: "org_1" } },
  );
  expect(res.status).toBe(403);
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/organization-invitations.test.ts`
Expected: FAIL due to missing helper logic or thrown error not handled.

**Step 3: Write minimal implementation**

- Import `assertOrganizationAccess`
- Replace inline member query with:

```typescript
let member;
try {
  member = await assertOrganizationAccess(deps.db, session.user.id, orgId);
} catch {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- Keep existing admin check: `if (member.role !== "admin") return 403`

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/organization-invitations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/organizations/[orgId]/invitations/handler.ts tests/api/organization-invitations.test.ts
git commit -m "feat: enforce organization membership on invitations"
```

### Task 3: Apply helper to organization members handler

**Files:**
- Modify: `app/api/organizations/[orgId]/members/[memberId]/handler.ts`
- Modify: `tests/api/organization-members.test.ts`

**Step 1: Write the failing tests**

Add tests for non-members:

```typescript
it("rejects non-members", async () => {
  const deps = makeDeps({ requesterRole: null });
  const handler = buildRemoveMemberHandler(deps);
  const res = await handler(
    new Request("http://localhost/api/organizations/org_1/members/user_2", {
      method: "DELETE",
    }),
    { params: { orgId: "org_1", memberId: "user_2" } },
  );
  expect(res.status).toBe(403);
});
```

```typescript
it("rejects non-members", async () => {
  const deps = makeUpdateDeps({ requesterRole: null });
  const handler = buildUpdateMemberRoleHandler(deps);
  const res = await handler(
    new Request("http://localhost/api/organizations/org_1/members/user_2", {
      method: "PUT",
      body: JSON.stringify({ role: "developer" }),
    }),
    { params: { orgId: "org_1", memberId: "user_2" } },
  );
  expect(res.status).toBe(403);
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/api/organization-members.test.ts`
Expected: FAIL due to missing helper logic or thrown error not handled.

**Step 3: Write minimal implementation**

- Import `assertOrganizationAccess`
- Replace requester lookup with:

```typescript
let requester;
try {
  requester = await assertOrganizationAccess(deps.db, session.user.id, orgId);
} catch {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- Keep existing admin checks unchanged.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/api/organization-members.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/organizations/[orgId]/members/[memberId]/handler.ts tests/api/organization-members.test.ts
git commit -m "feat: enforce organization membership on member actions"
```
