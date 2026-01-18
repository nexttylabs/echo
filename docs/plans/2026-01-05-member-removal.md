# Member Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow organization admins to remove members while preventing removal of the last admin or self-removal.

**Architecture:** Add a DELETE handler using the existing build*Handler pattern and Drizzle queries for role checks and deletion. Render a server-fetched members list in the org settings page, and use a client component with a confirmation dialog to call the DELETE API and update local state.

**Tech Stack:** Next.js App Router (RSC), TypeScript, Drizzle ORM, Bun test runner, shadcn/ui components.

### Task 1: Add member removal API (handler + route)

**Files:**
- Create: `app/api/organizations/[orgId]/members/[memberId]/handler.ts`
- Create: `app/api/organizations/[orgId]/members/[memberId]/route.ts`
- Test: `tests/api/organization-members.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "bun:test";
import { buildRemoveMemberHandler } from "@/app/api/organizations/[orgId]/members/[memberId]/handler";
import { organizationMembers } from "@/lib/db/schema";

// Tests:
// - 401 when unauthenticated
// - 403 when requester is not admin
// - 404 when target member not found
// - 400 when target is last admin (message: 组织至少需要一个管理员)
// - 400 when requester tries to remove self (message: 不能移除自己)
// - 200 on success and delete called
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/organization-members.test.ts`
Expected: FAIL with "buildRemoveMemberHandler is not defined" (or module not found).

**Step 3: Write minimal implementation**

```ts
export function buildRemoveMemberHandler(deps: RemoveMemberDeps) {
  return async function DELETE(req: Request, context: { params: { orgId: string; memberId: string } }) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orgId, memberId } = await Promise.resolve(context.params);

    if (memberId === session.user.id) {
      return NextResponse.json({ error: "不能移除自己" }, { status: 400 });
    }

    const [requester] = await deps.db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, session.user.id)))
      .limit(1);

    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [target] = await deps.db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, memberId)))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const [adminCount] = await deps.db
      .select({ count: count() })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.role, "admin")));

    if (target.role === "admin" && adminCount.count === 1) {
      return NextResponse.json({ error: "组织至少需要一个管理员" }, { status: 400 });
    }

    await deps.db
      .delete(organizationMembers)
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, memberId)));

    return NextResponse.json({ message: "成员已移除" }, { status: 200 });
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/organization-members.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/organizations/[orgId]/members/[memberId]/handler.ts app/api/organizations/[orgId]/members/[memberId]/route.ts tests/api/organization-members.test.ts
git commit -m "feat: add member removal API"
```

### Task 2: Render member list and removal UI

**Files:**
- Modify: `app/(dashboard)/settings/organizations/[orgId]/members/page.tsx`
- Create: `components/settings/organization-members-list.tsx`

**Step 1: Add a server-side members query**

```ts
const members = db
  ? await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        name: user.name,
        email: user.email,
      })
      .from(organizationMembers)
      .leftJoin(user, eq(user.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, params.orgId))
  : [];
```

**Step 2: Implement client list with removal**

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">移除</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>确认移除？</AlertDialogTitle>
    <AlertDialogAction onClick={() => removeMember(member.userId)}>确认</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

**Step 3: Disable remove for self**

```ts
const isSelf = member.userId === currentUserId;
<Button disabled={isSelf}>移除</Button>
```

**Step 4: Run UI smoke check**

Run: `bun dev`
Expected: Members page shows list, remove button opens confirmation, success removes row from UI.

**Step 5: Commit**

```bash
git add app/(dashboard)/settings/organizations/[orgId]/members/page.tsx components/settings/organization-members-list.tsx
git commit -m "feat: render members list with removal UI"
```

### Task 3: Edge cases + validation

**Files:**
- Modify: `tests/api/organization-members.test.ts`

**Step 1: Add edge-case tests (self-removal + missing member)**

```ts
it("rejects removing self", async () => {
  // expect 400 "不能移除自己"
});

it("returns 404 when target member missing", async () => {
  // expect 404
});
```

**Step 2: Run test suite**

Run: `bun test tests/api/organization-members.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/api/organization-members.test.ts
git commit -m "test: cover member removal edge cases"
```
