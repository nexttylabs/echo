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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { apiError, validationError } from "@/lib/api/errors";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const validEvents = Object.values(WEBHOOK_EVENTS);

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string().refine((e) => validEvents.includes(e as typeof validEvents[number]), {
    message: "Invalid event type",
  })).min(1),
});

/**
 * GET /api/webhooks - List Webhooks
 */
export async function GET(req: NextRequest) {
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

  try {
    const hooks = await db.query.webhooks.findMany({
      where: eq(webhooks.organizationId, organizationId),
    });

    const sanitized = hooks.map((h) => ({
      webhookId: h.webhookId,
      name: h.name,
      url: h.url,
      events: h.events,
      enabled: h.enabled,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));

    return NextResponse.json({ data: sanitized });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/webhooks - Create Webhook
 */
export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const validated = createWebhookSchema.parse(body);

    const secret = randomBytes(32).toString("hex");

    const result = await db
      .insert(webhooks)
      .values({
        organizationId,
        name: validated.name,
        url: validated.url,
        events: validated.events,
        secret,
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          webhookId: result[0].webhookId,
          name: result[0].name,
          url: result[0].url,
          events: result[0].events,
          enabled: result[0].enabled,
          secret,
          createdAt: result[0].createdAt,
          warning: "Save this secret now. You will not be able to see it again.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}
