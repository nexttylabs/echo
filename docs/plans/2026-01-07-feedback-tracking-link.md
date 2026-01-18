# Feedback Tracking Link Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a public feedback detail page and API, plus return and surface a tracking link after submission.

**Architecture:** Use a shared query helper to fetch feedback + attachments by id. The page reads directly from DB as a Server Component, while the API returns JSON with identical data and error codes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, Bun test runner, shadcn/ui.

### Task 1: Shared query helper for feedback detail

**Files:**
- Create: `lib/feedback/get-feedback-by-id.ts`
- Test: `tests/lib/get-feedback-by-id.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";

const makeDb = (rows: unknown[]) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  }),
});

describe("getFeedbackById", () => {
  it("returns null when missing", async () => {
    const result = await getFeedbackById(makeDb([]) as any, 1);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/lib/get-feedback-by-id.test.ts`
Expected: FAIL with "getFeedbackById is not a function" or module not found.

**Step 3: Write minimal implementation**

```ts
import { feedback, attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type DbShape = {
  select: Database["select"];
  query: Database["query"];
};

export async function getFeedbackById(db: DbShape, id: number) {
  const [row] = await db
    .select({
      feedbackId: feedback.feedbackId,
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      priority: feedback.priority,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    })
    .from(feedback)
    .where(eq(feedback.feedbackId, id))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(attachments)
    .where(eq(attachments.feedbackId, id));

  return { feedback: row, attachments: items };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/lib/get-feedback-by-id.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/feedback/get-feedback-by-id.ts tests/lib/get-feedback-by-id.test.ts
git commit -m "feat: add shared feedback detail query"
```

### Task 2: Feedback detail API route

**Files:**
- Create: `app/api/feedback/[id]/handler.ts`
- Create: `app/api/feedback/[id]/route.ts`
- Test: `tests/api/feedback-by-id.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { buildGetFeedbackHandler } from "@/app/api/feedback/[id]/handler";

const makeDeps = (row?: unknown) => ({
  getFeedbackById: async () => row ?? null,
});

describe("GET /api/feedback/[id]", () => {
  it("returns 400 for invalid id", async () => {
    const handler = buildGetFeedbackHandler(makeDeps());
    const res = await handler(new Request("http://localhost/api/feedback/abc"), { params: { id: "abc" } });
    expect(res.status).toBe(400);
  });

  it("returns 404 when missing", async () => {
    const handler = buildGetFeedbackHandler(makeDeps());
    const res = await handler(new Request("http://localhost/api/feedback/1"), { params: { id: "1" } });
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/feedback-by-id.test.ts`
Expected: FAIL (handler missing)

**Step 3: Write minimal implementation**

```ts
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";

type Deps = {
  getFeedbackById: (id: number) => Promise<{
    feedback: unknown;
    attachments: unknown[];
  } | null>;
};

export function buildGetFeedbackHandler(deps: Deps) {
  return async function GET(_req: Request, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (!params.id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    try {
      const result = await deps.getFeedbackById(id);
      if (!result) {
        return NextResponse.json(
          { error: "Feedback not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        data: {
          ...result.feedback,
          attachments: result.attachments,
        },
      });
    } catch (error) {
      return apiError(error);
    }
  };
}
```

**Step 4: Wire the route**

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { buildGetFeedbackHandler } from "./handler";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const handler = buildGetFeedbackHandler({
    getFeedbackById: (id) => getFeedbackById(db, id),
  });

  return handler(req, ctx);
}
```

**Step 5: Run test to verify it passes**

Run: `bun test tests/api/feedback-by-id.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add app/api/feedback/[id]/handler.ts app/api/feedback/[id]/route.ts tests/api/feedback-by-id.test.ts
git commit -m "feat: add feedback detail api"
```

### Task 3: Feedback detail page + UI

**Files:**
- Create: `app/feedback/[id]/page.tsx`
- Create: `app/feedback/[id]/not-found.tsx`
- Create: `components/feedback/feedback-detail.tsx`

**Step 1: Write the failing test (smoke test)**

```ts
import { describe, expect, it } from "bun:test";
import FeedbackDetailPage from "@/app/feedback/[id]/page";

describe("feedback detail page", () => {
  it("exports a function", () => {
    expect(typeof FeedbackDetailPage).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/app/feedback-detail-page.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement page + component**

```tsx
import { notFound } from "next/navigation";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { db } from "@/lib/db";
import { FeedbackDetail } from "@/components/feedback/feedback-detail";

export default async function FeedbackDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!db || Number.isNaN(id)) notFound();

  const result = await getFeedbackById(db, id);
  if (!result) notFound();

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <FeedbackDetail
        feedback={{
          ...result.feedback,
          attachments: result.attachments,
        }}
      />
    </div>
  );
}
```

**Step 4: Add `not-found.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Feedback Not Found</h1>
      <p className="text-muted-foreground mb-8">该反馈不存在或已被删除。</p>
      <Button asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
```

**Step 5: Implement `FeedbackDetail` (client)**

```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function FeedbackDetail({ feedback }: { feedback: any }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{feedback.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">反馈编号: #{feedback.feedbackId}</p>
        </div>
        <Button variant="outline" size="icon" onClick={copyLink}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
```

**Step 6: Run test to verify it passes**

Run: `bun test tests/app/feedback-detail-page.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add app/feedback/[id]/page.tsx app/feedback/[id]/not-found.tsx components/feedback/feedback-detail.tsx tests/app/feedback-detail-page.test.ts
git commit -m "feat: add feedback detail page"
```

### Task 4: Return tracking URL from feedback submission

**Files:**
- Modify: `app/api/feedback/handler.ts`
- Test: `tests/api/feedback-create.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test";
import { buildCreateFeedbackHandler } from "@/app/api/feedback/handler";

const makeDeps = () => ({
  insert: () => ({
    values: () => ({
      returning: async () => [
        { feedbackId: 1, title: "t", description: "d", type: "bug", priority: "low", status: "new", organizationId: "org" },
      ],
    }),
  }),
});

describe("POST /api/feedback", () => {
  it("returns trackingUrl", async () => {
    const handler = buildCreateFeedbackHandler({ db: makeDeps() as any });
    const res = await handler(new Request("http://localhost/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-organization-id": "org" },
      body: JSON.stringify({ title: "t", description: "d", type: "bug", priority: "low" }),
    }));

    const json = await res.json();
    expect(json.data.trackingUrl).toBe("/feedback/1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/api/feedback-create.test.ts`
Expected: FAIL (trackingUrl missing)

**Step 3: Implement minimal change**

```ts
const trackingUrl = `/feedback/${created.feedbackId}`;
return NextResponse.json({ data: { ...created, trackingUrl } }, { status: 201 });
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/api/feedback-create.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/feedback/handler.ts tests/api/feedback-create.test.ts
git commit -m "feat: include tracking url in feedback response"
```

### Task 5: Surface tracking URL in the embedded form

**Files:**
- Modify: `components/feedback/embedded-feedback-form.tsx`

**Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "bun:test";
import { render, screen } from "@testing-library/react";
import { EmbeddedFeedbackForm } from "@/components/feedback/embedded-feedback-form";

describe("EmbeddedFeedbackForm", () => {
  it("renders tracking link after success", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { feedbackId: 1, trackingUrl: "/feedback/1" } }) }) as any;
    render(<EmbeddedFeedbackForm organizationId="org" />);
    expect(screen.getByText("提交反馈")).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/components/feedback/embedded-feedback-form.test.tsx`
Expected: FAIL (no tracking link UI)

**Step 3: Implement minimal change**

```tsx
const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
// after success
setTrackingUrl(result.data.trackingUrl ?? null);
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/components/feedback/embedded-feedback-form.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/feedback/embedded-feedback-form.tsx tests/components/feedback/embedded-feedback-form.test.tsx
git commit -m "feat: show tracking link after submission"
```

### Task 6: Final validation

**Step 1: Run lint**

Run: `bun run lint`
Expected: PASS

**Step 2: Run targeted tests**

Run: `bun test tests/api/feedback-by-id.test.ts tests/api/feedback-create.test.ts tests/lib/get-feedback-by-id.test.ts`
Expected: PASS

**Step 3: Commit (if needed)**

```bash
git status -sb
```
