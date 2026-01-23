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

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/validations/feedback";

interface StatusHistoryEntry {
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
}

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  className?: string;
}

export function StatusHistory({ history, className }: StatusHistoryProps) {
  if (history.length === 0) {
    return null;
  }

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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          状态历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.historyId} className="flex gap-4">
              <div className="relative shrink-0">
                <Avatar className="w-10 h-10 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {entry.changedBy
                      ? getInitials(entry.changedBy.name, entry.changedBy.email)
                      : "SYS"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {entry.changedBy?.name || entry.changedBy?.email || "System"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.changedAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={cn(
                      "text-xs",
                      STATUS_COLORS[entry.oldStatus as keyof typeof STATUS_COLORS],
                    )}
                  >
                    {STATUS_LABELS[entry.oldStatus as keyof typeof STATUS_LABELS] ??
                      entry.oldStatus}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge
                    className={cn(
                      "text-xs",
                      STATUS_COLORS[entry.newStatus as keyof typeof STATUS_COLORS],
                    )}
                  >
                    {STATUS_LABELS[entry.newStatus as keyof typeof STATUS_LABELS] ??
                      entry.newStatus}
                  </Badge>
                </div>

                {entry.comment && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    &quot;{entry.comment}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
