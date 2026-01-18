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

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { feedback, githubIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface GitHubWebhookPayload {
  action: string;
  issue: {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    html_url: string;
  };
  repository: {
    id: number;
    full_name: string;
    owner: {
      login: string;
    };
    name: string;
  };
}

function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSig = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    const signature = req.headers.get("X-Hub-Signature-256");
    const event = req.headers.get("X-GitHub-Event");
    const body = await req.text();

    if (!signature || !event) {
      return NextResponse.json({ error: "Missing headers" }, { status: 401 });
    }

    const configs = await db.select().from(githubIntegrations);

    let validConfig = null;
    for (const config of configs) {
      if (
        config.webhookSecret &&
        verifySignature(body, signature, config.webhookSecret)
      ) {
        validConfig = config;
        break;
      }
    }

    if (!validConfig) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);

    if (event === "issues") {
      await handleIssueEvent(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "GitHub webhook error");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleIssueEvent(payload: GitHubWebhookPayload) {
  if (!db) return;

  const { action, issue } = payload;

  if (!["closed", "reopened"].includes(action)) {
    return;
  }

  const feedbackData = await db
    .select()
    .from(feedback)
    .where(eq(feedback.githubIssueId, issue.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!feedbackData) {
    logger.info({ githubIssueId: issue.id }, "No associated feedback found");
    return;
  }

  const statusMapping: Record<string, string> = {
    closed: "completed",
    reopened: "in-progress",
  };

  const newStatus = statusMapping[action];

  if (newStatus && newStatus !== feedbackData.status) {
    await db
      .update(feedback)
      .set({
        status: newStatus,
        githubStatus: issue.state,
        githubSyncedAt: new Date(),
      })
      .where(eq(feedback.feedbackId, feedbackData.feedbackId));

    logger.info(
      {
        feedbackId: feedbackData.feedbackId,
        action,
        oldStatus: feedbackData.status,
        newStatus,
      },
      "Status synced from GitHub webhook",
    );
  }
}
