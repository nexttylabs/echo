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

import { RoadmapColumn, type RoadmapItem } from "./roadmap-column";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoadmapStatus = "backlog" | "next-up" | "in-progress" | "done";

interface RoadmapBoardProps {
  items: RoadmapItem[];
  isAdmin?: boolean;
  className?: string;
}

const columns: { status: RoadmapStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "bg-gray-100 dark:bg-gray-800" },
  { status: "next-up", label: "Next Up", color: "bg-blue-50 dark:bg-blue-950" },
  { status: "in-progress", label: "In Progress", color: "bg-amber-50 dark:bg-amber-950" },
  { status: "done", label: "Done", color: "bg-green-50 dark:bg-green-950" },
];

export function RoadmapBoard({
  items,
  isAdmin = false,
  className,
}: RoadmapBoardProps) {
  // Group items by status
  const groupedItems = columns.reduce(
    (acc, column) => {
      acc[column.status] = items.filter((item) => item.status === column.status);
      return acc;
    },
    {} as Record<RoadmapStatus, RoadmapItem[]>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <RoadmapColumn
            key={column.status}
            status={column.status}
            label={column.label}
            items={groupedItems[column.status]}
            headerColor={column.color}
          />
        ))}
      </div>

      {/* Admin Edit Button */}
      {isAdmin && (
        <Button
          variant="secondary"
          className="fixed bottom-6 right-6 shadow-lg gap-2 z-40"
        >
          <Edit className="h-4 w-4" />
          Edit Roadmap
        </Button>
      )}
    </div>
  );
}
