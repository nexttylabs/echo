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

import { PREDEFINED_TAGS } from "@/lib/db/schema/tags";

export interface TagSuggestion {
  name: string;
  slug: string;
  confidence: number;
  matchedKeywords: string[];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateTagScore(
  text: string,
  tag: (typeof PREDEFINED_TAGS)[number],
): {
  score: number;
  matchedKeywords: string[];
} {
  const normalized = normalizeText(text);
  const words = normalized.split(" ");

  let score = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of tag.keywords) {
    const normalizedKeyword = keyword.toLowerCase();

    if (normalized.includes(normalizedKeyword)) {
      score += 3;
      matchedKeywords.push(keyword);
    }

    for (const word of words) {
      if (
        word === normalizedKeyword ||
        word.includes(normalizedKeyword) ||
        normalizedKeyword.includes(word)
      ) {
        score += 1;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }
  }

  return { score, matchedKeywords };
}

export function suggestTags(
  title: string,
  description?: string,
  maxSuggestions: number = 5,
): TagSuggestion[] {
  const text = `${title} ${description || ""}`;

  const tagScores = PREDEFINED_TAGS.map((tag) => {
    const { score, matchedKeywords } = calculateTagScore(text, tag);
    return {
      name: tag.name,
      slug: tag.slug,
      confidence: Math.min(score / 5, 1),
      matchedKeywords,
    };
  });

  const filtered = tagScores.filter((tag) => tag.confidence > 0);

  return filtered
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
}

export async function batchSuggestTags(
  feedbacks: Array<{
    feedbackId: string;
    title: string;
    description?: string;
  }>,
): Promise<Array<{ feedbackId: string; suggestions: TagSuggestion[] }>> {
  return feedbacks.map((feedback) => ({
    feedbackId: feedback.feedbackId,
    suggestions: suggestTags(feedback.title, feedback.description),
  }));
}
