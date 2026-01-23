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

import { z } from "zod";

export const FeedbackStatusEnum = z.enum([
  "new",
  "in-progress",
  "planned",
  "completed",
  "closed",
]);

export type FeedbackStatus = z.infer<typeof FeedbackStatusEnum>;

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "新接收",
  "in-progress": "处理中",
  planned: "已规划",
  completed: "已完成",
  closed: "已关闭",
};

export const STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  planned: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export const updateFeedbackStatusSchema = z.object({
  status: FeedbackStatusEnum,
  comment: z.string().optional(),
});

export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
