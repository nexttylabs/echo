# Role Configuration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow organization admins to update a member's role via API + UI with validation and immediate permission effect.

**Architecture:** Add a role schema for org members, implement a PUT handler on the existing members API route with admin/last-admin checks, and add a role selector UI in the members list that calls the API and updates local state.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Zod, Bun test

### Task 1: Add organization member role schema

**Files:**
- Modify: `lib/validations/organizations.ts`
- Create: `tests/lib/organization-member-role-schema.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { organizationMemberRoleSchema } from "@/lib/validations/organizations";

describe("organizationMemberRoleSchema", () => {
  it("accepts known organization roles", () => {
    expect(organizationMemberRoleSchema.safeParse("admin").success).toBe(true);
    expect(organizationMemberRoleSchema.safeParse("product_manager").success).toBe(true);
    expect(organizationMemberRoleSchema.safeParse("developer").success).toBe(true);
    expect(organizationMemberRoleSchema.safeParse("customer_support").success).toBe(true);
  });

  it("rejects non-organization roles", () => {
    expect(organizationMemberRoleSchema.safeParse("customer").success).toBe(false);
    expect(organizationMemberRoleSchema.safeParse("member").success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/organization-member-role-schema.test.ts`
Expected: FAIL with "organizationMemberRoleSchema is not exported"

**Step 3: Write minimal implementation**

```ts
export const organizationMemberRoleSchema = z.enum([
  "admin",
  "product_manager",
  "developer",
  "customer_support",
]);

export type OrganizationMemberRoleInput = z.infer<typeof organizationMemberRoleSchema>;
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/organization-member-role-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/validations/organizations.ts tests/lib/organization-member-role-schema.test.ts
git commit -m "test: add organization member role schema tests"
```

### Task 2: Add PUT role update handler + API tests

**Files:**
- Modify: `app/api/organizations/[orgId]/members/[memberId]/handler.ts`
- Modify: `app/api/organizations/[orgId]/members/[memberId]/route.ts`
- Modify: `tests/api/organization-members.test.ts`

**Step 1: Write the failing tests**

```ts
import { buildUpdateMemberRoleHandler } from "@/app/api/organizations/[orgId]/members/[memberId]/handler";

// ...keep existing helpers; add a new helper for update deps

type UpdateReturn = {
  set: () => {
    where: () => {
      returning: () => Promise<Array<{ userId: string; role: string }>>;
    };
  };
};

const makeUpdateDeps = (options: DepsOptions & { updateResultRole?: string }) => {
  const base = makeDeps(options);
  const updateRole = options.updateResultRole ?? "developer";

  const update = () => ({
    set: () => ({
      where: () => ({
        returning: async () => [{ userId: "user_2", role: updateRole }],
      }),
    }),
  });

  base.db.update = update as unknown as () => UpdateReturn;
  return base;
};

describe("PUT /api/organizations/:orgId/members/:memberId", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeUpdateDeps({});
    deps.auth.api.getSession = async () => null;
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(401);
  });

  it("rejects non-admin members", async () => {
    const deps = makeUpdateDeps({ requesterRole: "member" });
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

  it("returns 400 for invalid role", async () => {
    const deps = makeUpdateDeps({});
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "guest" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when target member missing", async () => {
    const deps = makeUpdateDeps({ targetRole: null });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    expect(res.status).toBe(404);
  });

  it("blocks demoting the last admin", async () => {
    const deps = makeUpdateDeps({ targetRole: "admin", adminCount: 1 });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "developer" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("组织至少需要一个管理员");
  });

  it("updates role when allowed", async () => {
    const deps = makeUpdateDeps({ targetRole: "developer", adminCount: 2, updateResultRole: "product_manager" });
    const handler = buildUpdateMemberRoleHandler(deps);
    const res = await handler(
      new Request("http://localhost/api/organizations/org_1/members/user_2", {
        method: "PUT",
        body: JSON.stringify({ role: "product_manager" }),
      }),
      { params: { orgId: "org_1", memberId: "user_2" } },
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.role).toBe("product_manager");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/organization-members.test.ts`
Expected: FAIL with "buildUpdateMemberRoleHandler is not exported"

**Step 3: Write minimal implementation**

```ts
import { z } from "zod";
import { organizationMemberRoleSchema } from "@/lib/validations/organizations";

const updateRoleSchema = z.object({
  role: organizationMemberRoleSchema,
});

export function buildUpdateMemberRoleHandler(deps: RemoveMemberDeps) {
  return async function PUT(req: Request, context: RemoveMemberContext) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { role } = parsed.data;
    const { orgId, memberId } = await Promise.resolve(context.params);

    const [requester] = await deps.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!requester || requester.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [target] = await deps.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      )
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const [adminCount] = await deps.db
      .select({ count: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.role, "admin"),
        ),
      );

    if (target.role === "admin" && role !== "admin" && adminCount.count === 1) {
      return NextResponse.json(
        { error: "组织至少需要一个管理员" },
        { status: 400 },
      );
    }

    const [updated] = await deps.db
      .update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, memberId),
        ),
      )
      .returning();

    return NextResponse.json({ data: updated }, { status: 200 });
  };
}
```

Update the route to export PUT:

```ts
export const PUT = buildUpdateMemberRoleHandler({ auth, db });
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/organization-members.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/organizations/[orgId]/members/[memberId]/handler.ts app/api/organizations/[orgId]/members/[memberId]/route.ts tests/api/organization-members.test.ts
git commit -m "feat: add member role update API"
```

### Task 3: Add role selector UI

**Files:**
- Create: `components/settings/role-selector.tsx`
- Modify: `components/settings/organization-members-list.tsx`
- Create: `tests/components/role-selector.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { ROLE_OPTIONS } from "@/components/settings/role-selector";

describe("ROLE_OPTIONS", () => {
  it("includes all organization roles", () => {
    const roles = ROLE_OPTIONS.map((option) => option.value);
    expect(roles).toEqual([
      "admin",
      "product_manager",
      "developer",
      "customer_support",
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/role-selector.test.ts`
Expected: FAIL with "ROLE_OPTIONS is not exported"

**Step 3: Write minimal implementation**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ROLE_OPTIONS = [
  { value: "admin", label: "管理员" },
  { value: "product_manager", label: "产品经理" },
  { value: "developer", label: "开发者" },
  { value: "customer_support", label: "客服" },
] as const;

type RoleSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue placeholder="选择角色" />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

Update `OrganizationMembersList` to use the selector and PUT handler:

```tsx
const currentUserRole = members.find((member) => member.userId === currentUserId)?.role ?? null;
const canManageRoles = currentUserRole === "admin";

const handleRoleChange = async (memberId: string, nextRole: string) => {
  setError(null);
  setPendingMemberId(memberId);

  const res = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: nextRole }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    setError(json?.error ?? "更新角色失败，请稍后重试");
    setPendingMemberId(null);
    return;
  }

  setMembers((prev) =>
    prev.map((member) =>
      member.userId === memberId ? { ...member, role: nextRole } : member,
    ),
  );
  setPendingMemberId(null);
};
```

Replace the role Badge in the list with `RoleSelector`, disabling it when `!canManageRoles || isPending`.

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/role-selector.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add components/settings/role-selector.tsx components/settings/organization-members-list.tsx tests/components/role-selector.test.ts
git commit -m "feat: add role selector for organization members"
```

### Task 4: Full test pass

**Files:**
- N/A

**Step 1: Run full test suite**

Run: `bun test`
Expected: PASS

**Step 2: Commit (if needed)**

```bash
git status
# Commit any remaining changes if necessary
```
