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

import { feedbackTypeEnum, priorityEnum } from "@/lib/validators/feedback";

export type FeedbackPrefill = Partial<{
  title: string;
  description: string;
  type: "bug" | "feature" | "issue" | "other";
  priority: "low" | "medium" | "high";
}>;

/**
 * Parse URL search params into feedback prefill values.
 * Only known fields are included, and enum values are validated.
 */
export function parseFeedbackPrefill(params: URLSearchParams): FeedbackPrefill {
  const prefill: FeedbackPrefill = {};

  const title = params.get("title");
  const description = params.get("description");
  const type = params.get("type");
  const priority = params.get("priority");

  if (title) prefill.title = title;
  if (description) prefill.description = description;

  if (type && feedbackTypeEnum.safeParse(type).success) {
    prefill.type = type as FeedbackPrefill["type"];
  }

  if (priority && priorityEnum.safeParse(priority).success) {
    prefill.priority = priority as FeedbackPrefill["priority"];
  }

  return prefill;
}
