# Permission Check Hook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add client-side permission hooks (`useCan`, `useHasPermission`) for UI conditional rendering.

**Architecture:** Create a Better Auth React client wrapper in `lib/auth/client.ts`. Implement hooks in `hooks/use-permissions.ts` that read the current session role via `authClient.useSession()` and reuse permission helpers from `lib/auth/permissions.ts`. Add a small permission helper for “全部满足” logic and test it with Bun’s test runner.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Better Auth, Bun, Bun Test

### Task 1: Add permission helper for “全部满足”

**Files:**
- Modify: `lib/auth/permissions.ts`
- Test: `tests/lib/permissions.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { PERMISSIONS, hasAllPermissions } from "@/lib/auth/permissions";

it("checks multiple permissions (all-of)", () => {
  expect(
    hasAllPermissions("admin", [
      PERMISSIONS.CREATE_FEEDBACK,
      PERMISSIONS.MANAGE_ORG,
    ]),
  ).toBe(true);

  expect(
    hasAllPermissions("developer", [
      PERMISSIONS.CREATE_FEEDBACK,
      PERMISSIONS.DELETE_FEEDBACK,
    ]),
  ).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/permissions.test.ts`
Expected: FAIL with “hasAllPermissions is not defined” (or similar)

**Step 3: Write minimal implementation**

```ts
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/permissions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/auth/permissions.ts tests/lib/permissions.test.ts
git commit -m "feat: add all-of permission helper"
```

### Task 2: Add Better Auth client wrapper

**Files:**
- Create: `lib/auth/client.ts`

**Step 1: Add client wrapper**

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

**Step 2: Run lint to ensure type safety**

Run: `bun run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/auth/client.ts
git commit -m "feat: add better-auth client wrapper"
```

### Task 3: Implement permission hooks

**Files:**
- Create: `hooks/use-permissions.ts`

**Step 1: Implement hooks**

```ts
"use client";

import { authClient } from "@/lib/auth/client";
import {
  hasAllPermissions,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

export function useCan(permission: Permission): boolean {
  const { data: session } = authClient.useSession();
  const role = session?.user?.role;
  return role ? hasPermission(role, permission) : false;
}

export function useHasPermission(permissions: Permission | Permission[]): boolean {
  const { data: session } = authClient.useSession();
  const role = session?.user?.role;
  if (!role) return false;

  const list = Array.isArray(permissions) ? permissions : [permissions];
  return hasAllPermissions(role, list);
}
```

**Step 2: Run lint to ensure no TS/RSC issues**

Run: `bun run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add hooks/use-permissions.ts
git commit -m "feat: add permission hooks"
```

### Task 4: Final verification

**Files:**
- No new files

**Step 1: Run lint and targeted tests**

Run: `bun test tests/lib/permissions.test.ts`
Expected: PASS

Run: `bun run lint`
Expected: PASS

**Step 2: Commit (if needed)**

```bash
git status -sb
```
