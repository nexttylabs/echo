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

import { RoadmapCard } from "./roadmap-card";
import { cn } from "@/lib/utils";
import type { RoadmapStatus } from "./roadmap-board";

export interface RoadmapItem {
  id: number;
  title: string;
  category?: string;
  voteCount: number;
  status: RoadmapStatus;
}

interface RoadmapColumnProps {
  status: RoadmapStatus;
  label: string;
  items: RoadmapItem[];
  headerColor?: string;
  className?: string;
}

export function RoadmapColumn({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  status: _status,
  label,
  items,
  headerColor,
  className,
}: RoadmapColumnProps) {
  return (
    <div className={cn("flex flex-col min-h-[400px] rounded-xl border bg-background", className)}>
      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 rounded-t-xl border-b",
          headerColor
        )}
      >
        <h3 className="font-semibold text-sm">{label}</h3>
        <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 bg-muted/20 rounded-b-xl space-y-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No items
          </div>
        ) : (
          items.map((item) => (
            <RoadmapCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
