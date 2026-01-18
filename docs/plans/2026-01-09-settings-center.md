# Settings Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all settings into a unified Settings Center accessible from user dropdown menu.

**Architecture:** 
- Remove settings links from main navigation, add user dropdown menu with Settings/Logout
- Create `/settings` layout with left sidebar navigation and right content area
- Reuse existing notification preferences component, create new profile/appearance pages

**Tech Stack:** Next.js App Router, Radix UI DropdownMenu, Tailwind CSS

---

## Task 1: Simplify Sidebar Navigation

**Files:**
- Modify: `components/layout/sidebar.tsx`

**Step 1: Remove settings-related nav items from navigation**

Replace lines 55-63 with:

```tsx
  const navItems = [
    { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
    { href: "/feedback", label: "反馈管理", icon: MessageSquare },
  ];
```

Remove `adminNavItems` array entirely and its rendering (lines 61-63 and 110-124).

**Step 2: Run build to verify no errors**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "refactor: remove settings links from main navigation"
```

---

## Task 2: Add User Dropdown Menu to Sidebar

**Files:**
- Modify: `components/layout/sidebar.tsx`

**Step 1: Add dropdown menu imports**

Add to imports:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp } from "lucide-react";
```

**Step 2: Replace user profile section (lines 165-191)**

Replace the entire `{/* User Profile */}` section with:

```tsx
      {/* User Profile Dropdown */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings" onClick={handleLinkClick}>
                <Settings className="mr-2 h-4 w-4" />
                设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
```

**Step 3: Remove unused imports**

Remove `Badge` and `Building2` from imports (no longer used).

**Step 4: Remove unused code**

Remove `roleLabels` object and `isAdmin` variable if no longer used.

**Step 5: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat: add user dropdown menu with settings and logout"
```

---

## Task 3: Create Settings Layout with Sidebar

**Files:**
- Create: `app/(dashboard)/settings/layout.tsx`
- Create: `components/settings/settings-sidebar.tsx`
- Create: `components/settings/index.ts`

**Step 1: Create settings sidebar component**

Create `components/settings/settings-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Bell, Palette, Building2, Key } from "lucide-react";
import type { UserRole } from "@/lib/auth/permissions";

interface SettingsSidebarProps {
  userRole: UserRole;
}

export function SettingsSidebar({ userRole }: SettingsSidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "admin";
  const isAdminOrPM = isAdmin || userRole === "product_manager";

  const menuItems = [
    { href: "/settings/profile", label: "个人资料", icon: User },
    { href: "/settings/notifications", label: "通知设置", icon: Bell },
    { href: "/settings/appearance", label: "外观设置", icon: Palette },
  ];

  const adminItems = [
    { href: "/settings/organization", label: "组织管理", icon: Building2, show: isAdmin },
    { href: "/settings/api-keys", label: "API 密钥", icon: Key, show: isAdminOrPM },
  ];

  return (
    <nav className="w-56 shrink-0 border-r bg-muted/30 p-4">
      <h2 className="mb-4 px-2 text-lg font-semibold">设置</h2>
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
              pathname === item.href && "bg-muted font-medium"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        {adminItems.filter(item => item.show).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
              pathname === item.href && "bg-muted font-medium"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**Step 2: Create settings index export**

Create `components/settings/index.ts`:

```ts
export { SettingsSidebar } from "./settings-sidebar";
```

**Step 3: Create settings layout**

Create `app/(dashboard)/settings/layout.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { SettingsSidebar } from "@/components/settings";
import type { UserRole } from "@/lib/auth/permissions";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role as UserRole || "customer";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SettingsSidebar userRole={userRole} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Step 4: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/settings/settings-sidebar.tsx components/settings/index.ts app/\(dashboard\)/settings/layout.tsx
git commit -m "feat: add settings layout with sidebar navigation"
```

---

## Task 4: Create Settings Root Page (Redirect)

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`

**Step 1: Create redirect page**

Create `app/(dashboard)/settings/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/profile");
}
```

**Step 2: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/\(dashboard\)/settings/page.tsx
git commit -m "feat: add settings root page with redirect to profile"
```

---

## Task 5: Create Profile Settings Page

**Files:**
- Create: `app/(dashboard)/settings/profile/page.tsx`
- Create: `components/settings/profile-form.tsx`

**Step 1: Create profile form component**

Create `components/settings/profile-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement profile update API
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>管理您的账户信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" disabled>
                更换头像
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="您的姓名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存更改"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>更新您的登录密码</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            修改密码
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">密码修改功能即将推出</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create profile page**

Create `app/(dashboard)/settings/profile/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata = {
  title: "个人资料 - Echo",
};

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">个人资料</h1>
        <p className="text-muted-foreground">管理您的账户信息和偏好设置</p>
      </div>
      <ProfileForm user={session.user} />
    </div>
  );
}
```

**Step 3: Update settings index export**

Update `components/settings/index.ts`:

```ts
export { SettingsSidebar } from "./settings-sidebar";
export { ProfileForm } from "./profile-form";
```

**Step 4: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/settings/profile-form.tsx components/settings/index.ts app/\(dashboard\)/settings/profile/page.tsx
git commit -m "feat: add profile settings page"
```

---

## Task 6: Update Notifications Page to Use New Layout

**Files:**
- Modify: `app/(dashboard)/settings/notifications/page.tsx`

**Step 1: Update notifications page**

Replace `app/(dashboard)/settings/notifications/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { NotificationPreferences } from "@/components/settings/notification-preferences";

export const metadata = {
  title: "通知设置 - Echo",
};

export default async function NotificationSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">通知设置</h1>
        <p className="text-muted-foreground">选择您希望接收的通知类型</p>
      </div>
      <NotificationPreferences />
    </div>
  );
}
```

**Step 2: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/\(dashboard\)/settings/notifications/page.tsx
git commit -m "refactor: update notifications page to use settings layout"
```

---

## Task 7: Create Appearance Settings Page

**Files:**
- Create: `app/(dashboard)/settings/appearance/page.tsx`
- Create: `components/settings/appearance-form.tsx`

**Step 1: Create appearance form component**

Create `components/settings/appearance-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function AppearanceForm() {
  const [theme, setTheme] = useState<Theme>("system");

  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "跟随系统", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>外观设置</CardTitle>
        <CardDescription>自定义应用的显示风格</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label>主题</Label>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-muted",
                  theme === t.value ? "border-primary" : "border-transparent"
                )}
              >
                <t.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            主题切换功能即将推出
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create appearance page**

Create `app/(dashboard)/settings/appearance/page.tsx`:

```tsx
import { AppearanceForm } from "@/components/settings/appearance-form";

export const metadata = {
  title: "外观设置 - Echo",
};

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">外观设置</h1>
        <p className="text-muted-foreground">自定义应用的显示风格</p>
      </div>
      <AppearanceForm />
    </div>
  );
}
```

**Step 3: Update settings index export**

Update `components/settings/index.ts`:

```ts
export { SettingsSidebar } from "./settings-sidebar";
export { ProfileForm } from "./profile-form";
export { AppearanceForm } from "./appearance-form";
```

**Step 4: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/settings/appearance-form.tsx components/settings/index.ts app/\(dashboard\)/settings/appearance/page.tsx
git commit -m "feat: add appearance settings page"
```

---

## Task 8: Create Organization Settings Page

**Files:**
- Create: `app/(dashboard)/settings/organization/page.tsx`

**Step 1: Create organization settings page**

Create `app/(dashboard)/settings/organization/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth/organization";
import { OrganizationForm } from "@/components/settings/organization-form";
import { OrganizationMembersList } from "@/components/settings/organization-members-list";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import type { UserRole } from "@/lib/auth/permissions";

export const metadata = {
  title: "组织管理 - Echo",
};

export default async function OrganizationSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role as UserRole || "customer";

  if (userRole !== "admin") {
    redirect("/settings/profile");
  }

  let organization = null;
  if (db) {
    organization = await getUserOrganization(db, session.user.id);
  }

  if (!organization) {
    redirect("/settings/organizations/new");
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">组织管理</h1>
        <p className="text-muted-foreground">管理您的组织信息和成员</p>
      </div>

      <OrganizationForm
        organizationId={organization.id}
        initialName={organization.name}
        initialSlug={organization.slug}
      />

      <InviteMemberForm organizationId={organization.id} />

      <OrganizationMembersList organizationId={organization.id} />
    </div>
  );
}
```

**Step 2: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/\(dashboard\)/settings/organization/page.tsx
git commit -m "feat: add organization settings page"
```

---

## Task 9: Create API Keys Settings Page

**Files:**
- Create: `app/(dashboard)/settings/api-keys/page.tsx`
- Create: `components/settings/api-keys-list.tsx`

**Step 1: Create API keys list component**

Create `components/settings/api-keys-list.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Trash2, Plus } from "lucide-react";

interface ApiKey {
  keyId: string;
  name: string;
  prefix: string;
  displayKey: string;
  createdAt: string;
  lastUsed: string | null;
}

export function ApiKeysList() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`新密钥已创建: ${data.data.key}\n\n请立即保存此密钥，它将不会再次显示。`);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("确定要删除此 API 密钥吗？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/api-keys/${keyId}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>创建新密钥</CardTitle>
          <CardDescription>创建新的 API 密钥用于外部集成</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyName" className="sr-only">密钥名称</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="输入密钥名称"
              />
            </div>
            <Button type="submit" disabled={isCreating || !newKeyName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              创建密钥
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已有密钥</CardTitle>
          <CardDescription>管理您的 API 密钥</CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-muted-foreground py-4">暂无 API 密钥</p>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div key={key.keyId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{key.displayKey}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(key.prefix)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(key.keyId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create API keys page**

Create `app/(dashboard)/settings/api-keys/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ApiKeysList } from "@/components/settings/api-keys-list";
import type { UserRole } from "@/lib/auth/permissions";

export const metadata = {
  title: "API 密钥 - Echo",
};

export default async function ApiKeysSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role as UserRole || "customer";

  if (userRole !== "admin" && userRole !== "product_manager") {
    redirect("/settings/profile");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">API 密钥</h1>
        <p className="text-muted-foreground">管理您的 API 访问密钥</p>
      </div>
      <ApiKeysList />
    </div>
  );
}
```

**Step 3: Update settings index export**

Update `components/settings/index.ts`:

```ts
export { SettingsSidebar } from "./settings-sidebar";
export { ProfileForm } from "./profile-form";
export { AppearanceForm } from "./appearance-form";
export { ApiKeysList } from "./api-keys-list";
```

**Step 4: Run build to verify**

Run: `bun run build 2>&1 | tail -10`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add components/settings/api-keys-list.tsx components/settings/index.ts app/\(dashboard\)/settings/api-keys/page.tsx
git commit -m "feat: add API keys settings page"
```

---

## Task 10: Final Verification and Cleanup

**Step 1: Run full build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 2: Run linting**

Run: `bun run lint`
Expected: No errors (warnings acceptable)

**Step 3: Test manually**

1. Start dev server: `bun dev`
2. Login as admin user
3. Verify user dropdown appears in sidebar
4. Click "设置" → redirects to /settings/profile
5. Verify left sidebar shows all menu items
6. Navigate through each settings page
7. Verify non-admin users cannot access organization/api-keys pages

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: cleanup and final adjustments"
```
