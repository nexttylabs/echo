# User Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a login page and form that authenticate via better-auth email/password, support “remember me” (30-day session), and redirect logged-in users to `/dashboard`.

**Architecture:** Use better-auth built-in `/api/auth/sign-in/email` endpoint and `auth.api.getSession` for server-side redirect. Client form validates input with a shared Zod schema and submits JSON to the auth endpoint. Session duration is configured in `lib/auth/config.ts`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind, better-auth, Zod, Bun.

---

### Task 1: Add login validation schema (TDD)

**Files:**
- Modify: `lib/validations/auth.ts`
- Create: `tests/lib/login-schema.test.ts`

**Step 1: Write the failing test**

`tests/lib/login-schema.test.ts`
```ts
import { describe, expect, it } from "bun:test";
import { loginSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("rejects empty email and password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("请输入邮箱地址");
      expect(messages).toContain("请输入密码");
    }
  });

  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "Password123" });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/login-schema.test.ts`
Expected: FAIL because `loginSchema` is not defined.

**Step 3: Write minimal implementation**

`lib/validations/auth.ts`
```ts
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址")
    .max(255)
    .toLowerCase(),
  password: z.string().min(1, "请输入密码"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/login-schema.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/validations/auth.ts tests/lib/login-schema.test.ts
git commit -m "test: add login schema validation"
```

---

### Task 2: Configure session expiry for remember-me

**Files:**
- Modify: `lib/auth/config.ts`

**Step 1: Write the failing test**

Create a simple configuration expectation test.

`tests/lib/auth-config.test.ts`
```ts
import { describe, expect, it } from "bun:test";
import { auth } from "@/lib/auth/config";

describe("auth session config", () => {
  it("uses 30-day session expiry", () => {
    expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 30);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/auth-config.test.ts`
Expected: FAIL because `expiresIn` is undefined.

**Step 3: Write minimal implementation**

`lib/auth/config.ts`
```ts
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/auth-config.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/auth/config.ts tests/lib/auth-config.test.ts
git commit -m "feat: set remember-me session duration"
```

---

### Task 3: Create login page (server component)

**Files:**
- Create: `app/(auth)/login/page.tsx`

**Step 1: Write the failing test**

Create a basic render test to ensure the page uses the LoginForm component.

`tests/app/login-page.test.ts`
```ts
import { describe, expect, it } from "bun:test";
import LoginPage from "@/app/(auth)/login/page";

// This is a shallow check for export existence.
// Actual redirect behavior is validated manually.

describe("LoginPage", () => {
  it("is a function", () => {
    expect(typeof LoginPage).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/app/login-page.test.ts`
Expected: FAIL because the file does not exist.

**Step 3: Write minimal implementation**

`app/(auth)/login/page.tsx`
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/config";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Echo
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            登录以继续访问你的反馈和组织
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/app/login-page.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add app/(auth)/login/page.tsx tests/app/login-page.test.ts
git commit -m "feat: add login page"
```

---

### Task 4: Create login form (client component)

**Files:**
- Create: `components/auth/login-form.tsx`

**Step 1: Write the failing test**

Test validation behavior and error messaging without a DOM by using the shared schema.

`tests/components/login-form-validation.test.ts`
```ts
import { describe, expect, it } from "bun:test";
import { loginSchema } from "@/lib/validations/auth";

describe("LoginForm validation", () => {
  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ email: "invalid", password: "pass" });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/login-form-validation.test.ts`
Expected: FAIL because login form/schema not yet wired (schema exists but test file missing).

**Step 3: Write minimal implementation**

`components/auth/login-form.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path?.[0];
      if (typeof key === "string") {
        nextErrors[key] = issue.message;
      }
    }
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message ?? "邮箱或密码错误");
      }

      router.push("/dashboard");
    } catch {
      setFormError("邮箱或密码错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>输入邮箱和密码登录</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, rememberMe: checked === true }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal">
                记住我
              </Label>
            </div>
            <a className="text-sm text-primary hover:underline" href="/forgot-password">
              忘记密码？
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "登录中..." : "登录"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            还没有账户？
            <a className="ml-1 text-primary hover:underline" href="/register">
              注册
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/login-form-validation.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/auth/login-form.tsx tests/components/login-form-validation.test.ts
git commit -m "feat: add login form"
```

---

### Task 5: Full verification

**Step 1: Run lint**

Run: `bun run lint`
Expected: PASS.

**Step 2: Run full test suite**

Run: `bun test`
Expected: PASS.

**Step 3: Commit (if any changes)**

```bash
git add -A
git commit -m "chore: verify login flow"
```
