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

const baseCommentContent = z
  .string()
  .min(1, "评论内容不能为空")
  .max(5000, "评论内容不能超过 5000 字符");

export const createCommentSchema = z.object({
  content: baseCommentContent,
  isInternal: z.boolean().default(true),
});

export const createGuestCommentSchema = z.object({
  content: baseCommentContent,
  authorName: z
    .string()
    .min(1, "请输入您的姓名")
    .max(100, "姓名不能超过 100 字符"),
  authorEmail: z
    .string()
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱不能超过 255 字符"),
  isInternal: z.literal(false).default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateGuestCommentInput = z.infer<typeof createGuestCommentSchema>;
