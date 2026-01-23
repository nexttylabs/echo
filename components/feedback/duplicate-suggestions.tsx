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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check, X } from "lucide-react";

interface DuplicateCandidate {
  feedbackId: number;
  title: string;
  description: string;
  similarity: number;
  reasons: string[];
}

interface DuplicateSuggestionsProps {
  feedbackId: number;
  onDismiss?: () => void;
}

export function DuplicateSuggestions({
  feedbackId,
  onDismiss,
}: DuplicateSuggestionsProps) {
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);

  const loadDuplicates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/duplicates`);
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data.suggestions || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    loadDuplicates();
  }, [loadDuplicates]);

  async function confirmDuplicate(duplicateId: number, confirmed: boolean) {
    setConfirming(duplicateId);
    try {
      await fetch(`/api/feedback/${feedbackId}/duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duplicateFeedbackId: duplicateId,
          status: confirmed ? "confirmed" : "rejected",
        }),
      });

      setDuplicates((prev) => prev.filter((d) => d.feedbackId !== duplicateId));

      if (duplicates.length === 1 && onDismiss) {
        onDismiss();
      }
    } finally {
      setConfirming(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
          <CardTitle className="text-orange-900 dark:text-orange-100">
            发现潜在重复反馈
          </CardTitle>
        </div>
        <CardDescription>
          此反馈可能与现有反馈重复，请在继续前进行审核。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicates.map((duplicate) => (
          <div
            key={duplicate.feedbackId}
            className="p-4 bg-background rounded-lg border space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600 dark:text-orange-400 dark:border-orange-400"
                  >
                    {duplicate.similarity}% 相似
                  </Badge>
                  <Link
                    href={`/feedback/${duplicate.feedbackId}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    查看原始反馈 →
                  </Link>
                </div>
                <h4 className="font-medium truncate">{duplicate.title}</h4>
                {duplicate.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {duplicate.description}
                  </p>
                )}
                {duplicate.reasons.length > 0 && (
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    {duplicate.reasons.map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmDuplicate(duplicate.feedbackId, false)}
                  disabled={confirming === duplicate.feedbackId}
                >
                  <X className="h-4 w-4 mr-1" />
                  非重复
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => confirmDuplicate(duplicate.feedbackId, true)}
                  disabled={confirming === duplicate.feedbackId}
                >
                  {confirming === duplicate.feedbackId ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  标记为重复
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
