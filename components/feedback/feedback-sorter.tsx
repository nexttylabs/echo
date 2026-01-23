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

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackSorterProps {
  className?: string;
}

type SortField = "createdAt" | "updatedAt" | "voteCount" | "priority" | "title";
type SortOrder = "asc" | "desc";

const SORT_OPTIONS = [
  { value: "createdAt", label: "创建时间" },
  { value: "updatedAt", label: "更新时间" },
  { value: "voteCount", label: "投票数" },
  { value: "priority", label: "优先级" },
  { value: "title", label: "标题" },
];

export function FeedbackSorter({ className }: FeedbackSorterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get("sortBy") as SortField) || "createdAt";
  const currentOrder = (searchParams.get("sortOrder") as SortOrder) || "desc";

  const updateSort = (field: SortField) => {
    const params = new URLSearchParams(searchParams);

    if (currentSort === field) {
      const newOrder = currentOrder === "desc" ? "asc" : "desc";
      params.set("sortBy", field);
      params.set("sortOrder", newOrder);
    } else {
      params.set("sortBy", field);
      params.set("sortOrder", "desc");
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleOrder = () => {
    const params = new URLSearchParams(searchParams);
    const newOrder = currentOrder === "desc" ? "asc" : "desc";
    params.set("sortOrder", newOrder);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">排序：</span>

        <Select
          value={currentSort}
          onValueChange={(value) => updateSort(value as SortField)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="选择排序字段" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleOrder}
        className="shrink-0"
        aria-label={`切换排序方向（当前：${currentOrder === "desc" ? "降序" : "升序"}）`}
      >
        {currentOrder === "asc" ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
