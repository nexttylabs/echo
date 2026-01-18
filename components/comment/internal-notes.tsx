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

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS, ja, type Locale } from "date-fns/locale";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommentForm } from "./comment-form";

interface Comment {
  commentId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    userId: string;
    name: string | null;
    email: string;
  };
}

interface InternalNotesProps {
  feedbackId: number;
  canDelete: boolean;
  currentUserId: string;
  className?: string;
}

const DATE_LOCALES: Record<string, Locale> = {
  "zh-CN": zhCN,
  "en": enUS,
  "jp": ja,
};

export function InternalNotes({
  feedbackId,
  canDelete,
  currentUserId,
  className,
}: InternalNotesProps) {
  const t = useTranslations("comments.internal");
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const [internalComments, setInternalComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const result = await response.json();
      setInternalComments(result.data.internal || []);
    } catch {
      setError(t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [feedbackId, t]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (content: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal: true }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      await fetchComments();
    } catch {
      setError(t("errors.addFailed"));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/comments/${commentId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to delete comment");

      setInternalComments(
        internalComments.filter((c) => c.commentId !== commentId),
      );
    } catch {
      setError(t("errors.deleteFailed"));
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <Card className={className} data-testid="internal-notes">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
          {t("title")}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({internalComments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentForm
          onSubmit={handleAddComment}
          label={t("formLabel")}
          placeholder={t("placeholder")}
          buttonText={t("submit")}
          submittingText={t("submitting")}
        />

        {error && (
          <div className="text-sm text-destructive text-center py-2" aria-live="polite">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : internalComments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p>{t("empty")}</p>
            <p className="text-sm">{t("beFirst")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {internalComments.map((comment) => (
              <div key={comment.commentId} className="flex gap-3 group">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                    {getInitials(comment.author.name, comment.author.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.author.name || comment.author.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>

                    {(canDelete || comment.author.userId === currentUserId) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDeleteComment(comment.commentId)}
                        aria-label={t("deleteAriaLabel")}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
