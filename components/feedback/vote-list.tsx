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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow, type Locale } from "date-fns";
import { enUS, ja, zhCN } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

interface Vote {
  voteId: number;
  visitorId: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
}

interface VoteListProps {
  votes: Vote[];
  className?: string;
}

export function VoteList({ votes, className }: VoteListProps) {
  const t = useTranslations("feedback");
  const locale = useLocale();

  const localeMap: Record<string, Locale> = {
    en: enUS,
    "zh-CN": zhCN,
    jp: ja,
  };
  const dateLocale = localeMap[locale] ?? enUS;

  if (votes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        {t("vote.noVotes")}
      </div>
    );
  }

  const getInitials = (name: string | null, email: string | null) => {
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

  const getDisplayName = (vote: Vote) => {
    if (vote.userName) return vote.userName;
    if (vote.userEmail) return vote.userEmail;
    if (vote.visitorId) return `${t("vote.visitor")} ${vote.visitorId.slice(0, 8)}`;
    return t("vote.anonymous");
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {votes.map((vote) => (
          <div key={vote.voteId} className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {getInitials(vote.userName, vote.userEmail)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-medium text-sm">
                {getDisplayName(vote)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(vote.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
