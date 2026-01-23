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

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Bot } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProcessingResult {
  classification?: {
    type: string;
    priority: string;
    confidence: number;
    reasons: string[];
  };
  tagSuggestions?: Array<{
    name: string;
    slug: string;
    confidence: number;
  }>;
  duplicateCandidates?: Array<{
    feedbackId: number;
    similarity: number;
  }>;
  processingTime?: number;
  status: string;
  errorMessage?: string;
}

interface ProcessingStatusProps {
  feedbackId: number;
  onCompleted?: (result: ProcessingResult) => void;
}

export default function ProcessingStatus({
  feedbackId,
  onCompleted,
}: ProcessingStatusProps) {
  const t = useTranslations("processing");
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/processing-status`,
      );
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);

        if (data.status === "completed" && data.result) {
          setResult(data.result);
          onCompleted?.(data.result);
        }
      }
    } catch (error) {
      console.error("Failed to check processing status:", error);
    }
  }, [feedbackId, onCompleted]);

  useEffect(() => {
    if (status !== "completed" && status !== "failed") {
      const interval = setInterval(checkStatus, 2000);
      checkStatus();
      return () => clearInterval(interval);
    }
  }, [status, checkStatus]);

  async function retry() {
    setIsRetrying(true);
    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/processing-status`,
        { method: "POST" },
      );
      if (response.ok) {
        setStatus("pending");
        setResult(null);
      }
    } finally {
      setIsRetrying(false);
    }
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("queued")}</span>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <Bot className="h-4 w-4 animate-pulse" />
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("inProgress")}</span>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>{t("completed")}</span>
        {result?.processingTime && (
          <span className="text-muted-foreground">
            ({result.processingTime}ms)
          </span>
        )}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        <span>{t("failed")}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2"
          onClick={retry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {isRetrying ? t("retrying") : t("retry")}
        </Button>
      </div>
    );
  }

  return null;
}
