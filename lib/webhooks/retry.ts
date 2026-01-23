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
import { webhooks, webhookEvents } from "@/lib/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";
import { createHmac } from "crypto";
import { logger } from "@/lib/logger";

const processing = new Set<number>();

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

async function retryWebhookEvent(
  event: {
    eventId: number;
    webhookId: number;
    eventType: string;
    payload: unknown;
    retryCount: number;
    maxRetries: number;
  },
  webhook: { url: string; secret: string | null },
): Promise<void> {
  if (!db) return;

  logger.info({ eventId: event.eventId, retryCount: event.retryCount }, "Retrying webhook");

  await db
    .update(webhookEvents)
    .set({ status: "sending" })
    .where(eq(webhookEvents.eventId, event.eventId));

  try {
    const signature = signPayload(event.payload, webhook.secret);
    const timestamp = Date.now().toString();

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Echo-Webhooks/1.0",
        "X-Echo-Webhook-ID": event.eventId.toString(),
        "X-Echo-Webhook-Event": event.eventType,
        "X-Echo-Webhook-Signature": signature,
        "X-Echo-Webhook-Timestamp": timestamp,
      },
      body: JSON.stringify(event.payload),
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
        .where(eq(webhookEvents.eventId, event.eventId));

      logger.info({ eventId: event.eventId }, "Webhook retry succeeded");
    } else {
      await handleRetryFailure(event, response.status, responseText);
    }
  } catch (error) {
    await handleRetryFailure(event, null, null);
    logger.error({ eventId: event.eventId, err: error }, "Webhook retry error");
  }
}

async function handleRetryFailure(
  event: { eventId: number; retryCount: number; maxRetries: number },
  responseStatus: number | null,
  responseBody: string | null,
): Promise<void> {
  if (!db) return;

  const newRetryCount = event.retryCount + 1;

  if (newRetryCount >= event.maxRetries) {
    await db
      .update(webhookEvents)
      .set({
        status: "failed",
        retryCount: newRetryCount,
        responseStatus,
        responseBody: responseBody?.slice(0, 10000),
      })
      .where(eq(webhookEvents.eventId, event.eventId));

    logger.warn({ eventId: event.eventId }, "Webhook failed after max retries");
  } else {
    const nextRetryAt = calculateNextRetry(newRetryCount);

    await db
      .update(webhookEvents)
      .set({
        status: "pending",
        retryCount: newRetryCount,
        nextRetryAt,
        responseStatus,
        responseBody: responseBody?.slice(0, 10000),
      })
      .where(eq(webhookEvents.eventId, event.eventId));
  }
}

export async function processFailedWebhooks(): Promise<void> {
  if (!db) {
    logger.error("Database not configured");
    return;
  }

  const failedEvents = await db
    .select({
      eventId: webhookEvents.eventId,
      webhookId: webhookEvents.webhookId,
      eventType: webhookEvents.eventType,
      payload: webhookEvents.payload,
      retryCount: webhookEvents.retryCount,
      maxRetries: webhookEvents.maxRetries,
    })
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.status, "pending"),
        lte(webhookEvents.nextRetryAt, new Date()),
        lt(webhookEvents.retryCount, webhookEvents.maxRetries),
      ),
    )
    .limit(10);

  for (const event of failedEvents) {
    if (processing.has(event.eventId)) {
      continue;
    }

    processing.add(event.eventId);

    try {
      const webhook = await db.query.webhooks.findFirst({
        where: eq(webhooks.webhookId, event.webhookId),
      });

      if (!webhook || !webhook.enabled) {
        await db
          .update(webhookEvents)
          .set({ status: "failed" })
          .where(eq(webhookEvents.eventId, event.eventId));
        continue;
      }

      await retryWebhookEvent(event, webhook);
    } catch (error) {
      logger.error({ eventId: event.eventId, err: error }, "Failed to retry webhook");
    } finally {
      processing.delete(event.eventId);
    }
  }
}
