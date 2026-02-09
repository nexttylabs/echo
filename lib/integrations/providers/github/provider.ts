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

import crypto from "crypto";
import type { IntegrationProvider, WebhookEvent } from "@/lib/integrations/core/provider";
import type {
  GitHubConfig,
  OAuthTokens,
  ExternalIssue,
  ExternalComment,
  FeedbackForSync,
  CommentForSync,
  ProviderMetadata,
} from "@/lib/integrations/core/types";
import { GitHubClient } from "@/lib/integrations/github";

/**
 * GitHub integration provider implementing the unified provider interface.
 */
export class GitHubProvider implements IntegrationProvider<GitHubConfig> {
  readonly metadata: ProviderMetadata = {
    type: "github",
    name: "GitHub",
    description: "Sync feedback to GitHub Issues",
    icon: "github",
    capabilities: ["issue_sync", "comment_sync", "status_sync", "webhook"],
  };

  readonly type = "github" as const;

  // ============================================
  // OAuth
  // ============================================

  getAuthUrl(state: string, redirectUri: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error("GITHUB_CLIENT_ID not configured");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo read:user",
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokens> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GitHub OAuth not configured");
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub OAuth failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    return {
      accessToken: data.access_token,
      scope: data.scope,
      // GitHub tokens don't expire by default
    };
  }

  // ============================================
  // Issue Sync
  // ============================================

  async createIssue(
    feedback: FeedbackForSync,
    config: GitHubConfig,
    accessToken: string
  ): Promise<ExternalIssue> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const body = this.formatIssueBody(feedback);
    const labels = feedback.tags || [];

    const issue = await client.createIssue({
      title: feedback.title,
      body,
      labels,
    });

    return {
      id: issue.id.toString(),
      number: issue.number,
      url: issue.html_url,
      title: issue.title,
      status: issue.state,
      createdAt: new Date(issue.created_at),
    };
  }

  async updateIssue(
    externalId: string,
    feedback: Partial<FeedbackForSync>,
    config: GitHubConfig,
    accessToken: string
  ): Promise<void> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    // externalId is the issue number for GitHub
    const issueNumber = parseInt(externalId);
    
    const updates: { title?: string; body?: string; labels?: string[] } = {};
    
    if (feedback.title) {
      updates.title = feedback.title;
    }
    if (feedback.description !== undefined) {
      updates.body = this.formatIssueBody(feedback as FeedbackForSync);
    }
    if (feedback.tags) {
      updates.labels = feedback.tags;
    }

    await client.updateIssue(issueNumber, updates);
  }

  async closeIssue(
    externalId: string,
    config: GitHubConfig,
    accessToken: string
  ): Promise<void> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const issueNumber = parseInt(externalId);
    await client.closeIssue(issueNumber);
  }

  async reopenIssue(
    externalId: string,
    config: GitHubConfig,
    accessToken: string
  ): Promise<void> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const issueNumber = parseInt(externalId);
    await client.reopenIssue(issueNumber);
  }

  // ============================================
  // Comment Sync
  // ============================================

  async createComment(
    externalId: string,
    comment: CommentForSync,
    config: GitHubConfig,
    accessToken: string
  ): Promise<ExternalComment> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const issueNumber = parseInt(externalId);
    const body = this.formatCommentBody(comment);

    const result = await client.createIssueComment(issueNumber, body);

    return {
      id: result.id.toString(),
      body: result.body,
      author: result.user.login,
      authorUrl: `https://github.com/${result.user.login}`,
      createdAt: new Date(result.created_at),
      updatedAt: result.updated_at ? new Date(result.updated_at) : undefined,
    };
  }

  async getComments(
    externalId: string,
    config: GitHubConfig,
    accessToken: string
  ): Promise<ExternalComment[]> {
    const client = new GitHubClient({
      accessToken,
      owner: config.owner,
      repo: config.repo,
    });

    const issueNumber = parseInt(externalId);
    const comments = await client.getIssueComments(issueNumber);

    return comments.map((c) => ({
      id: c.id.toString(),
      body: c.body,
      author: c.user.login,
      authorUrl: `https://github.com/${c.user.login}`,
      createdAt: new Date(c.created_at),
      updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
    }));
  }

  // ============================================
  // Webhook
  // ============================================

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  parseWebhook(payload: unknown): WebhookEvent | null {
    const data = payload as Record<string, unknown>;
    const action = data.action as string;
    const issue = data.issue as Record<string, unknown> | undefined;

    if (!issue) {
      return null;
    }

    const externalId = (issue.number as number).toString();

    if (action === "closed") {
      return { type: "issue_closed", externalId, data };
    }
    if (action === "reopened") {
      return { type: "issue_reopened", externalId, data };
    }
    if (action === "edited" || action === "labeled" || action === "unlabeled") {
      return { type: "issue_updated", externalId, data };
    }

    // Comment events
    if (data.comment && action === "created") {
      return { type: "comment_created", externalId, data };
    }

    return null;
  }

  // ============================================
  // Helpers
  // ============================================

  private formatIssueBody(feedback: FeedbackForSync): string {
    const lines: string[] = [];

    if (feedback.description) {
      lines.push(feedback.description);
      lines.push("");
    }

    lines.push("---");
    lines.push(`**Type:** ${feedback.type || "feedback"}`);
    lines.push(`**Status:** ${feedback.status}`);

    if (feedback.authorName) {
      lines.push(`**Submitted by:** ${feedback.authorName}`);
    }

    lines.push("");
    lines.push(`_Synced from Echo Feedback #${feedback.feedbackId}_`);

    return lines.join("\n");
  }

  private formatCommentBody(comment: CommentForSync): string {
    const authorPrefix = comment.authorName
      ? `**@${comment.authorName} commented:**\n\n`
      : "";
    return `${authorPrefix}${comment.content}\n\n---\n_Synced from Echo_`;
  }
}

// Export singleton instance
export const githubProvider = new GitHubProvider();
