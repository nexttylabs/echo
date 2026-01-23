"use client";


/*
 * Copyright (c) 2026 Nexttylabs Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS = [
  "new",
  "in-progress",
  "planned",
  "completed",
  "closed",
] as const;

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

type FeedbackBulkActionsProps = {
  selectedIds: number[];
  onClear: () => void;
  onCompleted: () => void;
};

type BulkActionPayload =
  | { action: "updateStatus"; ids: number[]; status: string }
  | { action: "updatePriority"; ids: number[]; priority: string }
  | { action: "delete"; ids: number[] };

export function FeedbackBulkActions({
  selectedIds,
  onClear,
  onCompleted,
}: FeedbackBulkActionsProps) {
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const runAction = async (payload: BulkActionPayload) => {
    if (!selectedIds.length) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }

      onCompleted();
      onClear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3">
      <Badge variant="secondary">
        {t("bulk.selectedCount", { count: selectedIds.length })}
      </Badge>

      <Select
        onValueChange={(value) =>
          runAction({ action: "updateStatus", ids: selectedIds, status: value })
        }
        disabled={isSubmitting}
      >
        <SelectTrigger className="min-w-[160px]" aria-label={t("bulk.updateStatus")}>
          <SelectValue placeholder={t("bulk.updateStatus")} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {t(`status.${status === "in-progress" ? "inProgress" : status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) =>
          runAction({ action: "updatePriority", ids: selectedIds, priority: value })
        }
        disabled={isSubmitting}
      >
        <SelectTrigger
          className="min-w-[160px]"
          aria-label={t("bulk.updatePriority")}
        >
          <SelectValue placeholder={t("bulk.updatePriority")} />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {t(`priority.${priority}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => setShowDeleteDialog(true)}
        disabled={isSubmitting}
      >
        {t("bulk.delete")}
      </Button>

      <Button variant="ghost" onClick={onClear} disabled={isSubmitting}>
        {t("bulk.clearSelection")}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulk.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulk.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => runAction({ action: "delete", ids: selectedIds })}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground"
            >
              {isSubmitting ? tCommon("saving") : t("bulk.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
