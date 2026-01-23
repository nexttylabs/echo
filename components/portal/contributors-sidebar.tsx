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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface Contributor {
  id: string;
  name: string;
  image?: string | null;
  points: number;
}

interface ContributorsSidebarProps {
  contributors: Contributor[];
  className?: string;
}

export function ContributorsSidebar({
  contributors,
  className,
}: ContributorsSidebarProps) {
  const t = useTranslations("portal.contributors");
  return (
    <Card className={cn("sticky top-24", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t("mostHelpful")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contributors.slice(0, 10).map((contributor, index) => (
          <div
            key={contributor.id}
            className="flex items-center gap-3"
          >
            <span className="w-5 text-center text-sm font-medium text-muted-foreground">
              {index + 1}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={contributor.image ?? undefined}
                alt={contributor.name}
              />
              <AvatarFallback className="text-xs">
                {contributor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{contributor.name}</p>
            </div>
            <span className="text-sm font-semibold text-primary">
              {contributor.points}
            </span>
          </div>
        ))}

        {contributors.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No contributors yet
          </p>
        )}
      </CardContent>

      {/* Powered by badge */}
      <div className="px-6 pb-4">
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Powered by{" "}
            <span className="font-semibold text-foreground">Echo</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
