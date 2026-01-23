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

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox } from "lucide-react";

interface FeedbackItem {
  feedbackId: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: Date;
}

interface RecentFeedbackListProps {
  feedback: FeedbackItem[];
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
};

export function RecentFeedbackList({ feedback }: RecentFeedbackListProps) {
  const t = useTranslations("dashboard.recentFeedback");
  const tFeedback = useTranslations("feedback");
  const tCommon = useTranslations("common");

  const getStatusLabel = (status: string) => {
    const key = status === "in_progress" ? "inProgress" : status;
    return tFeedback(`status.${key}`) || status;
  };

  const getTypeLabel = (type: string) => {
    return tFeedback(`type.${type}`) || type;
  };

  const getPriorityLabel = (priority: string) => {
    return tFeedback(`priority.${priority}`) || priority;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${month} ${day}, ${hour12}:${minutes} ${ampm}`;
  };

  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("noData")}</p>
            <Button asChild>
              <Link href="/admin/feedback/new">{tCommon("submitFirst")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/feedback">
            {tCommon("viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback.map((item) => (
            <Link
              key={item.feedbackId}
              href={`/admin/feedback/${item.feedbackId}`}
              className="block"
            >
              <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getTypeLabel(item.type)}</span>
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge
                    variant="secondary"
                    className={priorityColors[item.priority] || ""}
                  >
                    {getPriorityLabel(item.priority)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={statusColors[item.status] || ""}
                  >
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
