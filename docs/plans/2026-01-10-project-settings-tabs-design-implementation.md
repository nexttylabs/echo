# Project Settings Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure project settings into three top-level tabs (通用设置 / Widget / Portal) and embed the Portal overview flow within the Portal tab.

**Architecture:** Convert the project settings UI into a tabbed layout using the existing shadcn Tabs component. Extract the Portal overview into a reusable component so it can be rendered both inside the Portal tab and the dedicated Portal route pages.

**Tech Stack:** Next.js App Router, React 19, TypeScript, shadcn/ui (Tabs, Card, Button, Badge, Switch), Tailwind CSS.

### Task 1: Add a reusable Portal overview component

**Files:**
- Create: `components/portal/portal-overview.tsx`
- Modify: `app/(dashboard)/settings/projects/[projectSlug]/portal/page.tsx`
- Test: `tests/components/portal-overview.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { PortalOverview } from "@/components/portal/portal-overview";

describe("PortalOverview", () => {
  it("exports a component", () => {
    expect(typeof PortalOverview).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/portal-overview.test.tsx`
Expected: FAIL with "Cannot find module '@/components/portal/portal-overview'"

**Step 3: Write minimal implementation**

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalModulesPanel } from "@/components/portal/portal-modules-panel";
import { getDefaultPortalModules } from "@/lib/portal/modules";
import type { PortalConfig } from "@/lib/db/schema/projects";

export function PortalOverview({
  projectSlug,
  portalLink,
  portalConfig,
  projectId,
}: {
  projectSlug: string;
  portalLink: string;
  portalConfig: PortalConfig | null;
  projectId: string;
}) {
  const portalEnabled = portalConfig?.sharing?.enabled ?? true;
  const themeSummary = portalConfig?.theme?.primaryColor
    ? `主色 ${portalConfig.theme.primaryColor}`
    : "使用默认主题";
  const languageSummary = portalConfig?.defaultLanguage ?? "zh-CN";
  const seoSummary = portalConfig?.seo?.metaTitle
    ? portalConfig.seo.metaTitle
    : "未设置 SEO 标题";

  const modules = portalConfig?.modules ?? getDefaultPortalModules();

  return (
    <div className="space-y-8">
      <Card className="border-slate-200/80 bg-white/80 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Portal 状态</CardTitle>
            <CardDescription>当前项目的门户入口与可见性</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={portalEnabled ? "default" : "outline"}>
              {portalEnabled ? "公开中" : "已关闭"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href={portalLink}>预览 Portal</a>
            </Button>
            <Button asChild size="sm">
              <a href={portalLink}>打开 Portal</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600">
            门户链接：<span className="font-medium text-slate-900">{portalLink}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <PortalGroupCard
          title="体验"
          description="主题、文案与语言"
          items={[
            themeSummary,
            portalConfig?.copy?.title ? `标题：${portalConfig.copy.title}` : "未设置门户标题",
            `默认语言：${languageSummary}`,
          ]}
          href={`/settings/projects/${projectSlug}/portal/experience`}
        />
        <PortalGroupCard
          title="传播"
          description="分享与 SEO 配置"
          items={[
            seoSummary,
            portalConfig?.sharing?.socialSharing ? "社交分享已配置" : "未配置社交分享",
            portalConfig?.seo?.ogImage ? "已设置 OG 图片" : "未设置 OG 图片",
          ]}
          href={`/settings/projects/${projectSlug}/portal/growth`}
        />
        <PortalGroupCard
          title="可见性"
          description="公开权限与索引"
          items={[
            portalEnabled ? "门户公开" : "门户关闭",
            portalConfig?.sharing?.allowPublicVoting ? "允许公开投票" : "关闭公开投票",
            portalConfig?.seo?.noIndex ? "禁止索引" : "允许索引",
          ]}
          href={`/settings/projects/${projectSlug}/portal/access`}
        />
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              模块开关
            </span>
            管理 Portal 模块显示
          </span>
        </summary>
        <div className="mt-4">
          <PortalModulesPanel projectId={projectId} initialModules={modules} />
        </div>
      </details>
    </div>
  );
}

function PortalGroupCard({
  title,
  description,
  items,
  href,
}: {
  title: string;
  description: string;
  items: string[];
  href: string;
}) {
  return (
    <Card className="border-slate-200/80 bg-white/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <Button asChild variant="outline" size="sm">
          <a href={href}>进入设置</a>
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/portal-overview.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/portal/portal-overview.tsx app/(dashboard)/settings/projects/[projectSlug]/portal/page.tsx tests/components/portal-overview.test.tsx
git commit -m "feat: extract portal overview component"
```

### Task 2: Add tabs to project settings (通用设置 / Widget / Portal)

**Files:**
- Modify: `components/project/project-settings.tsx`
- Modify: `app/(dashboard)/settings/projects/[projectSlug]/page.tsx`
- Test: `tests/components/project-settings-tabs.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { ProjectSettings } from "@/components/project/project-settings";

describe("ProjectSettings tabs", () => {
  it("exports a component", () => {
    expect(typeof ProjectSettings).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/project-settings-tabs.test.tsx`
Expected: PASS (component exists) — update test to check for tabs labels after implementation

**Step 3: Write minimal implementation**

- Use `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `components/ui/tabs.tsx`
- Create three tabs: 通用设置 / Widget / Portal
- Move existing Widget form + preview into Widget tab
- Move Portal entry into Portal tab and render `PortalOverview` component
- Keep “危险区域” inside 通用设置 tab

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/project-settings-tabs.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/project/project-settings.tsx app/(dashboard)/settings/projects/[projectSlug]/page.tsx tests/components/project-settings-tabs.test.tsx
git commit -m "feat: add project settings tabs"
```

### Task 3: Wire Portal tab to new overview and subpages

**Files:**
- Modify: `components/project/project-settings.tsx`
- Modify: `app/(dashboard)/settings/projects/[projectSlug]/portal/page.tsx`
- Test: `tests/app/project-portal-overview.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { PortalOverview } from "@/components/portal/portal-overview";

describe("Portal overview routing", () => {
  it("exports a component", () => {
    expect(typeof PortalOverview).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/app/project-portal-overview.test.tsx`
Expected: PASS

**Step 3: Write minimal implementation**

- Replace inline overview markup in portal overview page with `PortalOverview`
- Use same component in Portal tab content

**Step 4: Run test to verify it passes**

Run: `bun test tests/app/project-portal-overview.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/project/project-settings.tsx app/(dashboard)/settings/projects/[projectSlug]/portal/page.tsx tests/app/project-portal-overview.test.tsx
git commit -m "feat: embed portal overview in project settings"
```

### Task 4: Verification

**Files:**
- None

**Step 1: Run lint**

Run: `bun run lint`
Expected: PASS with existing warnings only

**Step 2: Manual check**

- Visit `/settings/projects/[projectSlug]` and verify tabs and content
- Visit `/settings/projects/[projectSlug]/portal` and verify overview + module toggle
- Verify Portal subpages still accessible

**Step 3: Commit (if needed)**

```bash
git status -sb
```
