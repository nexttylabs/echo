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
import { db } from "@/lib/db";
import { githubIntegrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GitHubClient } from "@/lib/integrations/github";
import { randomBytes } from "crypto";
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createGitHubIntegrationSchema = z.object({
  accessToken: z.string().min(1),
  owner: z.string().min(1),
  repo: z.string().min(1),
  autoSync: z.boolean().optional().default(true),
});

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
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    const config = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!config) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      owner: config.owner,
      repo: config.repo,
      autoSync: config.autoSync,
    });
  } catch (error) {
    return apiError(error);
  }
}

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
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const validated = createGitHubIntegrationSchema.parse(body);

    const client = new GitHubClient({
      accessToken: validated.accessToken,
      owner: validated.owner,
      repo: validated.repo,
    });
    const isValid = await client.validateToken();

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid token or repository" },
        { status: 400 },
      );
    }

    const webhookSecret = randomBytes(32).toString("hex");

    const existing = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) {
      await db
        .update(githubIntegrations)
        .set({
          accessToken: validated.accessToken,
          owner: validated.owner,
          repo: validated.repo,
          autoSync: validated.autoSync,
          webhookSecret,
        })
        .where(eq(githubIntegrations.id, existing.id));
    } else {
      await db.insert(githubIntegrations).values({
        organizationId,
        accessToken: validated.accessToken,
        owner: validated.owner,
        repo: validated.repo,
        autoSync: validated.autoSync,
        webhookSecret,
      });
    }

    return NextResponse.json({
      success: true,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
      webhookSecret,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
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
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    await db
      .delete(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
