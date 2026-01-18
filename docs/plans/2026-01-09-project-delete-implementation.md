# Project Delete Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ability for admin users to delete projects with a safe confirmation mechanism (typing project name to confirm).

**Architecture:** Create a delete confirmation dialog component using shadcn AlertDialog. Add a "danger zone" section to the project settings page with a delete button. Call the existing DELETE API endpoint at `/api/projects/[projectId]`.

**Tech Stack:** 
- React 19 (client components)
- Next.js 16 App Router
- Shadcn/ui (AlertDialog, Button, Card, Input)
- Lucide React (icons)
- TypeScript

---

## Task 1: Create Delete Project Dialog Component

**Files:**
- Create: `components/project/delete-project-dialog.tsx`

**Step 1: Create the delete dialog component file**

Create file `components/project/delete-project-dialog.tsx` with the following content:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmMatch = confirmText === projectName;

  async function handleDelete() {
    if (!isConfirmMatch) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "删除失败");
      }

      // Success - close dialog and redirect
      onOpenChange(false);
      router.push("/settings/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setIsDeleting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!isDeleting) {
      onOpenChange(newOpen);
      // Reset state when closing
      if (!newOpen) {
        setConfirmText("");
        setError(null);
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>删除项目</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <p>此操作不可撤销。删除项目将会：</p>
              <ul className="list-disc space-y-1 pl-5 text-left">
                <li>永久删除项目的所有配置</li>
                <li>删除所有相关的反馈数据</li>
                <li>删除所有相关的评论和附件</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-text">
            请输入项目名称 <span className="font-semibold">{projectName}</span> 以确认删除
          </Label>
          <Input
            id="confirm-text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            autoComplete="off"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!isConfirmMatch || isDeleting}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {isDeleting ? "删除中..." : "删除项目"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Step 2: Verify the component compiles**

Run TypeScript check:
```bash
bun run build --dry-run
```

Expected: No TypeScript errors in the new file.

**Step 3: Commit the dialog component**

```bash
git add components/project/delete-project-dialog.tsx
git commit -m "feat: add delete project confirmation dialog component"
```

---

## Task 2: Add Danger Zone to Project Settings

**Files:**
- Modify: `components/project/project-settings.tsx`

**Step 1: Import the delete dialog and required icons**

At the top of `components/project/project-settings.tsx`, add these imports after the existing imports:

```tsx
import { AlertTriangle } from "lucide-react";
import { DeleteProjectDialog } from "./delete-project-dialog";
```

**Step 2: Add state for delete dialog**

Inside the `ProjectSettings` component, after the existing state declarations (around line 54), add:

```tsx
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
```

Also add the useState import if not already present:

```tsx
import { useState } from "react";
```

**Step 3: Add danger zone card below the preview card**

At the end of the return statement, after the closing `</Card>` for the preview (around line 321), add:

```tsx
      <Card className="border-destructive/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            危险区域
          </CardTitle>
          <CardDescription>
            这些操作不可逆，请谨慎操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-sm">删除项目</h4>
              <p className="text-sm text-muted-foreground mt-1">
                永久删除此项目及其所有相关数据
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              删除项目
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteProjectDialog
        projectId={project.projectId}
        projectName={project.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
```

**Step 4: Verify the updated component compiles**

Run TypeScript check:
```bash
bun run build --dry-run
```

Expected: No TypeScript errors.

**Step 5: Test in development mode**

Start the development server:
```bash
bun dev
```

Navigate to: `http://localhost:3000/settings/projects/[any-project-slug]`

Expected behavior:
- See "危险区域" card at the bottom with red border
- See "删除项目" button in red
- Clicking the button opens the confirmation dialog
- Dialog shows warning icon and message
- Input field requires exact project name
- Delete button is disabled until text matches
- Cancel button closes dialog

**Step 6: Commit the changes**

```bash
git add components/project/project-settings.tsx
git commit -m "feat: add danger zone with delete button to project settings"
```

---

## Task 3: Test Delete Functionality

**Step 1: Manual testing checklist**

Test the following scenarios:

1. **Permission check**: Log in as non-admin user
   - Navigate to project settings
   - Verify delete button is visible (backend will reject)
   
2. **Dialog behavior**:
   - Click "删除项目" button
   - Verify dialog opens
   - Verify warning icon and message are displayed
   - Type incorrect project name
   - Verify "删除项目" button stays disabled
   - Type correct project name
   - Verify "删除项目" button becomes enabled

3. **Cancel flow**:
   - Open dialog
   - Type partial project name
   - Click "取消"
   - Verify dialog closes
   - Re-open dialog
   - Verify input field is empty (state reset)

4. **Successful delete**:
   - Open dialog
   - Type exact project name
   - Click "删除项目"
   - Verify button shows "删除中..." loading state
   - Verify redirect to `/settings/projects`
   - Verify project is removed from list

5. **Error handling**:
   - Simulate network error (disconnect internet)
   - Try to delete
   - Verify error message is displayed
   - Verify dialog stays open
   - Verify user can retry

**Step 2: Document test results**

Create a test results file:

```bash
echo "# Delete Project Feature - Manual Test Results

Date: $(date +%Y-%m-%d)

## Test Cases

- [ ] Dialog opens when delete button clicked
- [ ] Warning icon and message displayed
- [ ] Input validation works (exact match required)
- [ ] Cancel button closes dialog and resets state
- [ ] Successful delete redirects to project list
- [ ] Error messages displayed on failure
- [ ] Loading state shown during delete
- [ ] Backend permission check works

## Notes

[Add any observations or issues found]
" > docs/testing/delete-project-manual-tests.md
```

**Step 3: Commit test documentation**

```bash
git add docs/testing/delete-project-manual-tests.md
git commit -m "docs: add manual test checklist for project delete feature"
```

---

## Task 4: Update Component Exports (Optional)

**Files:**
- Modify: `components/project/index.ts` (if it exists)

**Step 1: Check if index file exists**

```bash
ls components/project/index.ts
```

**Step 2: If exists, add export**

If the file exists, add:

```tsx
export { DeleteProjectDialog } from "./delete-project-dialog";
```

**Step 3: Commit if modified**

```bash
git add components/project/index.ts
git commit -m "chore: export DeleteProjectDialog component"
```

If the file doesn't exist, skip this task.

---

## Task 5: Final Verification

**Step 1: Run full build**

```bash
bun run build
```

Expected: Build succeeds with no errors.

**Step 2: Run linter**

```bash
bun run lint
```

Expected: No new linting errors in modified/created files.

**Step 3: Create final commit if needed**

If there are any lint fixes:

```bash
git add .
git commit -m "style: fix lint issues in delete project feature"
```

---

## Completion Checklist

- [x] DeleteProjectDialog component created
- [x] Danger zone added to project settings
- [x] Delete button triggers confirmation dialog
- [x] Input validation requires exact project name match
- [x] Successful delete redirects to project list
- [x] Error handling displays user-friendly messages
- [x] Loading states prevent duplicate actions
- [x] All TypeScript checks pass
- [x] Manual testing completed
- [x] Code committed with clear commit messages

---

## Post-Implementation Notes

**Future Enhancements:**
1. Add toast notification on successful delete
2. Show feedback count before deleting
3. Add soft delete capability (deletedAt field)
4. Allow data export before deletion
5. Add unit tests for DeleteProjectDialog component

**Known Limitations:**
- No undo functionality (permanent delete)
- No batch delete capability
- No feedback count preview in dialog

**Related Files:**
- Backend API: `app/api/projects/[projectId]/route.ts` (already implements DELETE)
- Database schema: `lib/db/schema/projects.ts` (cascade delete configured)
- Permissions: Admin-only enforced at API level
