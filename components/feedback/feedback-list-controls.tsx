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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCsvParam, serializeCsvParam } from "@/lib/feedback/filters";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  ListFilter,
  Flag,
  CircleDot,
  ThumbsUp,
  MessageSquare,
  ArrowUpDown,
  Plus,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "新接收" },
  { value: "in-progress", label: "处理中" },
  { value: "planned", label: "已规划" },
  { value: "completed", label: "已完成" },
  { value: "closed", label: "已关闭" },
] as const;

const TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "功能请求" },
  { value: "issue", label: "问题" },
  { value: "other", label: "其他" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
] as const;

type FeedbackListControlsProps = {
  basePath?: string;
  onUpdate?: () => void;
};

function FilterDropdown({
  label,
  icon: Icon,
  options,
  values,
  onToggle,
  className,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5", className)}>
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {label}
          {values.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
              {values.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FeedbackListControls({
  basePath = "/admin/feedback",
  onUpdate,
}: FeedbackListControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BOOL_OPTIONS = [
    { value: "true", label: t("list.boolYes") },
    { value: "false", label: t("list.boolNo") },
  ];

  const paramsSnapshot = useMemo(
    () => new URLSearchParams(searchParams),
    [searchParams],
  );

  const urlQuery = paramsSnapshot.get("query") ?? "";

  // Local state for search input to enable debouncing
  const [searchValue, setSearchValue] = useState(urlQuery);
  const status = parseCsvParam(paramsSnapshot.get("status"));
  const type = parseCsvParam(paramsSnapshot.get("type"));
  const priority = parseCsvParam(paramsSnapshot.get("priority"));
  const hasVotes = parseCsvParam(paramsSnapshot.get("hasVotes"));
  const hasReplies = parseCsvParam(paramsSnapshot.get("hasReplies"));

  const sortBy = paramsSnapshot.get("sortBy") ?? "createdAt";
  const sortOrder = paramsSnapshot.get("sortOrder") ?? "desc";
  const sortValue = `${sortBy}:${sortOrder}`;

  // Sync searchValue with URL query
  useEffect(() => {
    setSearchValue(urlQuery);
  }, [urlQuery]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(paramsSnapshot);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      next.set("page", "1");
      onUpdate?.();
      router.push(`${basePath}?${next.toString()}`);
    },
    [basePath, onUpdate, paramsSnapshot, router],
  );

  const toggleValue = (key: string, value: string) => {
    const current = parseCsvParam(paramsSnapshot.get(key));
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateParams({
      [key]: nextValues.length ? serializeCsvParam(nextValues) : null,
    });
  };

  const clearAll = () => {
    const next = new URLSearchParams(paramsSnapshot);
    [
      "query",
      "status",
      "type",
      "priority",
      "hasVotes",
      "hasReplies",
      "sortBy",
      "sortOrder",
    ].forEach((key) => next.delete(key));
    next.set("page", "1");
    setSearchValue("");
    router.push(`${basePath}?${next.toString()}`);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateParams({ query: value || null });
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    updateParams({ query: null });
  };

  const sortOptions = [
    { value: "createdAt:desc", label: t("list.sortNewest") },
    { value: "createdAt:asc", label: t("list.sortOldest") },
    { value: "voteCount:desc", label: t("list.sortMostVotes") },
    { value: "voteCount:asc", label: t("list.sortFewestVotes") },
  ];

  const filterGroups = [
    {
      key: "status",
      label: t("filters.statusLabel"),
      values: status,
      valueLabel: (value: string) =>
        t(`status.${value === "in-progress" ? "inProgress" : value}`),
    },
    {
      key: "type",
      label: t("filters.typeLabel"),
      values: type,
      valueLabel: (value: string) => t(`type.${value}`),
    },
    {
      key: "priority",
      label: t("filters.priorityLabel"),
      values: priority,
      valueLabel: (value: string) => t(`priority.${value}`),
    },
    {
      key: "hasVotes",
      label: t("list.hasVotes"),
      values: hasVotes,
      valueLabel: (value: string) =>
        value === "true" ? t("list.boolYes") : t("list.boolNo"),
    },
    {
      key: "hasReplies",
      label: t("list.hasReplies"),
      values: hasReplies,
      valueLabel: (value: string) =>
        value === "true" ? t("list.boolYes") : t("list.boolNo"),
    },
  ].filter((group) => group.values.length > 0);

  const hasActiveFilters = filterGroups.length > 0 || searchValue;

  return (
    <div className="space-y-3 rounded-2xl border bg-card px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input with Icon */}
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label={t("list.searchPlaceholder")}
            placeholder={t("list.searchPlaceholder")}
            value={searchValue}
            name="query"
            autoComplete="off"
            className="pl-9 pr-8"
            onChange={(event) => handleSearchChange(event.target.value)}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 h-6 w-6"
              onClick={handleClearSearch}
              aria-label={t("filters.clearAll")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label={t("filters.statusLabel")}
            icon={CircleDot}
            options={STATUS_OPTIONS.map((option) => ({
              ...option,
              label: t(`status.${option.value === "in-progress" ? "inProgress" : option.value}`),
            }))}
            values={status}
            onToggle={(value) => toggleValue("status", value)}
          />
          <FilterDropdown
            label={t("filters.typeLabel")}
            icon={ListFilter}
            options={TYPE_OPTIONS.map((option) => ({
              ...option,
              label: t(`type.${option.value}`),
            }))}
            values={type}
            onToggle={(value) => toggleValue("type", value)}
          />
          <FilterDropdown
            label={t("filters.priorityLabel")}
            icon={Flag}
            options={PRIORITY_OPTIONS.map((option) => ({
              ...option,
              label: t(`priority.${option.value}`),
            }))}
            values={priority}
            onToggle={(value) => toggleValue("priority", value)}
          />
          <FilterDropdown
            label={t("list.hasVotes")}
            icon={ThumbsUp}
            options={BOOL_OPTIONS}
            values={hasVotes}
            onToggle={(value) => toggleValue("hasVotes", value)}
          />
          <FilterDropdown
            label={t("list.hasReplies")}
            icon={MessageSquare}
            options={BOOL_OPTIONS}
            values={hasReplies}
            onToggle={(value) => toggleValue("hasReplies", value)}
          />

          <Select
            value={sortValue}
            onValueChange={(value) => {
              const [nextSortBy, nextSortOrder] = value.split(":");
              updateParams({
                sortBy: nextSortBy ?? "createdAt",
                sortOrder: nextSortOrder ?? "desc",
              });
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[110px] gap-1.5"
              aria-label={t("list.sortLabel")}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder={t("list.sortLabel")} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild size="sm">
            <Link href="/admin/feedback/new">
              <Plus className="mr-1 h-3.5 w-3.5" />
              {tCommon("create")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filterGroups.map((group) =>
            group.values.map((value) => (
              <Badge
                key={`${group.key}-${value}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-muted-foreground">{group.label}:</span>
                {group.valueLabel(value)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-transparent"
                  onClick={() => toggleValue(group.key, value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          )}
          {filterGroups.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{t("filters.logicHint")}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearAll}
              >
                {t("filters.clearAll")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
