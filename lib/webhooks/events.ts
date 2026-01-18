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

export const WEBHOOK_EVENTS = {
  FEEDBACK_CREATED: "feedback.created",
  FEEDBACK_UPDATED: "feedback.updated",
  FEEDBACK_DELETED: "feedback.deleted",
  FEEDBACK_STATUS_CHANGED: "feedback.status_changed",

  COMMENT_CREATED: "comment.created",
  COMMENT_UPDATED: "comment.updated",
  COMMENT_DELETED: "comment.deleted",

  USER_INVITED: "user.invited",
  USER_JOINED: "user.joined",
  USER_REMOVED: "user.removed",
} as const;

export type WebhookEventType =
  (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: unknown;
  organizationId: string;
}

export interface FeedbackCreatedPayload extends WebhookPayload {
  event: "feedback.created";
  data: {
    feedbackId: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    organizationId: string;
    createdAt: string;
  };
}

export interface FeedbackUpdatedPayload extends WebhookPayload {
  event: "feedback.updated";
  data: {
    feedbackId: string;
    changes: Record<string, { old: unknown; new: unknown }>;
  };
}

export interface FeedbackStatusChangedPayload extends WebhookPayload {
  event: "feedback.status_changed";
  data: {
    feedbackId: string;
    oldStatus: string;
    newStatus: string;
  };
}
