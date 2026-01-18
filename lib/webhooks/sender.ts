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
import { webhooks, webhookEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
import { logger } from "@/lib/logger";
import type { WebhookPayload } from "./events";

function signPayload(payload: unknown, secret: string | null): string {
  const payloadString = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret || "");
  hmac.update(payloadString);
  return `sha256=${hmac.digest("hex")}`;
}

function calculateNextRetry(retryCount: number): Date {
  const delays = [60, 300, 900]; // 1min, 5min, 15min
  const delay = delays[Math.min(retryCount, delays.length - 1)];
  return new Date(Date.now() + delay * 1000);
}

export async function sendWebhook(
  webhookId: number,
  eventType: string,
  payload: WebhookPayload,
): Promise<void> {
  if (!db) {
    logger.error("Database not configured");
    return;
  }

  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.webhookId, webhookId),
  });

  if (!webhook || !webhook.enabled) {
    logger.info({ webhookId }, "Webhook not found or disabled");
    return;
  }

  if (!webhook.events.includes(eventType)) {
    logger.info({ webhookId, eventType }, "Webhook not subscribed to event");
    return;
  }

  const eventRecord = await db
    .insert(webhookEvents)
    .values({
      webhookId,
      eventType,
      payload,
      status: "sending",
      retryCount: 0,
      maxRetries: 3,
    })
    .returning();

  const eventId = eventRecord[0].eventId;

  try {
    const signature = signPayload(payload, webhook.secret);
    const timestamp = Date.now().toString();

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Echo-Webhooks/1.0",
        "X-Echo-Webhook-ID": eventId.toString(),
        "X-Echo-Webhook-Event": eventType,
        "X-Echo-Webhook-Signature": signature,
        "X-Echo-Webhook-Timestamp": timestamp,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (response.ok) {
      await db
        .update(webhookEvents)
        .set({
          status: "delivered",
          responseStatus: response.status,
          responseBody: responseText.slice(0, 10000),
          deliveredAt: new Date(),
        })
        .where(eq(webhookEvents.eventId, eventId));

      logger.info(
        { webhookId, eventId, status: response.status },
        "Webhook delivered",
      );
    } else {
      const nextRetryAt = calculateNextRetry(0);

      await db
        .update(webhookEvents)
        .set({
          status: "pending",
          responseStatus: response.status,
          responseBody: responseText.slice(0, 10000),
          retryCount: 0,
          nextRetryAt,
        })
        .where(eq(webhookEvents.eventId, eventId));

      logger.warn(
        { webhookId, eventId, status: response.status },
        "Webhook failed, will retry",
      );
    }
  } catch (error) {
    const nextRetryAt = calculateNextRetry(0);

    await db
      .update(webhookEvents)
      .set({
        status: "pending",
        retryCount: 0,
        nextRetryAt,
      })
      .where(eq(webhookEvents.eventId, eventId));

    logger.error({ webhookId, eventId, err: error }, "Webhook error, will retry");
  }
}

export async function triggerWebhooks(
  organizationId: string,
  eventType: string,
  payload: WebhookPayload,
): Promise<void> {
  if (!db) {
    logger.error("Database not configured");
    return;
  }

  const orgWebhooks = await db.query.webhooks.findMany({
    where: and(
      eq(webhooks.organizationId, organizationId),
      eq(webhooks.enabled, true),
    ),
  });

  const subscribedWebhooks = orgWebhooks.filter((w) =>
    w.events.includes(eventType),
  );

  for (const webhook of subscribedWebhooks) {
    sendWebhook(webhook.webhookId, eventType, payload).catch((error) => {
      logger.error(
        { webhookId: webhook.webhookId, err: error },
        "Failed to queue webhook",
      );
    });
  }

  logger.info(
    {
      organizationId,
      eventType,
      count: subscribedWebhooks.length,
    },
    "Webhooks triggered",
  );
}
