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
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type FeedbackStatus,
  STATUS_COLORS,
} from "@/lib/validations/feedback";
import { useTranslations } from "next-intl";

interface StatusSelectorProps {
  feedbackId: number;
  currentStatus: FeedbackStatus;
  canEdit: boolean;
  className?: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: FeedbackStatus[] = [
  "new",
  "in-progress",
  "planned",
  "completed",
  "closed",
];

export function StatusSelector({
  feedbackId,
  currentStatus,
  canEdit,
  className,
  onSuccess,
}: StatusSelectorProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("feedback");

  const handleStatusChange = async (newStatus: string) => {
    if (!canEdit || newStatus === status) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      setStatus(newStatus as FeedbackStatus);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err instanceof Error ? err.message : t("status.updateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canEdit) {
    const statusKey = status === "in-progress" ? "inProgress" : status;
    return (
      <span
        className={cn(
          "px-3 py-1 rounded-full text-sm font-medium inline-block",
          STATUS_COLORS[status],
          className,
        )}
      >
        {t(`status.${statusKey}`)}
      </span>
    );
  }

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger
          className={cn(
            "h-7 w-auto min-w-[120px] rounded-full border-0 px-3 text-sm font-medium transition-colors",
            STATUS_COLORS[status],
            isUpdating && "opacity-50 cursor-not-allowed",
          )}
        >
          {isUpdating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("status.updating")}</span>
            </div>
          ) : (
            <span>
              {t(`status.${status === "in-progress" ? "inProgress" : status}`)}
            </span>
          )}
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {STATUS_OPTIONS.map((statusOption) => {
            const labelKey = statusOption === "in-progress" ? "inProgress" : statusOption;
            return (
              <SelectItem key={statusOption} value={statusOption}>
                {t(`status.${labelKey}`)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
