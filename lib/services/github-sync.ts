import { db } from "@/lib/db";
import { feedback, githubIntegrations, comments } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
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

/**
 * Sync a single comment to GitHub
 */
export async function syncCommentToGitHub(
  commentId: number,
): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const commentData = await db
    .select({
      comment: comments,
      feedback: feedback,
    })
    .from(comments)
    .innerJoin(feedback, eq(comments.feedbackId, feedback.feedbackId))
    .where(eq(comments.commentId, commentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!commentData) {
    logger.warn({ commentId }, "Comment not found");
    return;
  }

  if (commentData.comment.githubCommentId) {
    logger.debug({ commentId }, "Comment already synced to GitHub");
    return;
  }

  if (!commentData.feedback.githubIssueNumber) {
    logger.debug({ commentId }, "Feedback not linked to GitHub issue");
    return;
  }

  const config = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.organizationId, commentData.feedback.organizationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config || !config.syncComments) {
    logger.debug({ commentId }, "Comment sync disabled");
    return;
  }

  try {
    const client = new GitHubClient({
      accessToken: config.accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const authorName = commentData.comment.authorName || "Echo User";
    const body = `**${authorName}** commented:\n\n${commentData.comment.content}`;

    const githubComment = await client.createIssueComment(
      commentData.feedback.githubIssueNumber,
      body,
    );

    await db
      .update(comments)
      .set({
        githubCommentId: githubComment.id,
        githubCommentUrl: githubComment.html_url,
        githubSyncedAt: new Date(),
      })
      .where(eq(comments.commentId, commentId));

    logger.info(
      {
        commentId,
        feedbackId: commentData.feedback.feedbackId,
        githubCommentId: githubComment.id,
      },
      "Comment synced to GitHub",
    );
  } catch (error) {
    logger.error({ commentId, err: error }, "Failed to sync comment to GitHub");
    throw error;
  }
}

/**
 * Create a comment from GitHub webhook event
 */
export async function createCommentFromGitHub(
  feedbackId: number,
  githubCommentId: number,
  authorLogin: string,
  content: string,
  commentUrl: string,
): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  // Check if comment already exists
  const existing = await db
    .select()
    .from(comments)
    .where(eq(comments.githubCommentId, githubCommentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    logger.debug({ githubCommentId }, "GitHub comment already synced");
    return;
  }

  await db.insert(comments).values({
    feedbackId,
    authorName: `@${authorLogin}`,
    content,
    isInternal: false,
    githubCommentId,
    githubCommentUrl: commentUrl,
    githubSyncedAt: new Date(),
    syncedFromGitHub: true,
  });

  logger.info(
    { feedbackId, githubCommentId, authorLogin },
    "Comment created from GitHub",
  );
}

/**
 * Sync all unsynced comments for a feedback to GitHub
 */
export async function syncAllCommentsToGitHub(feedbackId: number): Promise<void> {
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

  if (!config || !config.syncComments) {
    return;
  }

  const unsyncedComments = await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.feedbackId, feedbackId),
        isNull(comments.githubCommentId),
        eq(comments.syncedFromGitHub, false),
      ),
    );

  for (const comment of unsyncedComments) {
    await syncCommentToGitHub(comment.commentId);
  }
}
