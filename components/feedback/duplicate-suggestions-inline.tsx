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

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SimilarFeedback {
  feedbackId: number;
  title: string;
  similarity: number;
}

interface DuplicateSuggestionsInlineProps {
  query: string;
  organizationId?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * Inline duplicate suggestions component that appears below the title input.
 * Fetches similar feedbacks from the API and displays them as clickable links.
 */
export function DuplicateSuggestionsInline({
  query,
  organizationId,
  className,
  debounceMs = 300,
}: DuplicateSuggestionsInlineProps) {
  const [suggestions, setSuggestions] = useState<SimilarFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ title: searchQuery });
        if (organizationId) {
          params.set("organizationId", organizationId);
        }

        const response = await fetch(`/api/feedback/similar?${params}`, {
          signal: controller.signal,
          headers: organizationId
            ? { "x-organization-id": organizationId }
            : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to fetch suggestions:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    // Debounce the fetch
    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-2 rounded-md border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-800 dark:bg-orange-950/20",
        className
      )}
    >
      <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-2">
        {isLoading ? "正在查找相似反馈..." : "可能存在相似反馈:"}
      </p>
      {!isLoading && (
        <ul className="space-y-1">
          {suggestions.map((item) => (
            <li key={item.feedbackId} className="text-sm">
              <Link
                href={`/feedback/${item.feedbackId}`}
                target="_blank"
                className="text-orange-600 hover:text-orange-800 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
              >
                {item.title}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                ({item.similarity}% 相似)
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
