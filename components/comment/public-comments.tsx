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

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS, ja, type Locale } from "date-fns/locale";
import { MessageSquare, Loader2, User as UserIcon, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CommentForm } from "./comment-form";
import Link from "next/link";

interface Comment {
  commentId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    type: "user" | "guest";
    userId?: string;
    name: string | null;
    email?: string | null;
  };
}

interface PublicCommentsProps {
  feedbackId: number;
  isAuthenticated: boolean;
  organizationId?: string;
  allowPublicComments?: boolean;
  className?: string;
}

const DATE_LOCALES: Record<string, Locale> = {
  "zh-CN": zhCN,
  "en": enUS,
  "jp": ja,
};

export function PublicComments({
  feedbackId,
  isAuthenticated,
  organizationId,
  allowPublicComments = false,
  className,
}: PublicCommentsProps) {
  const t = useTranslations("comments.public");
  const locale = useLocale();
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`, {
        headers: organizationId
          ? { "x-organization-id": organizationId }
          : undefined,
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const result = await response.json();
      setComments(result.data.public || []);
    } catch {
      setError(t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [feedbackId, organizationId, t]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (content: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: organizationId
          ? { "Content-Type": "application/json", "x-organization-id": organizationId }
          : { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal: false }),
      });

      if (!response.ok) throw new Error("Failed to add comment");
      await fetchComments();
    } catch {
      setError(t("errors.submitFailed"));
    }
  };

  const handleAddGuestComment = async (
    content: string,
    guestInfo: { name: string; email: string },
  ) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: "POST",
        headers: organizationId
          ? { "Content-Type": "application/json", "x-organization-id": organizationId }
          : { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          authorName: guestInfo.name,
          authorEmail: guestInfo.email,
        }),
      });

      if (!response.ok) throw new Error("Failed to add comment");
      await fetchComments();
      setShowGuestForm(false);
    } catch {
      setError(t("errors.submitFailed"));
    }
  };

  const getInitials = (name: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" aria-hidden="true" />
          {t("title")}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({comments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          allowPublicComments ? (
            showGuestForm ? (
              <GuestCommentForm
                onSubmit={handleAddGuestComment}
                onCancel={() => setShowGuestForm(false)}
              />
            ) : (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <UserIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
                <p className="mb-4 text-muted-foreground">
                  {t("loginPrompt")}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t("login")}
                    </Link>
                  </Button>
                  <Button onClick={() => setShowGuestForm(true)}>{t("guestComment")}</Button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-6 border-2 border-dashed rounded-lg">
              <LogIn className="w-12 h-12 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="mb-4 text-muted-foreground">
                {t("loginRequired")}
              </p>
              <Button variant="outline" asChild>
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t("login")}
                </Link>
              </Button>
            </div>
          )
        ) : (
          <CommentForm
            onSubmit={handleAddComment}
            label={t("formLabel")}
            placeholder={t("placeholder")}
            buttonText={t("submit")}
            submittingText={t("submitting")}
          />
        )}

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
        ) : comments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p>{t("empty")}</p>
            <p className="text-sm">{t("beFirst")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.commentId} className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs bg-green-100 text-green-800">
                    {getInitials(comment.author.name, comment.author.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.name || t("anonymous")}
                    </span>
                    {comment.author.type === "guest" && (
                      <span className="text-xs text-muted-foreground">
                        ({t("guest")})
                      </span>
                    )}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GuestCommentFormProps {
  onSubmit: (
    content: string,
    guest: { name: string; email: string },
  ) => void | Promise<void>;
  onCancel: () => void;
}

function GuestCommentForm({ onSubmit, onCancel }: GuestCommentFormProps) {
  const t = useTranslations("comments.public.guestForm");
  const nameId = "guest-comment-name";
  const emailId = "guest-comment-email";
  const contentId = "guest-comment-content";
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim() || !email.trim() || isSubmitting)
      return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), {
        name: name.trim(),
        email: email.trim(),
      });
      setContent("");
      setName("");
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
      <h4 className="font-medium">{t("title")}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={nameId} className="sr-only">
            {t("nameLabel")}
          </label>
          <Input
            id={nameId}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={emailId} className="sr-only">
            {t("emailLabel")}
          </label>
          <Input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>
      <label htmlFor={contentId} className="sr-only">
        {t("contentLabel")}
      </label>
      <Textarea
        id={contentId}
        name="content"
        autoComplete="off"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("contentPlaceholder")}
        rows={3}
        className="resize-none"
        required
        disabled={isSubmitting}
      />
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={!content || !name || !email || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </div>
    </form>
  );
}
