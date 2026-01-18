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

import { formatDistanceToNow, type Locale } from "date-fns";
import { enUS, ja, zhCN } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AttachmentList } from "@/components/feedback/attachment-list";
import { VoteList } from "@/components/feedback/vote-list";
import { VoteButton } from "@/components/feedback/vote-button";
import { FeedbackActions } from "@/components/feedback/feedback-actions";
import { StatusSelector } from "@/components/feedback/status-selector";
import { StatusHistory } from "@/components/feedback/status-history";
import type { FeedbackStatus } from "@/lib/validations/feedback";

interface FeedbackDetailViewProps {
  feedback: {
    feedbackId: number;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    submittedOnBehalf: boolean;
    customerInfo?: {
      name: string;
      email: string;
      phone?: string;
    } | null;
    attachments: Array<{
      attachmentId: number;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      createdAt: string;
    }>;
    votes: {
      count: number;
      list: Array<{
        voteId: number;
        visitorId: string | null;
        userId: string | null;
        userName: string | null;
        userEmail: string | null;
        createdAt: string;
      }>;
      userVote: {
        hasVoted: boolean;
        voteId: number | null;
      };
    };
    statusHistory?: Array<{
      historyId: number;
      oldStatus: string;
      newStatus: string;
      changedBy: {
        id: string;
        name: string | null;
        email: string;
      } | null;
      changedAt: string;
      comment: string | null;
    }>;
  };
  canEdit: boolean;
  canDelete: boolean;
  canUpdateStatus: boolean;
  children?: React.ReactNode;
}

const TYPE_ICONS: Record<string, string> = {
  bug: "🐛",
  feature: "💡",
  issue: "⚠️",
  other: "📝",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function FeedbackDetailView({
  feedback,
  canEdit,
  canDelete,
  canUpdateStatus,
  children,
}: FeedbackDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("feedback");
  const locale = useLocale();

  const handleBack = () => {
    router.push("/admin/feedback");
  };

  const localeMap: Record<string, Locale> = {
    en: enUS,
    "zh-CN": zhCN,
    jp: ja,
  };
  const dateLocale = localeMap[locale] ?? enUS;
  const typeLabel = t(`type.${feedback.type}`);

  return (
    <div className="space-y-6">
      {/* Header: Back button + Title */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label={t("detail.backToList")}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">
              {TYPE_ICONS[feedback.type] ?? "📝"}
            </span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{feedback.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <VoteButton
            feedbackId={feedback.feedbackId}
            initialVoteCount={feedback.votes.count}
            initialHasVoted={feedback.votes.userVote.hasVoted}
            canVote={true}
          />
          <FeedbackActions
            feedbackId={feedback.feedbackId}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>

      {/* Status and badges row - separate from header to avoid overflow issues */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusSelector
          feedbackId={feedback.feedbackId}
          currentStatus={feedback.status as FeedbackStatus}
          canEdit={canUpdateStatus}
        />
        <Badge className={PRIORITY_COLORS[feedback.priority] ?? "bg-gray-100 text-gray-800"}>
          {t(`priority.${feedback.priority}`)}
        </Badge>
        <Badge variant="outline">{typeLabel ?? feedback.type}</Badge>
      </div>

      {/* Two-column layout: Main content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("detail.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
                {feedback.description}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {feedback.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("detail.attachments")} ({feedback.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentList attachments={feedback.attachments} />
              </CardContent>
            </Card>
          )}

          {/* Comments section passed as children */}
          {children}
        </div>

        {/* Sidebar (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Meta info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("detail.info") || "信息"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("detail.feedbackIdLabel")}
                  </span>
                  <p className="font-medium">#{feedback.feedbackId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("detail.votes")}
                  </span>
                  <p className="font-medium">{feedback.votes.count}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("detail.createdAt")}
                  </span>
                  <p className="font-medium text-sm">
                    {formatDistanceToNow(new Date(feedback.createdAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">
                    {t("detail.updatedAt")}
                  </span>
                  <p className="font-medium text-sm">
                    {formatDistanceToNow(new Date(feedback.updatedAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              </div>

              {/* Customer info */}
              {feedback.submittedOnBehalf && feedback.customerInfo && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("detail.customerInfo")}
                    </span>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {t("detail.customerName")}：
                        </span>
                        {feedback.customerInfo.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">
                          {t("detail.customerEmail")}：
                        </span>
                        {feedback.customerInfo.email}
                      </p>
                      {feedback.customerInfo.phone && (
                        <p className="text-sm">
                          <span className="font-medium">
                            {t("detail.customerPhone")}：
                          </span>
                          {feedback.customerInfo.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Vote history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-indigo-600" />
                {t("detail.voteHistory")} ({feedback.votes.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoteList votes={feedback.votes.list} />
            </CardContent>
          </Card>

          {/* Status history */}
          {feedback.statusHistory && feedback.statusHistory.length > 0 && (
            <StatusHistory history={feedback.statusHistory} />
          )}
        </div>
      </div>
    </div>
  );
}
