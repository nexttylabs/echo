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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FeedbackListControls } from "./feedback-list-controls";
import { Pagination } from "@/components/shared/pagination";
import { FeedbackStats } from "./feedback-stats";
import { parseCsvParam, serializeCsvParam } from "@/lib/feedback/filters";
import { FeedbackBulkActions } from "@/components/feedback/feedback-bulk-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface FeedbackItem {
  feedbackId: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
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

const STATUS_LABELS: Record<string, { className: string }> = {
  new: {
    className: "border-blue-500 text-blue-700 dark:text-blue-300",
  },
  "in-progress": {
    className: "border-yellow-500 text-yellow-700 dark:text-yellow-300",
  },
  planned: {
    className: "border-purple-500 text-purple-700 dark:text-purple-300",
  },
  completed: {
    className: "border-green-500 text-green-700 dark:text-green-300",
  },
  closed: {
    className: "border-gray-500 text-gray-700 dark:text-gray-300",
  },
};

interface FeedbackListResponse {
  data: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FeedbackListProps {
  organizationId: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: string;
  basePath?: string;
  canDelete?: boolean;
}

export function FeedbackList({
  organizationId,
  page,
  pageSize,
  sortBy,
  sortOrder,
  basePath = "/admin/feedback",
  canDelete = false,
}: FeedbackListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const query = searchParams.get("query") ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const typeParam = searchParams.get("type") ?? "";
  const priorityParam = searchParams.get("priority") ?? "";
  const hasVotesParam = searchParams.get("hasVotes") ?? "";
  const hasRepliesParam = searchParams.get("hasReplies") ?? "";

  const resolvedPage = (() => {
    const parsed = Number(searchParams.get("page") ?? page);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : page;
  })();
  const resolvedPageSize = (() => {
    const parsed = Number(searchParams.get("pageSize") ?? pageSize);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : pageSize;
  })();
  const resolvedSortBy = searchParams.get("sortBy") ?? sortBy;
  const resolvedSortOrder = searchParams.get("sortOrder") ?? sortOrder;

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organizationId,
        page: resolvedPage.toString(),
        pageSize: resolvedPageSize.toString(),
        sortBy: resolvedSortBy,
        sortOrder: resolvedSortOrder,
      });

      if (query) params.set("query", query);
      const statusValues = parseCsvParam(statusParam).filter(
        (value) => value !== "all",
      );
      const typeValues = parseCsvParam(typeParam).filter(
        (value) => value !== "all",
      );
      const priorityValues = parseCsvParam(priorityParam).filter(
        (value) => value !== "all",
      );
      const hasVotesValues = parseCsvParam(hasVotesParam);
      const hasRepliesValues = parseCsvParam(hasRepliesParam);

      if (statusValues.length) {
        params.set("status", serializeCsvParam(statusValues));
      }
      if (typeValues.length) {
        params.set("type", serializeCsvParam(typeValues));
      }
      if (priorityValues.length) {
        params.set("priority", serializeCsvParam(priorityValues));
      }
      if (hasVotesValues.length) {
        params.set("hasVotes", serializeCsvParam(hasVotesValues));
      }
      if (hasRepliesValues.length) {
        params.set("hasReplies", serializeCsvParam(hasRepliesValues));
      }

      const response = await fetch(`/api/feedback?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      const result = await response.json();
      setData(result);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [
    organizationId,
    resolvedPage,
    resolvedPageSize,
    resolvedSortBy,
    resolvedSortOrder,
    query,
    statusParam,
    typeParam,
    priorityParam,
    hasVotesParam,
    hasRepliesParam,
  ]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/feedback/${deleteTarget.feedbackId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to delete feedback");
      }

      if (data) {
        setData({
          ...data,
          data: data.data.filter(
            (item) => item.feedbackId !== deleteTarget.feedbackId
          ),
        });
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleIds = useMemo(
    () => data?.data.map((item) => item.feedbackId) ?? [],
    [data],
  );
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(visibleIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (feedbackId: number, selected: boolean) => {
    setSelectedIds((prev) => {
      if (selected) {
        return prev.includes(feedbackId) ? prev : [...prev, feedbackId];
      }
      return prev.filter((id) => id !== feedbackId);
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">{tCommon("loading")}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {t("list.error", { message: error })}
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="space-y-6">
        <FeedbackStats organizationId={organizationId} />
        <FeedbackListControls basePath={basePath} />
        <div className="rounded-md border">
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("list.empty")}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRowClick = (feedbackId: number) => {
    router.push(`${basePath}/${feedbackId}`);
  };

  return (
    <div className="space-y-6">
      <FeedbackStats organizationId={organizationId} />
      {data && (
        <FeedbackListControls
          basePath={basePath}
        />
      )}

      {selectedIds.length > 0 && (
        <FeedbackBulkActions
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onCompleted={fetchFeedback}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  aria-label={t("list.selectAll")}
                  checked={allSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                  className="h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </TableHead>
              <TableHead className="w-12">{t("priority.label")}</TableHead>
              <TableHead>{t("form.title")}</TableHead>
              <TableHead className="w-24">{t("type.label")}</TableHead>
              <TableHead className="w-28">{t("status.label")}</TableHead>
              <TableHead className="w-20">{t("vote.label")}</TableHead>
              <TableHead className="w-28">{t("list.createdAt")}</TableHead>
              {canDelete && <TableHead className="w-16"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((feedback) => {
              const typeBadge = TYPE_STYLES[feedback.type] ?? {
                className: "bg-muted text-muted-foreground",
              };
              const statusBadge = STATUS_LABELS[feedback.status] ?? {
                className: "border-muted-foreground text-muted-foreground",
              };
              const priorityIcon = PRIORITY_ICONS[feedback.priority] ?? "⚪";
              const typeLabel = t(`type.${feedback.type}`);
              const statusLabel = t(
                `status.${feedback.status === "in-progress" ? "inProgress" : feedback.status}`
              );

              return (
                <TableRow
                  key={feedback.feedbackId}
                  className="cursor-pointer"
                  data-state={selectedIds.includes(feedback.feedbackId) ? "selected" : undefined}
                  onClick={() => handleRowClick(feedback.feedbackId)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={t("list.selectLabel")}
                      checked={selectedIds.includes(feedback.feedbackId)}
                      onChange={(e) =>
                        toggleSelectOne(feedback.feedbackId, e.target.checked)
                      }
                      className="h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-xl">{priorityIcon}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium truncate hover:text-primary transition-colors">
                        {feedback.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {feedback.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeBadge.className}>{typeLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("border", statusBadge.className)}
                    >
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {feedback.voteCount ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(feedback.createdAt)}
                  </TableCell>
                  {canDelete && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(feedback)}
                        aria-label={t("list.delete")}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("list.pageSizeLabel")}</span>
          <select
            value={resolvedPageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {t("list.summary", { total: data.total, pageSize: resolvedPageSize })}
          </span>
        </div>
        <Pagination
          currentPage={resolvedPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-testid="delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除反馈？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该反馈将不再显示在列表中。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
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
    </div>
  );
}
