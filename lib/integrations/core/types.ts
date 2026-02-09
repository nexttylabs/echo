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

/**
 * Core types and interfaces for the unified integration module.
 * Supports multiple external systems: GitHub, Jira, Linear, Slack, Discord, etc.
 */

// Supported integration types
export type IntegrationType =
  | "github"
  | "jira"
  | "linear"
  | "slack"
  | "discord";

// Capabilities that a provider can support
export type IntegrationCapability =
  | "issue_sync" // Sync feedback to external issue tracker
  | "comment_sync" // Sync comments bidirectionally
  | "status_sync" // Sync status changes
  | "notification" // Send notifications
  | "webhook"; // Receive webhooks

// OAuth tokens structure
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

// External issue representation
export interface ExternalIssue {
  id: string;
  number?: number;
  url: string;
  title: string;
  status?: string;
  createdAt: Date;
}

// External comment representation
export interface ExternalComment {
  id: string;
  body: string;
  author: string;
  authorUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Notification payload
export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

// Feedback data for sync (simplified)
export interface FeedbackForSync {
  feedbackId: number;
  title: string;
  description: string | null;
  status: string;
  type: string | null;
  authorName?: string;
  authorEmail?: string;
  tags?: string[];
  organizationId: string;
}

// Comment data for sync
export interface CommentForSync {
  commentId: number;
  content: string;
  authorName?: string;
  createdAt: Date;
}

// Sync settings stored per integration
export interface SyncSettings {
  // Which statuses trigger issue creation
  triggerStatuses: string[];
  // Sync status changes to external system
  syncStatusChanges: boolean;
  // Sync comments bidirectionally
  syncComments: boolean;
  // Auto add labels based on tags
  autoAddLabels: boolean;
  // Status mapping: internal status -> external status
  statusMapping?: Record<string, string>;
  // Label mapping: internal tag -> external label
  labelMapping?: Record<string, string>;
}

// Provider-specific configuration (varies by type)
export interface GitHubConfig {
  owner: string;
  repo: string;
}

export interface JiraConfig {
  siteUrl: string;
  projectKey: string;
}

export interface LinearConfig {
  teamId: string;
}

export interface SlackConfig {
  channelId: string;
  webhookUrl?: string;
}

export type ProviderConfig =
  | GitHubConfig
  | JiraConfig
  | LinearConfig
  | SlackConfig
  | Record<string, unknown>;

// Provider metadata for UI
export interface ProviderMetadata {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  capabilities: IntegrationCapability[];
  configSchema?: Record<string, unknown>;
}
