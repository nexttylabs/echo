# Authentication Middleware Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add session-aware auth guarding in Next.js middleware so `/dashboard` and `/feedback` require login while `/login`, `/register`, `/invite/*`, and `/api/auth/*` stay public, without breaking existing request-id/logging behavior.

**Architecture:** Keep the current global middleware (for `x-request-id` and request logging) and add a protected-route check inside it. Implement a small `getServerSession` helper that wraps `better-auth`’s `auth.api.getSession({ headers })` so middleware can request session data from `NextRequest` headers. Only protected routes trigger session checks; public routes pass through.

**Tech Stack:** Next.js App Router middleware, TypeScript, better-auth, Bun test runner.

### Task 1: Add middleware auth behavior tests (failing first)

**Files:**
- Modify: `middleware.test.ts`

**Step 1: Write the failing tests**

Add tests that cover:
- Protected route unauthenticated → redirect to `/login`
- Public route unauthenticated → allowed
- Protected route authenticated → allowed

```ts
import { describe, it, expect, mock } from "bun:test";
import { NextRequest } from "next/server";

mock.module("@/lib/auth/session", () => ({
  getServerSession: async (req: NextRequest) => {
    const isAuthed = req.headers.get("x-test-auth") === "1";
    return isAuthed ? { user: { id: "u_test" } } : null;
  },
}));

const { middleware } = await import("./middleware");

describe("middleware auth", () => {
  it("redirects unauthenticated users from protected routes", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    const res = await middleware(req);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("allows unauthenticated users on public routes", async () => {
    const req = new NextRequest("http://localhost/login");
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows authenticated users on protected routes", async () => {
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { "x-test-auth": "1" },
    });
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test middleware.test.ts`
Expected: FAIL because middleware does not yet enforce auth redirect.

**Step 3: Commit**

```bash
git add middleware.test.ts
git commit -m "test: cover auth redirect behavior in middleware"
```

### Task 2: Implement getServerSession helper

**Files:**
- Create: `lib/auth/session.ts`

**Step 1: Write the failing test (optional if skipping unit test)**

If adding a unit test, create `tests/auth/session.test.ts` verifying `getServerSession` returns `null` when no session is found. Otherwise, proceed to implementation and rely on middleware tests.

**Step 2: Run test to verify it fails**

Run (if test added): `bun test tests/auth/session.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

```ts
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

export async function getServerSession(req: NextRequest) {
  return auth.api.getSession({ headers: req.headers });
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/auth/session.test.ts`
Expected: PASS (if test added).

**Step 5: Commit**

```bash
git add lib/auth/session.ts tests/auth/session.test.ts
git commit -m "feat: add getServerSession helper for middleware"
```

### Task 3: Enforce authentication in middleware

**Files:**
- Modify: `middleware.ts`

**Step 1: Write the failing test (already in Task 1)**

Use the tests from Task 1; they should still be failing.

**Step 2: Run test to verify it fails**

Run: `bun test middleware.test.ts`
Expected: FAIL because `/dashboard` is not redirected yet.

**Step 3: Write minimal implementation**

Update middleware to:
- Define `publicRoutes` and `protectedRoutes` lists
- Skip session check for public routes
- For protected routes, call `getServerSession(req)` and redirect if falsy
- Preserve existing `x-request-id` and logging behavior

```ts
import { NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/middleware/request-id";
import { logRequest, logResponse } from "@/lib/middleware/request-logger";
import { getServerSession } from "@/lib/auth/session";

const publicRoutes = ["/login", "/register", "/invite", "/invite/", "/api/auth"];
const protectedRoutes = ["/dashboard", "/feedback"];

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(route));
}

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const reqId = req.headers.get("x-request-id") || generateRequestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", reqId);

  logRequest(new Request(req.url, { method: req.method, headers: requestHeaders }));

  const pathname = req.nextUrl.pathname;
  const isPublic = isRouteMatch(pathname, publicRoutes);
  const isProtected = isRouteMatch(pathname, protectedRoutes);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isProtected && !isPublic) {
    const session = await getServerSession(req);
    if (!session) {
      response = NextResponse.redirect(new URL("/login", req.url));
    }
  }

  response.headers.set("x-request-id", reqId);
  const duration = Date.now() - startTime;
  logResponse(reqId, response.status, duration);

  return response;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test middleware.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add middleware.ts
git commit -m "feat: enforce auth on protected routes in middleware"
```

### Task 4: Full validation

**Files:**
- None

**Step 1: Run lint and tests**

Run: `bun run lint`
Expected: PASS

Run: `bun test`
Expected: PASS

**Step 2: Commit (if any fixes were made)**

```bash
git add .
git commit -m "chore: fix lint/test issues"
```
