"use client";


/*
 * Copyright (c) 2026 Echo Team
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
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface FeedbackItem {
  feedbackId: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  voteCount?: number;
}

interface FeedbackListItemProps {
  feedback: FeedbackItem;
  basePath?: string;
  canDelete?: boolean;
  onDeleted?: (feedbackId: number) => void;
  isSelected?: boolean;
  onSelect?: (feedbackId: number, selected: boolean) => void;
}

const TYPE_STYLES: Record<string, { className: string }> = {
  bug: {
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  feature: {
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  issue: {
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  other: {
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

const PRIORITY_ICONS: Record<string, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: {
    label: "新接收",
    className: "border-blue-500 text-blue-700 dark:text-blue-300",
  },
  "in-progress": {
    label: "处理中",
    className: "border-yellow-500 text-yellow-700 dark:text-yellow-300",
  },
  planned: {
    label: "已规划",
    className: "border-purple-500 text-purple-700 dark:text-purple-300",
  },
  completed: {
    label: "已完成",
    className: "border-green-500 text-green-700 dark:text-green-300",
  },
  closed: {
    label: "已关闭",
    className: "border-gray-500 text-gray-700 dark:text-gray-300",
  },
};

export function FeedbackListItem({
  feedback,
  basePath = "/admin/feedback",
  canDelete = false,
  onDeleted,
  isSelected = false,
  onSelect,
}: FeedbackListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t("relative.today");
    if (days === 1) return t("relative.yesterday");
    if (days < 7) return t("relative.daysAgo", { count: days });
    const localeMap: Record<string, string> = {
      en: "en-US",
      "zh-CN": "zh-CN",
      jp: "ja-JP",
    };
    return date.toLocaleDateString(localeMap[locale] ?? "en-US");
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const typeBadge = TYPE_STYLES[feedback.type] ?? {
    className: "bg-muted text-muted-foreground",
  };
  const statusBadge = STATUS_LABELS[feedback.status] ?? {
    className: "border-muted-foreground text-muted-foreground",
  };
  const priorityIcon = PRIORITY_ICONS[feedback.priority] ?? "⚪";
  const typeLabel = t(`type.${feedback.type}`);
  const statusLabel = t(
    `status.${feedback.status === "in-progress" ? "inProgress" : feedback.status}`,
  );

  const handleRowClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, [data-no-row-nav]")) {
      return;
    }
    router.push(`${basePath}/${feedback.feedbackId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(feedback.feedbackId, e.target.checked);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`${basePath}/${feedback.feedbackId}`);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/feedback/${feedback.feedbackId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete feedback");
      }

      setShowDeleteDialog(false);
      onDeleted?.(feedback.feedbackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        data-testid="feedback-item"
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={handleKeyDown}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={t("list.selectLabel")}
                checked={isSelected}
                onChange={handleSelect}
                onClick={(event) => event.stopPropagation()}
                className="mt-1 h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                data-no-row-nav
              />
              <div className="text-2xl">{priorityIcon}</div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                {feedback.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {truncateText(feedback.description, 150)}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className={typeBadge.className}>{typeLabel}</Badge>

                <Badge
                  variant="outline"
                  className={cn("border", statusBadge.className)}
                >
                  {statusLabel}
                </Badge>

                <span className="text-muted-foreground">
                  {formatDate(feedback.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {t("vote.count", { count: feedback.voteCount ?? 0 })}
              </Badge>
            </div>

            {canDelete ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                aria-label={t("list.delete")}
                data-no-row-nav
              >
                {tCommon("delete")}
              </Button>
            ) : (
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除反馈？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该反馈将不再显示在列表中。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
