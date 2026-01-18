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

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoadmapItem } from "./roadmap-column";

interface RoadmapCardProps {
  item: RoadmapItem;
  className?: string;
}

export function RoadmapCard({ item, className }: RoadmapCardProps) {
  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement voting API call
  };

  return (
    <Link
      href={`/feedback/${item.id}`}
      className={cn(
        "group block rounded-lg border bg-card p-3 shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="space-y-2">
        {/* Title */}
        <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Category Tag */}
          {item.category && (
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
          )}

          {/* Vote Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={handleVote}
          >
            <ChevronUp className="h-3 w-3" />
            <span>{item.voteCount}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
