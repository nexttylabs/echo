# Organization Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow an authenticated admin to create a new organization via an API endpoint and a UI form, with unique slug generation and creator assigned as org admin.

**Architecture:** Add a dedicated API handler + route under `app/api/organizations/` that validates input, generates a unique slug, creates the organization and membership in a transaction, and returns a 201 response. Add a client-side form component rendered on a new dashboard route that posts to the API and redirects to the organization dashboard on success.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Zod, Bun test runner, Tailwind CSS + shadcn/ui.

### Task 1: Organization creation API + tests

**Files:**
- Create: `app/api/organizations/handler.ts`
- Create: `app/api/organizations/route.ts`
- Create: `lib/validations/organizations.ts`
- Create: `tests/api/organizations.test.ts`

**Step 1: Write the failing API tests**

```ts
import { describe, it, expect } from "bun:test";
import { buildCreateOrganizationHandler } from "@/app/api/organizations/handler";

type FakeDeps = Parameters<typeof buildCreateOrganizationHandler>[0];

const makeDeps = () => {
  const auth: FakeDeps["auth"] = {
    api: {
      getSession: async () => ({ user: { id: "user_1" } }),
    },
  };

  const db: FakeDeps["db"] = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
    transaction: async (fn) =>
      fn({
        insert: () => ({ values: () => ({ returning: async () => [{ id: "org_1", slug: "acme-1234" }] }) }),
      }),
  };

  return { auth, db } satisfies FakeDeps;
};

describe("POST /api/organizations", () => {
  it("rejects unauthenticated requests", async () => {
    const deps = makeDeps();
    deps.auth.api.getSession = async () => null;
    const handler = buildCreateOrganizationHandler(deps);
    const res = await handler(new Request("http://localhost/api/organizations", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("creates organization and admin membership", async () => {
    const handler = buildCreateOrganizationHandler(makeDeps());
    const res = await handler(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        body: JSON.stringify({ name: "Acme", description: "Test" }),
      }),
    );
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.slug).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/organizations.test.ts`
Expected: FAIL with "module not found" or "buildCreateOrganizationHandler is not a function"

**Step 3: Implement validation + handler**

```ts
// lib/validations/organizations.ts
import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
```

```ts
// app/api/organizations/handler.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { createOrganizationSchema } from "@/lib/validations/organizations";
import { organizations, organizationMembers } from "@/lib/db/schema";
import { generateSlug } from "@/lib/utils/slug";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type CreateOrganizationDeps = {
  auth: { api: { getSession: (args: { headers: Headers }) => Promise<{ user: { id: string } } | null> } };
  db: {
    select: Database["select"];
    transaction: Database["transaction"];
  };
};

export function buildCreateOrganizationHandler(deps: CreateOrganizationDeps) {
  return async function POST(req: Request) {
    const session = await deps.auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = createOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { name, description } = parsed.data;

    let slug = generateSlug(name);
    let counter = 0;
    while (true) {
      const existing = await deps
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!existing.length) break;
      counter += 1;
      slug = `${generateSlug(name)}-${counter}`;
    }

    const organizationId = randomUUID();

    const [org] = await deps.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(organizations)
        .values({ id: organizationId, name, slug })
        .returning();
      await tx.insert(organizationMembers).values({
        organizationId,
        userId: session.user.id,
        role: "admin",
      });
      return [created];
    });

    return NextResponse.json({ data: { ...org, description } }, { status: 201 });
  };
}
```

**Step 4: Wire the route to handler**

```ts
// app/api/organizations/route.ts
import { buildCreateOrganizationHandler } from "./handler";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = buildCreateOrganizationHandler({ auth, db });
```

**Step 5: Run test to verify it passes**

Run: `bun test tests/api/organizations.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add app/api/organizations lib/validations/organizations.ts tests/api/organizations.test.ts
git commit -m "feat: add organization creation api"
```

### Task 2: Organization creation UI + tests

**Files:**
- Create: `components/settings/organization-form.tsx`
- Create: `app/(dashboard)/settings/organizations/new/page.tsx`
- Create: `tests/components/organization-form.test.ts`

**Step 1: Write a minimal failing component test**

```ts
import { describe, expect, it } from "bun:test";
import { OrganizationForm } from "@/components/settings/organization-form";

describe("OrganizationForm", () => {
  it("is a function", () => {
    expect(typeof OrganizationForm).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/organization-form.test.ts`
Expected: FAIL with "module not found"

**Step 3: Implement the form component**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OrganizationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "创建失败，请稍后重试");
      setIsLoading(false);
      return;
    }

    router.push(`/dashboard/organizations/${json.data.slug}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建新组织</CardTitle>
        <CardDescription>用于管理多个项目或团队</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">组织名称</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !formData.name}>
            {isLoading ? "创建中..." : "创建"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Add the page**

```tsx
import { OrganizationForm } from "@/components/settings/organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            创建组织
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            为新的团队或项目创建独立空间
          </p>
        </div>
        <OrganizationForm />
      </div>
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `bun test tests/components/organization-form.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add app/\(dashboard\)/settings/organizations/new/page.tsx components/settings/organization-form.tsx tests/components/organization-form.test.ts
git commit -m "feat: add organization creation form"
```

### Task 3: Risk checks and validation pass

**Files:**
- Modify: `tests/api/organizations.test.ts` (if needed for slug collision case)

**Step 1: Add slug collision test**

```ts
it("retries slug generation when collision occurs", async () => {
  const deps = makeDeps();
  const handler = buildCreateOrganizationHandler(deps);
  const res = await handler(
    new Request("http://localhost/api/organizations", {
      method: "POST",
      body: JSON.stringify({ name: "Acme" }),
    }),
  );
  expect(res.status).toBe(201);
});
```

**Step 2: Run targeted tests**

Run: `bun test tests/api/organizations.test.ts`
Expected: PASS

**Step 3: Run lint for sanity**

Run: `bun run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add tests/api/organizations.test.ts
git commit -m "test: cover organization slug collisions"
```
