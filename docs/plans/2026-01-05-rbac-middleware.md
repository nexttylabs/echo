# RBAC Middleware Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable RBAC middleware helper that enforces permission checks using the existing session and permission system.

**Architecture:** Implement `requirePermission(permission, req)` in `lib/middleware/rbac.ts` to read the session via `getServerSession(req)`, validate `session.user.role`, and return JSON error responses (401/403) or `NextResponse.next()` on success. Add focused Bun tests in `middleware.test.ts` using the existing session mock.

**Tech Stack:** Next.js (App Router), TypeScript, Bun test runner, `next/server`.

### Task 1: RBAC helper tests

**Files:**
- Modify: `middleware.test.ts:1-120`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, mock } from "bun:test";
import { NextRequest } from "next/server";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/middleware/rbac";

mock.module("@/lib/auth/session", () => ({
  getServerSession: async (req: NextRequest) => {
    const isAuthed = req.headers.get("x-test-auth") === "1";
    if (!isAuthed) return null;
    const role = req.headers.get("x-test-role");
    return role ? { user: { id: "u_test", role } } : { user: { id: "u_test" } };
  },
}));

describe("rbac requirePermission", () => {
  it("returns 401 when session is missing", async () => {
    const req = new NextRequest("http://localhost/api/secure");
    const res = await requirePermission(PERMISSIONS.CREATE_FEEDBACK, req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when role is missing", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1" },
    });
    const res = await requirePermission(PERMISSIONS.CREATE_FEEDBACK, req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when role lacks permission", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1", "x-test-role": "customer" },
    });
    const res = await requirePermission(PERMISSIONS.MANAGE_ORG, req);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns NextResponse.next when permission is allowed", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1", "x-test-role": "admin" },
    });
    const res = await requirePermission(PERMISSIONS.MANAGE_ORG, req);
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test middleware.test.ts`
Expected: FAIL with "Cannot find module '@/lib/middleware/rbac'" or failing 401/403 assertions before implementation.

**Step 3: Write minimal implementation**

```typescript
// lib/middleware/rbac.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

export async function requirePermission(
  permission: Permission,
  req: NextRequest
): Promise<NextResponse> {
  const session = await getServerSession(req);
  const role = session?.user?.role;

  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}
```

**Step 4: Run test to verify it passes**

Run: `bun test middleware.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add middleware.test.ts lib/middleware/rbac.ts
git commit -m "feat: add rbac permission middleware helper"
```
