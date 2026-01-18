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
import { auth } from "@/lib/auth/config";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiError, validationError } from "@/lib/api/errors";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const validEvents = Object.values(WEBHOOK_EVENTS);

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string().refine((e) => validEvents.includes(e as typeof validEvents[number]), {
    message: "Invalid event type",
  })).min(1).optional(),
  enabled: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ webhookId: string }>;
};

/**
 * GET /api/webhooks/:webhookId - Get Webhook details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = await getCurrentOrganizationId(session.user.id);
  if (!organizationId) {
    return NextResponse.json(
      { error: "No organization selected" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { webhookId } = await params;
  const id = parseInt(webhookId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid webhook ID" }, { status: 400 });
  }

  try {
    const webhook = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.webhookId, id),
        eq(webhooks.organizationId, organizationId),
      ),
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        webhookId: webhook.webhookId,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        enabled: webhook.enabled,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * PATCH /api/webhooks/:webhookId - Update Webhook
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = await getCurrentOrganizationId(session.user.id);
  if (!organizationId) {
    return NextResponse.json(
      { error: "No organization selected" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { webhookId } = await params;
  const id = parseInt(webhookId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid webhook ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validated = updateWebhookSchema.parse(body);

    const existing = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.webhookId, id),
        eq(webhooks.organizationId, organizationId),
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const result = await db
      .update(webhooks)
      .set(validated)
      .where(eq(webhooks.webhookId, id))
      .returning();

    return NextResponse.json({
      data: {
        webhookId: result[0].webhookId,
        name: result[0].name,
        url: result[0].url,
        events: result[0].events,
        enabled: result[0].enabled,
        createdAt: result[0].createdAt,
        updatedAt: result[0].updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}

/**
 * DELETE /api/webhooks/:webhookId - Delete Webhook
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = await getCurrentOrganizationId(session.user.id);
  if (!organizationId) {
    return NextResponse.json(
      { error: "No organization selected" },
      { status: 400 },
    );
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { webhookId } = await params;
  const id = parseInt(webhookId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid webhook ID" }, { status: 400 });
  }

  try {
    const existing = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.webhookId, id),
        eq(webhooks.organizationId, organizationId),
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await db.delete(webhooks).where(eq(webhooks.webhookId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
