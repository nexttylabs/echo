# Roles and Permissions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal RBAC module with a `customer` role and keep user schema and validation aligned with the role model.

**Architecture:** Implement a pure RBAC helper module in `lib/auth/permissions.ts`, update Drizzle `user` table schema to include a `role` column with default `customer`, and add a Zod role schema in `lib/validations/auth.ts`. Cover behavior with focused bun tests.

**Tech Stack:** Next.js, TypeScript, Bun test runner, Drizzle ORM, Zod.

### Task 1: Permissions tests

**Files:**
- Create: `tests/lib/permissions.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "bun:test";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  canSubmitOnBehalf,
} from "@/lib/auth/permissions";

describe("permissions", () => {
  it("maps roles to expected permissions", () => {
    expect(ROLE_PERMISSIONS.admin).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
        PERMISSIONS.DELETE_FEEDBACK,
        PERMISSIONS.MANAGE_ORG,
      ]),
    );

    expect(ROLE_PERMISSIONS.product_manager).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
        PERMISSIONS.DELETE_FEEDBACK,
      ]),
    );

    expect(ROLE_PERMISSIONS.developer).toEqual(
      expect.arrayContaining([PERMISSIONS.CREATE_FEEDBACK]),
    );

    expect(ROLE_PERMISSIONS.customer_support).toEqual(
      expect.arrayContaining([
        PERMISSIONS.CREATE_FEEDBACK,
        PERMISSIONS.SUBMIT_ON_BEHALF,
      ]),
    );

    expect(ROLE_PERMISSIONS.customer).toEqual(
      expect.arrayContaining([PERMISSIONS.CREATE_FEEDBACK]),
    );
  });

  it("checks permissions by role", () => {
    expect(hasPermission("admin", PERMISSIONS.MANAGE_ORG)).toBe(true);
    expect(hasPermission("developer", PERMISSIONS.DELETE_FEEDBACK)).toBe(false);
    expect(hasPermission("customer", PERMISSIONS.CREATE_FEEDBACK)).toBe(true);
  });

  it("checks submit-on-behalf permission", () => {
    expect(canSubmitOnBehalf("customer_support")).toBe(true);
    expect(canSubmitOnBehalf("customer")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/permissions.test.ts`
Expected: FAIL because `@/lib/auth/permissions` does not exist.

**Step 3: Commit**

```bash
git add tests/lib/permissions.test.ts
git commit -m "test: add permissions coverage"
```

### Task 2: Implement permissions module

**Files:**
- Create: `lib/auth/permissions.ts`

**Step 1: Write minimal implementation**

```typescript
export type UserRole =
  | "admin"
  | "product_manager"
  | "developer"
  | "customer_support"
  | "customer";

export const PERMISSIONS = {
  CREATE_FEEDBACK: "create_feedback",
  SUBMIT_ON_BEHALF: "submit_on_behalf",
  DELETE_FEEDBACK: "delete_feedback",
  MANAGE_ORG: "manage_org",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
    PERMISSIONS.DELETE_FEEDBACK,
    PERMISSIONS.MANAGE_ORG,
  ],
  product_manager: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
    PERMISSIONS.DELETE_FEEDBACK,
  ],
  developer: [PERMISSIONS.CREATE_FEEDBACK],
  customer_support: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
  ],
  customer: [PERMISSIONS.CREATE_FEEDBACK],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canSubmitOnBehalf(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.SUBMIT_ON_BEHALF);
}
```

**Step 2: Run test to verify it passes**

Run: `bun test tests/lib/permissions.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/auth/permissions.ts
git commit -m "feat: add rbac permissions module"
```

### Task 3: Role validation

**Files:**
- Create: `tests/lib/user-role-schema.test.ts`
- Modify: `lib/validations/auth.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "bun:test";
import { userRoleSchema } from "@/lib/validations/auth";

describe("userRoleSchema", () => {
  it("accepts known roles", () => {
    expect(userRoleSchema.safeParse("customer").success).toBe(true);
    expect(userRoleSchema.safeParse("admin").success).toBe(true);
    expect(userRoleSchema.safeParse("product_manager").success).toBe(true);
    expect(userRoleSchema.safeParse("developer").success).toBe(true);
    expect(userRoleSchema.safeParse("customer_support").success).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(userRoleSchema.safeParse("guest").success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/user-role-schema.test.ts`
Expected: FAIL because `userRoleSchema` is missing.

**Step 3: Write minimal implementation**

```typescript
import { z } from "zod";

export const userRoleSchema = z.enum([
  "admin",
  "product_manager",
  "developer",
  "customer_support",
  "customer",
]);

export type UserRoleInput = z.infer<typeof userRoleSchema>;
```

(Add the above to `lib/validations/auth.ts` while keeping existing schemas.)

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/user-role-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/lib/user-role-schema.test.ts lib/validations/auth.ts
git commit -m "feat: add user role validation"
```

### Task 4: User schema role column

**Files:**
- Create: `tests/lib/user-schema.test.ts`
- Modify: `lib/db/schema/auth.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "bun:test";
import { user } from "@/lib/db/schema";

describe("user schema", () => {
  it("includes role column", () => {
    expect(user.role).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/user-schema.test.ts`
Expected: FAIL because `user.role` is undefined.

**Step 3: Write minimal implementation**

```typescript
role: text("role").notNull().default("customer"),
```

(Add to `lib/db/schema/auth.ts` in the `user` table definition.)

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/user-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/lib/user-schema.test.ts lib/db/schema/auth.ts
git commit -m "feat: add user role column"
```

---

**Plan complete and saved to `docs/plans/2026-01-03-roles-permissions.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
