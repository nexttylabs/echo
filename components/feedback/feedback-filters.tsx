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

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackSorter } from "@/components/feedback/feedback-sorter";

interface FeedbackFiltersProps {
  className?: string;
}

export function FeedbackFilters({ className }: FeedbackFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("feedback");

  const STATUS_OPTIONS = [
    { value: "all", label: t("status.all") },
    { value: "new", label: t("status.new") },
    { value: "in-progress", label: t("status.inProgress") },
    { value: "planned", label: t("status.planned") },
    { value: "completed", label: t("status.completed") },
    { value: "closed", label: t("status.closed") },
  ];

  const TYPE_OPTIONS = [
    { value: "all", label: t("type.all") },
    { value: "bug", label: t("type.bug") },
    { value: "feature", label: t("type.feature") },
    { value: "issue", label: t("type.issue") },
    { value: "other", label: t("type.other") },
  ];

  const PRIORITY_OPTIONS = [
    { value: "all", label: t("priority.all") },
    { value: "low", label: t("priority.low") },
    { value: "medium", label: t("priority.medium") },
    { value: "high", label: t("priority.high") },
  ];

  const currentStatus = searchParams.get("status") || "all";
  const currentType = searchParams.get("type") || "all";
  const currentPriority = searchParams.get("priority") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Reset to page 1 when filter changes
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentType !== "all" ||
    currentPriority !== "all";

  const activeFilterCount =
    (currentStatus !== "all" ? 1 : 0) +
    (currentType !== "all" ? 1 : 0) +
    (currentPriority !== "all" ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("filters.title")}</h2>
          {activeFilterCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {t("filters.activeCount", { count: activeFilterCount })}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-1" />
            {t("filters.clearAll")}
          </Button>
        )}
      </div>

      <FeedbackSorter />

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("filters.statusLabel")}</label>
          <Select
            value={currentStatus}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("filters.typeLabel")}</label>
          <Select
            value={currentType}
            onValueChange={(value) => updateFilter("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.typePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("filters.priorityLabel")}</label>
          <Select
            value={currentPriority}
            onValueChange={(value) => updateFilter("priority", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.priorityPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {currentStatus !== "all" && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
              {t("filters.statusLabel")}: {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label}
              <button
                onClick={() => updateFilter("status", "all")}
                className="ml-1 hover:text-blue-950 dark:hover:text-blue-100"
              >
                ×
              </button>
            </div>
          )}
          {currentType !== "all" && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm">
              {t("filters.typeLabel")}: {TYPE_OPTIONS.find((o) => o.value === currentType)?.label}
              <button
                onClick={() => updateFilter("type", "all")}
                className="ml-1 hover:text-green-950 dark:hover:text-green-100"
              >
                ×
              </button>
            </div>
          )}
          {currentPriority !== "all" && (
            <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full text-sm">
              {t("filters.priorityLabel")}: {PRIORITY_OPTIONS.find((o) => o.value === currentPriority)?.label}
              <button
                onClick={() => updateFilter("priority", "all")}
                className="ml-1 hover:text-orange-950 dark:hover:text-orange-100"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
