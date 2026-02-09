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

import { db } from "@/lib/db";
import { feedback, githubIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "@/lib/integrations/github";
import { logger } from "@/lib/logger";
import { syncToGitHub } from "./github-sync";

/**
 * Default status mapping from Echo feedback to GitHub issue state
 */
const STATUS_TO_GITHUB_STATE: Record<string, "open" | "closed"> = {
  new: "open",
  open: "open",
  "in-progress": "open",
  planned: "open",
  completed: "closed",
  closed: "closed",
  rejected: "closed",
};

/**
 * Check if a status change should trigger Issue creation
 */
export function shouldTriggerIssueCreation(
  status: string,
  triggerStatuses: string[],
): boolean {
  return triggerStatuses.includes(status);
}

/**
 * Handle feedback status change - sync to GitHub if configured
 */
export async function handleFeedbackStatusChange(
  feedbackId: number,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const feedbackData = await db
    .select()
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!feedbackData) {
    logger.warn({ feedbackId }, "Feedback not found for status change sync");
    return;
  }

  const config = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.organizationId, feedbackData.organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config || !config.autoSync) {
    logger.debug(
      { feedbackId },
      "GitHub integration not configured or auto-sync disabled",
    );
    return;
  }

  // Check if status changes should be synced
  if (!config.syncStatusChanges) {
    logger.debug({ feedbackId }, "Status change sync disabled");
    return;
  }

  const triggerStatuses = config.syncTriggerStatuses || [
    "in-progress",
    "planned",
  ];

  try {
    // Case 1: No GitHub issue exists yet - check if we should create one
    if (!feedbackData.githubIssueId) {
      if (shouldTriggerIssueCreation(newStatus, triggerStatuses)) {
        logger.info(
          { feedbackId, newStatus },
          "Status triggers issue creation, syncing to GitHub",
        );
        await syncToGitHub(feedbackId);
      }
      return;
    }

    // Case 2: GitHub issue exists - sync status change
    const client = new GitHubClient({
      accessToken: config.accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const targetState = STATUS_TO_GITHUB_STATE[newStatus] || "open";
    const currentGitHubState = feedbackData.githubStatus;

    // Only update if state actually changed
    if (currentGitHubState !== targetState) {
      if (targetState === "closed") {
        await client.closeIssue(feedbackData.githubIssueNumber!);
      } else {
        await client.reopenIssue(feedbackData.githubIssueNumber!);
      }

      // Update local tracking
      await db
        .update(feedback)
        .set({
          githubStatus: targetState,
          githubSyncedAt: new Date(),
        })
        .where(eq(feedback.feedbackId, feedbackId));

      logger.info(
        {
          feedbackId,
          oldStatus,
          newStatus,
          githubState: targetState,
        },
        "Synced status change to GitHub",
      );
    }
  } catch (error) {
    logger.error(
      { feedbackId, oldStatus, newStatus, err: error },
      "Failed to sync status change to GitHub",
    );
    // Don't throw - status change sync failure shouldn't block status update
  }
}
