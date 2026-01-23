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

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChangelogItem {
  id: string;
  title: string;
  content: string;
  type: "feature" | "improvement" | "fix" | "announcement";
  publishedAt: string;
  image?: string | null;
  author?: {
    name: string;
    image?: string | null;
  } | null;
}

interface ChangelogEntryProps {
  entry: ChangelogItem;
  className?: string;
}

const typeConfig: Record<
  ChangelogItem["type"],
  { label: string; className: string }
> = {
  feature: {
    label: "New Feature",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  improvement: {
    label: "Improvement",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  fix: {
    label: "Bug Fix",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  announcement: {
    label: "Announcement",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
};

export function ChangelogEntry({ entry, className }: ChangelogEntryProps) {
  const typeInfo = typeConfig[entry.type];

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Image */}
      {entry.image && (
        <div className="relative aspect-video bg-muted">
          <Image
            src={entry.image}
            alt={entry.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <CardHeader className="space-y-2">
        {/* Date and Type */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <time
            dateTime={entry.publishedAt}
            className="text-muted-foreground"
          >
            {new Date(entry.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <Badge variant="secondary" className={cn("text-xs", typeInfo.className)}>
            {typeInfo.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold tracking-tight">{entry.title}</h3>
      </CardHeader>

      <CardContent>
        {/* Content */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* Author */}
        {entry.author && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {entry.author.image && (
              <Image
                src={entry.author.image}
                alt={entry.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-muted-foreground">
              Posted by {entry.author.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
