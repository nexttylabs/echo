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

import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validators/feedback";
import { feedback } from "@/lib/db/schema";
import { apiError, validationError } from "@/lib/api/errors";
import { canSubmitOnBehalf, type UserRole } from "@/lib/auth/permissions";
import { classifyFeedback } from "@/lib/services/ai/classifier";
import { enqueueFeedbackProcessing } from "@/lib/workers/feedback-processor";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type CreateFeedbackDeps = {
  db: {
    insert: Database["insert"];
    select: Database["select"];
  };
};

export function buildCreateFeedbackHandler(deps: CreateFeedbackDeps) {
  return async function POST(req: Request) {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return validationError(undefined, "Invalid request body");
    }

    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const organizationId = req.headers.get("x-organization-id")?.trim();
    if (!organizationId) {
      return validationError(
        [{ path: ["organizationId"], message: "Organization id is required" }],
        "Organization id is required",
      );
    }

    const validatedData = parsed.data;
    const userId = req.headers.get("x-user-id")?.trim() || null;
    const userRole = req.headers.get("x-user-role")?.trim() as UserRole | null;

    if (validatedData.submittedOnBehalf) {
      if (!userRole || !canSubmitOnBehalf(userRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }

      if (!validatedData.customerInfo) {
        return NextResponse.json(
          {
            error: "Customer information is required when submitting on behalf",
            code: "CUSTOMER_INFO_REQUIRED",
          },
          { status: 400 },
        );
      }
    }

    try {
      // Auto-classify feedback
      const classification = classifyFeedback(
        validatedData.title,
        validatedData.description,
      );

      // Use auto-classified values if not provided by user, or if values match classification
      const finalType = validatedData.type || classification.type;
      const finalPriority = validatedData.priority || classification.priority;
      const autoClassified =
        !validatedData.type ||
        !validatedData.priority ||
        (finalType === classification.type &&
          finalPriority === classification.priority);

      const [created] = await deps.db
        .insert(feedback)
        .values({
          title: validatedData.title,
          description: validatedData.description,
          type: finalType,
          priority: finalPriority,
          status: "new",
          organizationId,
          submittedOnBehalf: validatedData.submittedOnBehalf,
          submittedBy: validatedData.submittedOnBehalf ? userId : null,
          customerInfo: validatedData.customerInfo ?? null,
          autoClassified,
        })
        .returning();

      const trackingUrl = `/feedback/${created.feedbackId}`;

      // Queue async AI processing (classification, tags, duplicates)
      enqueueFeedbackProcessing({
        feedbackId: created.feedbackId,
        title: validatedData.title,
        description: validatedData.description || "",
        organizationId,
      });

      return NextResponse.json(
        {
          data: {
            ...created,
            trackingUrl,
            classification: autoClassified ? classification : undefined,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      return apiError(error);
    }
  };
}
