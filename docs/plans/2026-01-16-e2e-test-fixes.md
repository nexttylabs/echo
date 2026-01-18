# E2E Test Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run the requested Playwright E2E specs and fix any failures until they pass.

**Architecture:** Use the existing Playwright specs as the failing tests, trace failures to the responsible UI/API layer, and apply minimal, targeted fixes. Re-run each spec after each fix to validate.

**Tech Stack:** Next.js (App Router), React, TypeScript, Bun, Playwright.

---

### Task 1: Establish execution workspace

**Files:**
- Modify: `.gitignore` (only if `.worktrees/` is not ignored)

**Step 1: Check preferred worktree directory**
Run: `ls -d .worktrees 2>/dev/null || ls -d worktrees 2>/dev/null`
Expected: one of the directories exists; otherwise proceed to CLAUDE.md preference.

**Step 2: Check CLAUDE.md for worktree guidance**
Run: `grep -i "worktree.*director" CLAUDE.md 2>/dev/null`
Expected: guidance or no output.

**Step 3: Verify ignore if using project-local directory**
Run: `git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null`
Expected: zero exit code; if not ignored, add and commit `.gitignore` entry.

**Step 4: Create worktree and install deps**
Run:
```
project=$(basename "$(git rev-parse --show-toplevel)")
branch="fix/e2e-tests-2026-01-16"
path=".worktrees/$branch"

git worktree add "$path" -b "$branch"
cd "$path"
bun install
```
Expected: worktree created and dependencies installed.

**Step 5: Baseline test command (single spec)**
Run: `bunx playwright test tests/e2e/health-check.spec.ts`
Expected: If failing, stop and report; if passing, continue.

---

### Task 2: Fix `tests/e2e/feedback-management.spec.ts`

**Files:**
- Modify: `tests/e2e/feedback-management.spec.ts`
- Modify: `app/**` (as indicated by failure)

**Step 1: Run spec to capture failure**
Run: `bunx playwright test tests/e2e/feedback-management.spec.ts`
Expected: FAIL with specific error output.

**Step 2: Root cause investigation**
- Identify failing assertion, locator, or API response in the error output.
- Trace to the source file indicated by stack/trace.

**Step 3: Minimal fix**
- Update the failing locator/expectation to match current UI OR fix the underlying UI/API issue.
- Keep scope minimal; avoid refactors.

**Step 4: Verify**
Run: `bunx playwright test tests/e2e/feedback-management.spec.ts`
Expected: PASS.

---

### Task 3: Fix `tests/e2e/feedback-submit.spec.ts`

**Files:**
- Modify: `tests/e2e/feedback-submit.spec.ts`
- Modify: `app/**` (as indicated by failure)

**Step 1: Run spec to capture failure**
Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: FAIL with specific error output.

**Step 2: Root cause investigation**
- Identify failing step, response, or UI mismatch.
- Trace to responsible route/component.

**Step 3: Minimal fix**
- Adjust test expectations or fix underlying behavior.

**Step 4: Verify**
Run: `bunx playwright test tests/e2e/feedback-submit.spec.ts`
Expected: PASS.

---

### Task 4: Fix `tests/e2e/feedback-view.spec.ts`

**Files:**
- Modify: `tests/e2e/feedback-view.spec.ts`
- Modify: `app/**` (as indicated by failure)

**Step 1: Run spec to capture failure**
Run: `bunx playwright test tests/e2e/feedback-view.spec.ts`
Expected: FAIL with specific error output.

**Step 2: Root cause investigation**
- Identify failing expectations and any missing data/fixtures.
- Trace to page/data-loading code.

**Step 3: Minimal fix**
- Adjust test to current UI or fix underlying page/data.

**Step 4: Verify**
Run: `bunx playwright test tests/e2e/feedback-view.spec.ts`
Expected: PASS.

---

### Task 5: Fix `tests/e2e/health-check.spec.ts`

**Files:**
- Modify: `app/health/route.ts`
- Modify: `tests/e2e/health-check.spec.ts` (only if test is outdated)

**Step 1: Run spec to capture failure**
Run: `bunx playwright test tests/e2e/health-check.spec.ts`
Expected: FAIL with specific error output.

**Step 2: Root cause investigation**
- Verify health endpoint route exists and matches test expectation.
- Validate response shape and status.

**Step 3: Minimal fix**
- Adjust endpoint or test to align expected contract.

**Step 4: Verify**
Run: `bunx playwright test tests/e2e/health-check.spec.ts`
Expected: PASS.

---

### Task 6: Final verification (requested specs)

**Files:**
- None (test run)

**Step 1: Run requested specs in order**
Run:
```
bunx playwright test tests/e2e/feedback-management.spec.ts
bunx playwright test tests/e2e/feedback-submit.spec.ts
bunx playwright test tests/e2e/feedback-view.spec.ts
bunx playwright test tests/e2e/health-check.spec.ts
```
Expected: All PASS.

**Step 2: Report results**
Summarize changes, test outcomes, and any follow-ups.
