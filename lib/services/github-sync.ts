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

import { db } from "@/lib/db";
import { feedback, githubIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "@/lib/integrations/github";
import { logger } from "@/lib/logger";

const DEFAULT_LABEL_MAPPING: Record<string, string> = {
  bug: "bug",
  feature: "enhancement",
  improvement: "enhancement",
  question: "question",
};

const PRIORITY_LABEL_MAPPING: Record<string, string> = {
  low: "priority: low",
  medium: "priority: medium",
  high: "priority: high",
  urgent: "priority: urgent",
};

export async function syncToGitHub(feedbackId: number): Promise<void> {
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
    logger.info({ feedbackId }, "Feedback not found");
    return;
  }

  if (feedbackData.githubIssueId) {
    logger.info({ feedbackId }, "Feedback already synced to GitHub");
    return;
  }

  const config = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.organizationId, feedbackData.organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config || !config.autoSync) {
    logger.info(
      { feedbackId },
      "GitHub integration not configured or auto-sync disabled",
    );
    return;
  }

  try {
    const client = new GitHubClient({
      accessToken: config.accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const body = `
## Feedback from Echo

${feedbackData.description || "No description provided."}

---

| Field | Value |
|-------|-------|
| **Type** | ${feedbackData.type} |
| **Priority** | ${feedbackData.priority} |
| **Status** | ${feedbackData.status} |

[View in Echo](${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackId})
    `.trim();

    const labels: string[] = [];
    const typeLabel =
      config.labelMapping?.[feedbackData.type] ||
      DEFAULT_LABEL_MAPPING[feedbackData.type];
    if (typeLabel) labels.push(typeLabel);

    const priorityLabel = PRIORITY_LABEL_MAPPING[feedbackData.priority];
    if (priorityLabel) labels.push(priorityLabel);

    const issue = await client.createIssue({
      title: feedbackData.title,
      body,
      labels,
    });

    await db
      .update(feedback)
      .set({
        githubIssueId: issue.id,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        githubSyncedAt: new Date(),
        githubStatus: issue.state,
      })
      .where(eq(feedback.feedbackId, feedbackId));

    logger.info(
      {
        feedbackId,
        githubIssueId: issue.id,
        githubIssueNumber: issue.number,
        githubUrl: issue.html_url,
      },
      "Synced to GitHub",
    );
  } catch (error) {
    logger.error({ feedbackId, err: error }, "Failed to sync to GitHub");
    throw error;
  }
}

export async function syncFromGitHub(feedbackId: number): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const feedbackData = await db
    .select()
    .from(feedback)
    .where(eq(feedback.feedbackId, feedbackId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!feedbackData?.githubIssueNumber) {
    return;
  }

  const config = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.organizationId, feedbackData.organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config) {
    return;
  }

  try {
    const client = new GitHubClient({
      accessToken: config.accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const issue = await client.getIssue(feedbackData.githubIssueNumber);

    const reverseMapping: Record<string, string> = {
      open: "in-progress",
      closed: "completed",
    };

    const newStatus = reverseMapping[issue.state];

    if (newStatus && newStatus !== feedbackData.status) {
      await db
        .update(feedback)
        .set({
          status: newStatus,
          githubStatus: issue.state,
          githubSyncedAt: new Date(),
        })
        .where(eq(feedback.feedbackId, feedbackId));

      logger.info(
        {
          feedbackId,
          oldStatus: feedbackData.status,
          newStatus,
        },
        "Status synced from GitHub",
      );
    }
  } catch (error) {
    logger.error({ feedbackId, err: error }, "Failed to sync from GitHub");
    throw error;
  }
}
