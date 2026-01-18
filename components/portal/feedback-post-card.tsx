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

import { useState, useCallback } from "react";
import Link from "next/link";
import { MessageCircle, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FeedbackPost {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  author?: {
    name: string;
    image?: string | null;
  } | null;
}

interface FeedbackPostCardProps {
  post: FeedbackPost;
  organizationSlug: string;
  organizationId: string;
  showVoteCount?: boolean;
  showAuthor?: boolean;
  allowPublicVoting?: boolean;
  className?: string;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "in-progress": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  planned: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const typeLabels: Record<string, string> = {
  bug: "Bug",
  feature: "Feature",
  issue: "Issue",
  other: "Other",
};

export function FeedbackPostCard({
  post,
  organizationSlug,
  organizationId,
  showVoteCount = true,
  showAuthor = false,
  allowPublicVoting = true,
  className,
}: FeedbackPostCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(post.voteCount);
  const [isLoading, setIsLoading] = useState(false);

  const statusColor = statusColors[post.status] ?? statusColors.open;
  const typeLabel = typeLabels[post.type] ?? post.type;

  const handleVote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    const optimisticVoted = !hasVoted;
    const optimisticCount = optimisticVoted ? voteCount + 1 : voteCount - 1;

    // Optimistic update
    setHasVoted(optimisticVoted);
    setVoteCount(optimisticCount);

    try {
      const response = await fetch(`/api/feedback/${post.id}/vote`, {
        method: optimisticVoted ? "POST" : "DELETE",
        headers: {
          "x-organization-id": organizationId,
        },
      });

      if (!response.ok) {
        // Rollback on error
        setHasVoted(hasVoted);
        setVoteCount(voteCount);

        const error = await response.json();
        if (error.code === "ALREADY_VOTED") {
          // Sync state if already voted
          setHasVoted(true);
        }
      }
    } catch (error) {
      // Rollback on error
      setHasVoted(hasVoted);
      setVoteCount(voteCount);
      console.error("Error updating vote:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasVoted, voteCount, isLoading, post.id, organizationId]);

  return (
    <Link
      href={`/${organizationSlug}/feedback/${post.id}`}
      className={cn(
        "group block rounded-xl border bg-card p-4 shadow-sm transition-all",
        "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex gap-4">
        {/* Vote Button */}
        {(showVoteCount || allowPublicVoting) && (
          <div className="flex flex-col items-center">
            <Button
              variant={hasVoted ? "default" : "outline"}
              size="sm"
              disabled={isLoading || !allowPublicVoting}
              className={cn(
                "h-auto flex-col gap-0.5 px-3 py-2 transition-all",
                hasVoted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                !allowPublicVoting && "cursor-default opacity-70"
              )}
              onClick={allowPublicVoting ? handleVote : undefined}
            >
              <ChevronUp className={cn("h-4 w-4", hasVoted && "fill-current")} />
              {showVoteCount && <span className="text-sm font-semibold">{voteCount}</span>}
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {post.title}
            </h3>
            <Badge variant="outline" className={cn("text-xs", statusColor)}>
              {post.status.replace("-", " ")}
            </Badge>
          </div>

          {post.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-muted">
              {typeLabel}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.commentCount}
            </span>
            {showAuthor && post.author && (
              <span>by {post.author.name}</span>
            )}
            <span>
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
