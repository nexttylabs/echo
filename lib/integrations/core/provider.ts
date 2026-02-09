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

import type {
  IntegrationType,
  IntegrationCapability,
  OAuthTokens,
  ExternalIssue,
  ExternalComment,
  NotificationPayload,
  FeedbackForSync,
  CommentForSync,
  ProviderMetadata,
  ProviderConfig,
} from "./types";

/**
 * Base interface for all integration providers.
 * Each provider (GitHub, Jira, Linear, etc.) implements this interface.
 */
export interface IntegrationProvider<TConfig extends ProviderConfig = ProviderConfig> {
  /**
   * Provider metadata for registration and UI display.
   */
  readonly metadata: ProviderMetadata;

  /**
   * Get provider type shorthand.
   */
  readonly type: IntegrationType;

  // ============================================
  // OAuth Authentication
  // ============================================

  /**
   * Generate OAuth authorization URL.
   * @param state - CSRF state token
   * @param redirectUri - Callback URL
   */
  getAuthUrl(state: string, redirectUri: string): string;

  /**
   * Exchange authorization code for tokens.
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - Callback URL (must match getAuthUrl)
   */
  handleCallback(code: string, redirectUri: string): Promise<OAuthTokens>;

  /**
   * Refresh expired access token.
   * @param refreshToken - Refresh token from initial auth
   */
  refreshToken?(refreshToken: string): Promise<OAuthTokens>;

  // ============================================
  // Issue Sync (optional - for issue trackers)
  // ============================================

  /**
   * Create an issue in the external system.
   * @param feedback - Feedback data to sync
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  createIssue?(
    feedback: FeedbackForSync,
    config: TConfig,
    accessToken: string
  ): Promise<ExternalIssue>;

  /**
   * Update an existing issue.
   * @param externalId - External issue ID
   * @param feedback - Updated feedback data
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  updateIssue?(
    externalId: string,
    feedback: Partial<FeedbackForSync>,
    config: TConfig,
    accessToken: string
  ): Promise<void>;

  /**
   * Close an issue.
   * @param externalId - External issue ID
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  closeIssue?(
    externalId: string,
    config: TConfig,
    accessToken: string
  ): Promise<void>;

  /**
   * Reopen a closed issue.
   * @param externalId - External issue ID
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  reopenIssue?(
    externalId: string,
    config: TConfig,
    accessToken: string
  ): Promise<void>;

  // ============================================
  // Comment Sync (optional)
  // ============================================

  /**
   * Create a comment on an external issue.
   * @param externalId - External issue ID
   * @param comment - Comment data
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  createComment?(
    externalId: string,
    comment: CommentForSync,
    config: TConfig,
    accessToken: string
  ): Promise<ExternalComment>;

  /**
   * Get all comments from an external issue.
   * @param externalId - External issue ID
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token
   */
  getComments?(
    externalId: string,
    config: TConfig,
    accessToken: string
  ): Promise<ExternalComment[]>;

  // ============================================
  // Notification (optional - for messaging apps)
  // ============================================

  /**
   * Send a notification message.
   * @param payload - Notification content
   * @param config - Provider-specific configuration
   * @param accessToken - OAuth access token or webhook URL
   */
  sendNotification?(
    payload: NotificationPayload,
    config: TConfig,
    accessToken: string
  ): Promise<void>;

  // ============================================
  // Webhook Handling (optional)
  // ============================================

  /**
   * Verify webhook signature.
   * @param payload - Raw request body
   * @param signature - Signature header value
   * @param secret - Webhook secret
   */
  verifyWebhook?(
    payload: string,
    signature: string,
    secret: string
  ): boolean;

  /**
   * Parse webhook payload into normalized format.
   * @param payload - Raw webhook payload
   */
  parseWebhook?(payload: unknown): WebhookEvent | null;
}

/**
 * Normalized webhook event from any provider.
 */
export interface WebhookEvent {
  type: "issue_updated" | "issue_closed" | "issue_reopened" | "comment_created";
  externalId: string;
  data: Record<string, unknown>;
}

/**
 * Check if provider has a specific capability.
 */
export function hasCapability(
  provider: IntegrationProvider,
  capability: IntegrationCapability
): boolean {
  return provider.metadata.capabilities.includes(capability);
}
