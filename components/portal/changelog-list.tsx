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

import { ChangelogEntry, type ChangelogItem } from "./changelog-entry";
import { cn } from "@/lib/utils";

interface ChangelogListProps {
  entries: ChangelogItem[];
  className?: string;
}

export function ChangelogList({ entries, className }: ChangelogListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-muted-foreground">
          No updates yet
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Check back later for product updates and announcements.
        </p>
      </div>
    );
  }

  // Group entries by month/year
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const date = new Date(entry.publishedAt);
      const key = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, ChangelogItem[]>
  );

  return (
    <div className={cn("max-w-3xl mx-auto space-y-12", className)}>
      {Object.entries(groupedEntries).map(([month, monthEntries], index) => (
        <div
          key={month}
          className={cn(
            "pt-8 border-t border-border",
            index === 0 && "pt-0 border-0"
          )}
        >
          {/* Month Header */}
          <h2 className="text-lg font-semibold text-muted-foreground mb-6 sticky top-20 bg-background/95 py-2 backdrop-blur">
            {month}
          </h2>

          {/* Entries */}
          <div className="space-y-8">
            {monthEntries.map((entry) => (
              <ChangelogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
