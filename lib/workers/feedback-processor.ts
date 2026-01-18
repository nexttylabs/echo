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

/**
 * Background AI processing for feedback
 * MVP: Uses setTimeout + in-memory queue
 * Future: BullMQ + Redis for production scalability
 */

import { classifyFeedback } from "@/lib/services/ai/classifier";
import { suggestTags } from "@/lib/services/ai/tag-suggester";
import {
  findDuplicates,
  type FeedbackForDuplicateCheck,
} from "@/lib/services/ai/duplicate-detector";
import { db } from "@/lib/db";
import {
  feedback,
  aiProcessingResults,
  duplicateFeedback,
} from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { logger } from "@/lib/logger";

export interface ProcessingJob {
  feedbackId: number;
  title: string;
  description: string;
  organizationId: string;
}

/**
 * Process AI tasks for a single feedback item
 */
export async function processFeedback(job: ProcessingJob): Promise<void> {
  if (
    !db ||
    typeof db.update !== "function" ||
    typeof db.insert !== "function" ||
    typeof db.select !== "function"
  ) {
    logger.error("Database not available for AI processing");
    return;
  }

  const startTime = Date.now();

  try {
    logger.info({ feedbackId: job.feedbackId }, "Starting AI processing");

    // Update status to processing
    await db
      .update(feedback)
      .set({ processingStatus: "processing" })
      .where(eq(feedback.feedbackId, job.feedbackId));

    // 1. Classification
    const classification = classifyFeedback(job.title, job.description);

    // 2. Tag suggestions
    const tagSuggestions = suggestTags(job.title, job.description);

    // 3. Duplicate detection
    const existingFeedbacks: FeedbackForDuplicateCheck[] = await db
      .select({
        feedbackId: feedback.feedbackId,
        title: feedback.title,
        description: feedback.description,
      })
      .from(feedback)
      .where(
        and(
          eq(feedback.organizationId, job.organizationId),
          isNull(feedback.deletedAt),
          ne(feedback.feedbackId, job.feedbackId),
        ),
      );

    const duplicateCandidates = findDuplicates(
      job.title,
      job.description,
      existingFeedbacks,
      job.feedbackId,
      0.75,
    );

    const processingTime = Date.now() - startTime;

    // Save processing results
    await db.insert(aiProcessingResults).values({
      feedbackId: job.feedbackId,
      classification,
      tagSuggestions: tagSuggestions.map((t) => ({
        name: t.name,
        slug: t.slug,
        confidence: t.confidence,
      })),
      duplicateCandidates: duplicateCandidates.map((d) => ({
        feedbackId: d.feedbackId,
        similarity: d.similarity,
      })),
      processingTime,
      status: "completed",
    });

    // Save duplicate candidates to duplicate_feedback table
    for (const duplicate of duplicateCandidates) {
      await db
        .insert(duplicateFeedback)
        .values({
          originalFeedbackId: job.feedbackId,
          duplicateFeedbackId: duplicate.feedbackId,
          similarity: duplicate.similarity,
          status: "pending",
        })
        .onConflictDoNothing();
    }

    // Update feedback status
    await db
      .update(feedback)
      .set({
        processingStatus: "completed",
        processedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, job.feedbackId));

    logger.info(
      {
        feedbackId: job.feedbackId,
        processingTime,
        duplicatesFound: duplicateCandidates.length,
        tagsFound: tagSuggestions.length,
      },
      "AI processing completed",
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        feedbackId: job.feedbackId,
        error: errorMessage,
      },
      "AI processing failed",
    );

    // Update status to failed
    await db
      .update(feedback)
      .set({ processingStatus: "failed" })
      .where(eq(feedback.feedbackId, job.feedbackId));

    // Save failure record
    await db.insert(aiProcessingResults).values({
      feedbackId: job.feedbackId,
      processingTime: Date.now() - startTime,
      status: "failed",
      errorMessage,
    });
  }
}

// MVP: Simple in-memory queue
const processingQueue: ProcessingJob[] = [];
let isProcessing = false;

/**
 * Add a feedback item to the processing queue
 */
export function enqueueFeedbackProcessing(job: ProcessingJob): void {
  processingQueue.push(job);

  if (!isProcessing) {
    processQueue();
  }
}

/**
 * Process items from the queue
 */
async function processQueue(): Promise<void> {
  if (processingQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = processingQueue.shift();

  if (job) {
    // Delay to avoid blocking the response
    setTimeout(async () => {
      await processFeedback(job);
      processQueue();
    }, 100);
  }
}

/**
 * Retry failed processing for a feedback item
 */
export async function retryFailedProcessing(feedbackId: number): Promise<void> {
  if (!db) {
    throw new Error("Database not available");
  }

  const feedbackData = await db
    .select({
      feedbackId: feedback.feedbackId,
      title: feedback.title,
      description: feedback.description,
      organizationId: feedback.organizationId,
    })
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1);

  if (feedbackData.length === 0) {
    throw new Error("Feedback not found");
  }

  const data = feedbackData[0];

  enqueueFeedbackProcessing({
    feedbackId: data.feedbackId,
    title: data.title,
    description: data.description || "",
    organizationId: data.organizationId,
  });
}

/**
 * Get queue status (for monitoring)
 */
export function getQueueStatus(): { queueLength: number; isProcessing: boolean } {
  return {
    queueLength: processingQueue.length,
    isProcessing,
  };
}
