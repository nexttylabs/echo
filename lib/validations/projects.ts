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

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const widgetConfigSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  buttonText: z.string().min(1).max(50),
  buttonPosition: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]),
  fields: z.object({
    showType: z.boolean(),
    showPriority: z.boolean(),
    showDescription: z.boolean(),
    requireEmail: z.boolean(),
  }),
  types: z.array(z.enum(["bug", "feature", "issue", "other"])).min(1),
  customCSS: z.string().max(5000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  widgetConfig: widgetConfigSchema.optional(),
});

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
