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

import { useId, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, Copy, FileText, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Attachment = {
  attachmentId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
};

type SubmittedByInfo = {
  id: string;
  name: string;
  email: string;
};

type CustomerInfo = {
  name: string;
  email: string;
  phone?: string;
};

type FeedbackDetailData = {
  feedbackId: number;
  title: string;
  description: string;
  type: "bug" | "feature" | "issue" | "other" | string;
  priority: "low" | "medium" | "high" | string;
  status: "new" | "in-progress" | "planned" | "completed" | "closed" | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  attachments?: Attachment[];
  submittedOnBehalf?: boolean;
  submittedByUser?: SubmittedByInfo | null;
  customerInfo?: CustomerInfo | null;
};

const TYPE_CLASSNAMES: Record<string, string> = {
  bug: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  feature: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  issue: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const PRIORITY_CLASSNAMES: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_CLASSNAMES: Record<string, string> = {
  "new": "border-blue-500 text-blue-700 dark:text-blue-300",
  "in-progress": "border-yellow-500 text-yellow-700 dark:text-yellow-300",
  planned: "border-purple-500 text-purple-700 dark:text-purple-300",
  completed: "border-green-500 text-green-700 dark:text-green-300",
  closed: "border-gray-500 text-gray-700 dark:text-gray-300",
};

export function FeedbackDetail({ feedback }: { feedback: FeedbackDetailData }) {
  const t = useTranslations("feedback.detail");
  const tf = useTranslations("feedback");
  const locale = useLocale();
  const shareInputId = useId();
  const [copied, setCopied] = useState(false);
  const [currentUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  });

  const typeClassName = TYPE_CLASSNAMES[feedback.type] ?? "bg-muted text-muted-foreground";
  const typeLabel = tf.has(`type.${feedback.type}`) ? tf(`type.${feedback.type}`) : feedback.type;
  const priorityClassName = PRIORITY_CLASSNAMES[feedback.priority] ?? "bg-muted text-muted-foreground";
  const priorityLabel = tf.has(`priority.${feedback.priority}`) ? tf(`priority.${feedback.priority}`) : feedback.priority;
  const statusClassName = STATUS_CLASSNAMES[feedback.status] ?? "border-muted-foreground text-muted-foreground";
  const statusLabel = tf.has(`status.${feedback.status}`) ? tf(`status.${feedback.status}`) : feedback.status;

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }), [locale]);

  const formatDate = (value: string | Date) => {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return dateFormatter.format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const attachmentCount = feedback.attachments?.length ?? 0;
  const showUpdated = useMemo(() => {
    const created = new Date(feedback.createdAt);
    const updated = new Date(feedback.updatedAt);
    return !Number.isNaN(created.getTime())
      && !Number.isNaN(updated.getTime())
      && created.getTime() !== updated.getTime();
  }, [feedback.createdAt, feedback.updatedAt]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{feedback.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("feedbackId", { id: feedback.feedbackId })}
          </p>
        </div>
        <Button type="button" variant="outline" size="icon" onClick={copyLink} aria-label={t("copyLinkAriaLabel")}>
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={typeClassName}>{typeLabel}</Badge>
        <Badge className={priorityClassName}>{t("priorityLabel", { priority: priorityLabel })}</Badge>
        <Badge variant="outline" className={cn("border", statusClassName)}>
          {statusLabel}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("descriptionTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {feedback.description}
          </p>
        </CardContent>
      </Card>

      {attachmentCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("attachmentsTitle", { count: attachmentCount })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedback.attachments?.map((attachment) => {
                const isImage = attachment.mimeType.startsWith("image/");
                return (
                  <a
                    key={attachment.attachmentId}
                    href={`/${attachment.filePath}`}
                    download={attachment.fileName}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      {isImage ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {feedback.submittedOnBehalf && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <span aria-hidden="true">📋</span>
              {t("onBehalf.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.submittedByUser && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("onBehalf.submitter")}</p>
                <p className="text-sm">
                  {feedback.submittedByUser.name || t("onBehalf.unknownUser")}
                </p>
              </div>
            )}
            {feedback.customerInfo && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("onBehalf.customerInfo")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("onBehalf.customerHidden")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("timeline.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium">{t("timeline.createdAt")}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(feedback.createdAt)}
                </p>
              </div>
            </div>
            {showUpdated && (
              <div className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-sm font-medium">{t("timeline.updatedAt")}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(feedback.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground mb-4">
            {t("shareHint")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={shareInputId} className="sr-only">
              {t("shareLinkLabel")}
            </label>
            <input
              id={shareInputId}
              type="text"
              readOnly
              value={currentUrl}
              name="shareLink"
              autoComplete="off"
              aria-label={t("shareLinkLabel")}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button type="button" onClick={copyLink} className="sm:w-32">
              {copied ? t("copied") : t("copyLink")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
