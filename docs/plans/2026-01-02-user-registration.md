# User Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement user registration with Better Auth (email/password), create a profile + default organization, and provide a register UI.

**Architecture:** Better Auth owns auth tables and session cookies. Business data (profiles/organizations/members) lives in our own tables linked by userId. A custom `/api/auth/register` route validates input, calls `auth.api.signUpEmail`, then creates profile/org/member records.

**Tech Stack:** Next.js App Router, Better Auth, Drizzle ORM, Bun, Zod, Tailwind, shadcn/ui.

**Skills:** @superpowers:test-driven-development, @senior-frontend, @ui-styling

---

### Task 1: Bootstrap Better Auth + schema generation

**Files:**
- Modify: `package.json`
- Create: `lib/auth/config.ts`
- Create: `app/api/auth/[...all]/route.ts`
- Create (generated): `lib/db/schema/auth.ts`
- Modify: `lib/db/schema/index.ts`

**Step 1: Add dependencies**

Run:
```bash
bun add better-auth zod
```
Expected: deps added in `package.json` and lockfile.

**Step 2: Create Better Auth config**

Create `lib/auth/config.ts` (use relative imports so the Better Auth CLI can resolve modules):
```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";

if (!db) {
  throw new Error("DATABASE_URL is not configured");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()], // keep this last
});
```

**Step 3: Mount Better Auth handler**

Create `app/api/auth/[...all]/route.ts`:
```ts
import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**Step 4: Generate Better Auth Drizzle schema**

Run:
```bash
bunx @better-auth/cli@latest generate --config lib/auth/config.ts --output lib/db/schema/auth.ts
```
Expected: a new Drizzle schema file defining Better Auth tables.

**Step 5: Export schema for drizzle-kit**

Update `lib/db/schema/index.ts`:
```ts
export * from "./auth";
```

**Step 6: Generate migration (no apply yet)**

Run:
```bash
bun run db:generate
```
Expected: new SQL in `lib/db/migrations/`.

**Step 7: Commit**

```bash
git add package.json bun.lockb lib/auth/config.ts app/api/auth/[...all]/route.ts lib/db/schema/auth.ts lib/db/schema/index.ts lib/db/migrations
git commit -m "feat: add better-auth config and schema"
```

---

### Task 2: Business domain schemas + slug helper

**Files:**
- Create: `lib/db/schema/user-profiles.ts`
- Create: `lib/db/schema/organizations.ts`
- Create: `lib/db/schema/organization-members.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/utils/slug.ts`

**Step 1: Add schemas**

Create `lib/db/schema/user-profiles.ts` (adjust `user` import based on generated auth schema name):
```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth"; // update if generated export name differs

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

Create `lib/db/schema/organizations.ts`:
```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

Create `lib/db/schema/organization-members.ts`:
```ts
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { user } from "./auth"; // update if generated export name differs

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.organizationId, t.userId] }),
  })
);
```

Update `lib/db/schema/index.ts`:
```ts
export * from "./auth";
export * from "./user-profiles";
export * from "./organizations";
export * from "./organization-members";
```

Create `lib/utils/slug.ts`:
```ts
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
```

**Step 2: Generate migration**

Run:
```bash
bun run db:generate
```
Expected: migration adds business tables.

**Step 3: Commit**

```bash
git add lib/db/schema lib/utils/slug.ts lib/db/migrations
git commit -m "feat: add profile and organization schemas"
```

---

### Task 3: Registration API (TDD)

**Files:**
- Create: `lib/validations/auth.ts`
- Create: `app/api/auth/register/handler.ts`
- Create: `app/api/auth/register/route.ts`
- Test: `tests/api/register.test.ts`

**Step 1: Write failing tests**

Create `tests/api/register.test.ts`:
```ts
import { describe, it, expect } from "bun:test";
import { buildRegisterHandler } from "@/app/api/auth/register/handler";
import { APIError } from "better-auth/api";

const makeDeps = () => {
  const cookiesHeader = "session=token; Path=/; HttpOnly";

  const auth = {
    api: {
      signUpEmail: async () => ({
        headers: new Headers({ "set-cookie": cookiesHeader }),
        response: new Response(JSON.stringify({
          user: { id: "user_1", email: "john@example.com" },
        }))
      })
    }
  };

  const db = {
    transaction: async (fn: (tx: any) => Promise<void>) => fn({
      insert: () => ({ values: async () => {} })
    })
  };

  return { auth, db };
};

describe("POST /api/auth/register", () => {
  it("registers a user and sets cookie", async () => {
    const handler = buildRegisterHandler(makeDeps());
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "John", email: "john@example.com", password: "Password123" })
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.user.email).toBe("john@example.com");
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("returns 409 when email exists", async () => {
    const deps = makeDeps();
    deps.auth.api.signUpEmail = async () => {
      throw new APIError("Email exists", { status: 409 });
    };

    const handler = buildRegisterHandler(deps);
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "John", email: "john@example.com", password: "Password123" })
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.code).toBe("EMAIL_EXISTS");
  });

  it("validates email and password", async () => {
    const handler = buildRegisterHandler(makeDeps());
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "John", email: "bad-email", password: "weak" })
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun test tests/api/register.test.ts
```
Expected: FAIL because handler/validation do not exist.

**Step 3: Implement validation + handler**

Create `lib/validations/auth.ts`:
```ts
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "密码至少需要 8 个字符")
  .regex(/[A-Z]/, "密码必须包含大写字母")
  .regex(/[a-z]/, "密码必须包含小写字母")
  .regex(/[0-9!@#$%^&*]/, "密码必须包含数字或特殊字符");

export const registerSchema = z.object({
  name: z.string().min(1, "请输入您的姓名").max(100),
  email: z.string().email("请输入有效的邮箱地址").max(255).toLowerCase(),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

Create `app/api/auth/register/handler.ts`:
```ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { APIError } from "better-auth/api";
import { registerSchema } from "@/lib/validations/auth";
import { generateSlug } from "@/lib/utils/slug";
import { organizations, organizationMembers, userProfiles } from "@/lib/db/schema";

type RegisterDeps = {
  auth: { api: { signUpEmail: (args: any) => Promise<{ headers: Headers; response: Response }> } };
  db: { transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T> };
};

export function buildRegisterHandler(deps: RegisterDeps) {
  return async function POST(req: Request) {
    try {
      const body = await req.json();
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid request body",
            code: "VALIDATION_ERROR",
            details: parsed.error.issues,
          },
          { status: 400 }
        );
      }

      const { name, email, password } = parsed.data;

      const { headers, response } = await deps.auth.api.signUpEmail({
        returnHeaders: true,
        body: { name, email, password },
      });

      const authPayload = await response.json();
      const userId = authPayload?.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: "Registration failed", code: "REGISTRATION_FAILED" },
          { status: 500 }
        );
      }

      const orgName = `${name}'s Organization`;
      const orgSlug = generateSlug(orgName);

      const organizationId = randomUUID();

      await deps.db.transaction(async (tx) => {
        await tx.insert(userProfiles).values({ userId, name });
        await tx.insert(organizations).values({ id: organizationId, name: orgName, slug: orgSlug });
        await tx.insert(organizationMembers).values({ organizationId, userId, role: "admin" });
      });

      const res = NextResponse.json(
        {
          data: { user: authPayload.user },
          message: "Registration successful",
        },
        { status: 201 }
      );

      const setCookie = headers.get("set-cookie");
      if (setCookie) {
        res.headers.set("set-cookie", setCookie);
      }

      return res;
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 409) {
          return NextResponse.json(
            { error: "邮箱已存在", code: "EMAIL_EXISTS" },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: error.message, code: "AUTH_ERROR" },
          { status: error.status ?? 400 }
        );
      }

      return NextResponse.json(
        { error: "Registration failed", code: "REGISTRATION_FAILED" },
        { status: 500 }
      );
    }
  };
}
```

Create `app/api/auth/register/route.ts`:
```ts
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { buildRegisterHandler } from "./handler";

if (!db) {
  throw new Error("DATABASE_URL is not configured");
}

export const POST = buildRegisterHandler({ auth, db });
```

**Step 4: Run tests to verify pass**

Run:
```bash
bun test tests/api/register.test.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/validations/auth.ts app/api/auth/register/handler.ts app/api/auth/register/route.ts tests/api/register.test.ts
git commit -m "feat: add register api with validation"
```

---

### Task 4: Register UI

**Files:**
- Create: `app/(auth)/register/page.tsx`
- Create: `components/auth/register-form.tsx`

**Step 1: Implement UI**

Create `app/(auth)/register/page.tsx`:
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold">Echo</h1>
          <p className="text-sm text-muted-foreground">创建新账户以继续</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
```

Create `components/auth/register-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "请输入您的姓名";
    if (!formData.email) nextErrors.email = "请输入邮箱地址";
    if (!formData.password) nextErrors.password = "请输入密码";
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "两次输入的密码不一致";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.code === "VALIDATION_ERROR") {
          const fieldErrors: Record<string, string> = {};
          for (const issue of json.details ?? []) {
            const key = issue.path?.[0];
            if (key) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
        } else if (json.code === "EMAIL_EXISTS") {
          setErrors({ email: "邮箱已存在" });
        }
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建账户</CardTitle>
        <CardDescription>填写以下信息注册新账户</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} disabled={isLoading} />
            {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />
            {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "注册中..." : "注册"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            已有账户？<a className="text-primary" href="/login">登录</a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Manual verification**

Run:
```bash
bun dev
```
Check:
- `/register` renders correctly on mobile/desktop.
- Invalid inputs show inline errors.
- Successful submit redirects to `/dashboard`.

**Step 3: Commit**

```bash
git add app/(auth)/register/page.tsx components/auth/register-form.tsx
git commit -m "feat: add register page and form"
```

---

### Task 5: Migration apply + smoke check

**Files:**
- None (commands only)

**Step 1: Apply migrations locally**

Run:
```bash
bun run db:migrate
```
Expected: migrations applied successfully.

**Step 2: Smoke test**

Run:
```bash
bun test
```
Expected: all tests pass (existing warning-only lint is acceptable).

**Step 3: Commit (if any artifacts)**

Only if new migration metadata or files are created.
