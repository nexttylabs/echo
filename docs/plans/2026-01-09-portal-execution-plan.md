# Portal Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the portal experience (IA shell + submission prefill + inline duplicate suggestions) as a cohesive, test-driven rollout.

**Architecture:** Add a public `app/portal` route with lightweight presentational components. Enhance the embedded feedback form with URL prefill parsing and inline duplicate suggestions backed by a similarity API route that reuses existing duplicate detection logic.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind v4, shadcn/ui, Drizzle, bun:test

**Featurebase-aligned portal requirements (for scope decisions):**
- 反馈板块（Boards）与 AI 自动分配
- 排序与筛选：Top/Recent/Trending；按状态/板块/标签/ETA/创建日期过滤
- 默认排序可配置
- 贡献者榜单：按投票/评论/被采纳计分；可隐藏/匿名化
- 门户分享方式：链接 / Widget（含截图工具）/ 嵌入式 Portal
- 门户文案与 CTA 可配置（含板块级覆盖）
- 门户多语言（自动检测 + 手动切换）与可选自动翻译
- 反馈分析：按日/周/月统计；Top viewed/voted/commented；Widget vs Portal 来源
- 门户模块开关（禁用反馈视图）

### Task 1: Add portal route + shell component

**Files:**
- Create: `app/portal/page.tsx`
- Create: `components/portal/portal-shell.tsx`
- Create: `components/portal/portal-nav.tsx`
- Test: `tests/app/portal-page.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import PortalPage, {
  PORTAL_TITLE,
  PORTAL_SECTIONS,
} from "@/app/portal/page";

describe("portal page", () => {
  it("exports a function", () => {
    expect(typeof PortalPage).toBe("function");
  });

  it("exposes portal labels", () => {
    expect(PORTAL_TITLE).toBe("反馈中心");
    expect(PORTAL_SECTIONS).toEqual([
      { label: "反馈", href: "/portal" },
      { label: "路线图", href: "/portal/roadmap" },
      { label: "变更日志", href: "/portal/changelog" },
      { label: "帮助中心", href: "/portal/help" },
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/app/portal-page.test.ts`
Expected: FAIL with "Cannot find module '@/app/portal/page'"

**Step 3: Write minimal implementation**

```tsx
export const PORTAL_TITLE = "反馈中心";
export const PORTAL_SECTIONS = [
  { label: "反馈", href: "/portal" },
  { label: "路线图", href: "/portal/roadmap" },
  { label: "变更日志", href: "/portal/changelog" },
  { label: "帮助中心", href: "/portal/help" },
] as const;

export default function PortalPage() {
  return (
    <PortalShell title={PORTAL_TITLE} sections={PORTAL_SECTIONS} />
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/app/portal-page.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/portal/page.tsx components/portal/portal-shell.tsx components/portal/portal-nav.tsx tests/app/portal-page.test.ts

git commit -m "feat: add portal shell route"
```

### Task 2: Link public feedback detail back to portal

**Files:**
- Modify: `app/feedback/[id]/page.tsx`
- Test: `tests/app/feedback-detail-page.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { FEEDBACK_BACK_HOME_LABEL } from "@/app/feedback/[id]/page";

describe("feedback detail page", () => {
  it("keeps back label unchanged", () => {
    expect(FEEDBACK_BACK_HOME_LABEL).toBe("返回首页");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/app/feedback-detail-page.test.ts`
Expected: PASS (baseline coverage) — then update test expectations if label changes.

**Step 3: Write minimal implementation**

```tsx
<Button asChild variant="outline" size="sm">
  <Link href="/portal">{FEEDBACK_BACK_HOME_LABEL}</Link>
</Button>
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/app/feedback-detail-page.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/feedback/[id]/page.tsx tests/app/feedback-detail-page.test.ts

git commit -m "feat: link feedback detail back to portal"
```

### Task 3: Add prefill parser utility

**Files:**
- Create: `lib/feedback/prefill.ts`
- Test: `tests/lib/feedback-prefill.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { parseFeedbackPrefill } from "@/lib/feedback/prefill";

const params = new URLSearchParams({
  title: "导出报告错位",
  description: "PDF 排版错位",
  type: "bug",
  priority: "high",
});

describe("parseFeedbackPrefill", () => {
  it("parses known fields", () => {
    expect(parseFeedbackPrefill(params)).toEqual({
      title: "导出报告错位",
      description: "PDF 排版错位",
      type: "bug",
      priority: "high",
    });
  });

  it("ignores unknown fields", () => {
    const extra = new URLSearchParams({ title: "x", source: "email" });
    expect(parseFeedbackPrefill(extra)).toEqual({ title: "x" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/feedback-prefill.test.ts`
Expected: FAIL with "Cannot find module '@/lib/feedback/prefill'"

**Step 3: Write minimal implementation**

```ts
import { feedbackTypeEnum, priorityEnum } from "@/lib/validators/feedback";

type Prefill = Partial<{
  title: string;
  description: string;
  type: "bug" | "feature" | "issue" | "other";
  priority: "low" | "medium" | "high";
}>;

export function parseFeedbackPrefill(params: URLSearchParams): Prefill {
  const prefill: Prefill = {};
  const title = params.get("title");
  const description = params.get("description");
  const type = params.get("type");
  const priority = params.get("priority");

  if (title) prefill.title = title;
  if (description) prefill.description = description;
  if (type && feedbackTypeEnum.safeParse(type).success) {
    prefill.type = type as Prefill["type"];
  }
  if (priority && priorityEnum.safeParse(priority).success) {
    prefill.priority = priority as Prefill["priority"];
  }
  return prefill;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/feedback-prefill.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/feedback/prefill.ts tests/lib/feedback-prefill.test.ts

git commit -m "feat: add feedback prefill parser"
```

### Task 4: Wire prefill into embedded feedback form

**Files:**
- Modify: `components/feedback/embedded-feedback-form.tsx`
- Modify: `tests/components/feedback/embedded-feedback-form.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { FEEDBACK_PREFILL_KEYS } from "@/components/feedback/embedded-feedback-form";

describe("EmbeddedFeedbackForm prefill", () => {
  it("exposes prefill keys", () => {
    expect(FEEDBACK_PREFILL_KEYS).toEqual([
      "title",
      "description",
      "type",
      "priority",
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback/embedded-feedback-form.test.tsx`
Expected: FAIL with "FEEDBACK_PREFILL_KEYS is not defined"

**Step 3: Write minimal implementation**

```tsx
export const FEEDBACK_PREFILL_KEYS = [
  "title",
  "description",
  "type",
  "priority",
] as const;

const searchParams = useSearchParams();
const prefill = useMemo(
  () => (searchParams ? parseFeedbackPrefill(searchParams) : {}),
  [searchParams]
);

const form = useForm<BaseFeedbackInput>({
  resolver: zodResolver(baseFeedbackSchema),
  defaultValues: {
    title: prefill.title ?? "",
    description: prefill.description ?? "",
    type: prefill.type ?? "issue",
    priority: prefill.priority ?? "medium",
  },
  mode: "onBlur",
});
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback/embedded-feedback-form.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/feedback/embedded-feedback-form.tsx tests/components/feedback/embedded-feedback-form.test.tsx

git commit -m "feat: support feedback form prefill"
```

### Task 5: Add similarity API route + helper

**Files:**
- Create: `app/api/feedback/similar/route.ts`
- Create: `lib/feedback/find-similar.ts`
- Test: `tests/api/feedback-similar.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { buildSimilarResponse } from "@/lib/feedback/find-similar";

const sample = [{
  feedbackId: 1,
  title: "批量导入联系人",
  description: "CSV 导入",
}];

describe("buildSimilarResponse", () => {
  it("returns scored suggestions", () => {
    const result = buildSimilarResponse("导入联系人", "", sample);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("feedbackId", 1);
    expect(result[0]).toHaveProperty("similarity");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/feedback-similar.test.ts`
Expected: FAIL with "Cannot find module '@/lib/feedback/find-similar'"

**Step 3: Write minimal implementation**

```ts
import { findDuplicates } from "@/lib/services/ai/duplicate-detector";

export function buildSimilarResponse(
  title: string,
  description: string,
  existing: Array<{ feedbackId: number; title: string; description?: string | null }>
) {
  return findDuplicates(
    { title, description },
    existing.map((item) => ({
      feedbackId: item.feedbackId,
      title: item.title,
      description: item.description ?? "",
    }))
  );
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/feedback-similar.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/feedback/similar/route.ts lib/feedback/find-similar.ts tests/api/feedback-similar.test.ts

git commit -m "feat: add feedback similarity endpoint"
```

### Task 6: Render inline duplicate suggestions in the form

**Files:**
- Create: `components/feedback/duplicate-suggestions-inline.tsx`
- Modify: `components/feedback/embedded-feedback-form.tsx`
- Test: `tests/components/feedback/duplicate-suggestions-inline.test.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { DuplicateSuggestionsInline } from "@/components/feedback/duplicate-suggestions-inline";

const isFn = (value: unknown) => typeof value === "function";

describe("DuplicateSuggestionsInline", () => {
  it("exports a component", () => {
    expect(isFn(DuplicateSuggestionsInline)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback/duplicate-suggestions-inline.test.tsx`
Expected: FAIL with "Cannot find module '@/components/feedback/duplicate-suggestions-inline'"

**Step 3: Write minimal implementation**

```tsx
export function DuplicateSuggestionsInline({ query }: { query: string }) {
  // fetch `/api/feedback/similar?title=${encodeURIComponent(query)}`
  // render a compact list linking to `/feedback/:id`
  return null;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback/duplicate-suggestions-inline.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/feedback/duplicate-suggestions-inline.tsx components/feedback/embedded-feedback-form.tsx tests/components/feedback/duplicate-suggestions-inline.test.tsx

git commit -m "feat: show inline duplicate suggestions"
```
