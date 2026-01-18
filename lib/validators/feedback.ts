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

import { z } from "zod";

export const feedbackTypeEnum = z.enum(["bug", "feature", "issue", "other"]);

export const priorityEnum = z.enum(["low", "medium", "high"]);

export const customerInfoSchema = z.object({
  name: z.string().min(1, "customerNameRequired").max(100, "customerNameMax100"),
  email: z.string().email("emailInvalid"),
  phone: z.string().optional(),
});

export const baseFeedbackSchema = z.object({
  title: z
    .string()
    .min(1, "titleRequired")
    .max(200, "titleMax200"),
  description: z
    .string()
    .min(1, "descriptionRequired")
    .max(5000, "descriptionMax5000"),
  type: feedbackTypeEnum.optional(),
  priority: priorityEnum.optional(),
});

export const feedbackSchema = baseFeedbackSchema.extend({
  submittedOnBehalf: z.boolean().optional().default(false),
  customerInfo: customerInfoSchema.optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export const updateFeedbackSchema = baseFeedbackSchema.pick({
  title: true,
  description: true,
});

export type BaseFeedbackInput = z.infer<typeof baseFeedbackSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
