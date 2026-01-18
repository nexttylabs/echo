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

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  feedbackId: number;
  initialVoteCount: number;
  initialHasVoted?: boolean;
  canVote?: boolean;
  className?: string;
  onVoteChange?: (hasVoted: boolean, newCount: number) => void;
}

export function VoteButton({
  feedbackId,
  initialVoteCount,
  initialHasVoted = false,
  canVote = true,
  className,
  onVoteChange,
}: VoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("feedback");

  useEffect(() => {
    setVoteCount(initialVoteCount);
  }, [initialVoteCount]);

  useEffect(() => {
    setHasVoted(initialHasVoted);
  }, [initialHasVoted]);

  const handleVote = useCallback(async () => {
    if (!canVote || isLoading) return;

    setIsLoading(true);
    const optimisticVoted = !hasVoted;
    const optimisticCount = optimisticVoted ? voteCount + 1 : voteCount - 1;

    setHasVoted(optimisticVoted);
    setVoteCount(optimisticCount);
    onVoteChange?.(optimisticVoted, optimisticCount);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}/vote`, {
        method: optimisticVoted ? "POST" : "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();

        setHasVoted(hasVoted);
        setVoteCount(voteCount);
        onVoteChange?.(hasVoted, voteCount);

        if (error.code === "ALREADY_VOTED") {
          setHasVoted(true);
          onVoteChange?.(true, voteCount);
        }

        throw new Error(error.error || "Failed to update vote");
      }
    } catch (error) {
      console.error("Error updating vote:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canVote, isLoading, hasVoted, voteCount, feedbackId, onVoteChange]);

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={!canVote || isLoading}
      className={cn(
        "gap-2 transition-all",
        hasVoted && "bg-indigo-600 text-white hover:bg-indigo-700",
        className,
      )}
    >
      <ThumbsUp className={cn("w-4 h-4", hasVoted && "fill-current")} />
      <span>{voteCount}</span>
      <span className="hidden sm:inline">
        {hasVoted ? t("vote.voted") : t("vote.vote")}
      </span>
    </Button>
  );
}
