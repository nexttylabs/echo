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

import {
  findDuplicates,
  type DuplicateCandidate,
  type FeedbackForDuplicateCheck,
} from "@/lib/services/ai/duplicate-detector";

export type SimilarFeedback = DuplicateCandidate;

/**
 * Build a list of similar feedbacks based on title and description.
 * Reuses the duplicate detection algorithm.
 */
export function buildSimilarResponse(
  title: string,
  description: string,
  existingFeedbacks: Array<{
    feedbackId: number;
    title: string;
    description?: string | null;
  }>,
  threshold: number = 0.3
): SimilarFeedback[] {
  const feedbacks: FeedbackForDuplicateCheck[] = existingFeedbacks.map(
    (item) => ({
      feedbackId: item.feedbackId,
      title: item.title,
      description: item.description ?? null,
    })
  );

  return findDuplicates(title, description, feedbacks, undefined, threshold);
}
