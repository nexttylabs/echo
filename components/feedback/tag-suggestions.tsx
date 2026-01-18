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

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSuggestion {
  name: string;
  slug: string;
  confidence: number;
  matchedKeywords: string[];
}

interface AppliedTag {
  tagId: number;
  name: string;
  slug: string;
  color: string | null;
}

interface TagSuggestionsProps {
  feedbackId: number;
  onTagsApplied?: () => void;
}

export function TagSuggestions({ feedbackId, onTagsApplied }: TagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [appliedTags, setAppliedTags] = useState<AppliedTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/suggest-tags`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setAppliedTags(data.applied || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function applyTags() {
    if (selectedTags.size === 0) return;

    setIsSaving(true);
    try {
      const tagIds: number[] = [];

      for (const slug of selectedTags) {
        const response = await fetch("/api/tags/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        if (response.ok) {
          const tag = await response.json();
          tagIds.push(tag.tagId);
        }
      }

      const existingTagIds = appliedTags.map((t) => t.tagId);
      const allTagIds = [...existingTagIds, ...tagIds];

      const applyResponse = await fetch(`/api/feedback/${feedbackId}/suggest-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: allTagIds }),
      });

      if (applyResponse.ok) {
        setSelectedTags(new Set());
        await loadSuggestions();
        onTagsApplied?.();
      }
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTag(slug: string) {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedTags(newSelected);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium">建议标签</h3>
        </div>
        {suggestions.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={applyTags}
            disabled={selectedTags.size === 0 || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            应用选中 ({selectedTags.size})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          暂无标签建议
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const isSelected = selectedTags.has(suggestion.slug);
            const confidencePercent = Math.round(suggestion.confidence * 100);

            return (
              <button
                key={suggestion.slug}
                type="button"
                onClick={() => toggleTag(suggestion.slug)}
                className={cn(
                  "group relative px-3 py-1.5 rounded-md border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{suggestion.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {confidencePercent}%
                  </span>
                </div>

                {suggestion.matchedKeywords.length > 0 && (
                  <div className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-2 px-2 py-1 bg-popover border rounded shadow-lg text-xs">
                    <div className="font-medium mb-1">匹配关键词:</div>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-muted rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {appliedTags.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">已应用标签</h4>
          <div className="flex flex-wrap gap-2">
            {appliedTags.map((tag) => (
              <Badge
                key={tag.tagId}
                variant="secondary"
                style={{
                  backgroundColor: tag.color || "#3b82f6",
                  color: "white",
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
