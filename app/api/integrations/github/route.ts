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

// Schema for setting up repository (after OAuth)
const setupRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

// Schema for updating configuration
const updateConfigSchema = z.object({
  owner: z.string().min(1).optional(),
  repo: z.string().min(1).optional(),
  autoSync: z.boolean().optional(),
  syncTriggerStatuses: z.array(z.string()).optional(),
  syncStatusChanges: z.boolean().optional(),
  syncComments: z.boolean().optional(),
  autoAddLabels: z.boolean().optional(),
});

// Legacy schema for PAT-based setup (kept for backward compatibility)
const createGitHubIntegrationSchema = z.object({
  accessToken: z.string().min(1),
  owner: z.string().min(1),
  repo: z.string().min(1),
  autoSync: z.boolean().optional().default(true),
});

/**
 * GET /api/integrations/github
 * Get current GitHub integration configuration
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
      return NextResponse.json({ configured: false, connected: false });
    }

    // Check if OAuth is connected (has access token)
    const connected = !!config.accessToken;
    // Check if repository is configured
    const repoConfigured = !!config.owner && !!config.repo;

    return NextResponse.json({
      configured: connected && repoConfigured,
      connected,
      repoConfigured,
      owner: config.owner || null,
      repo: config.repo || null,
      autoSync: config.autoSync,
      syncTriggerStatuses: config.syncTriggerStatuses || ["in-progress", "planned"],
      syncStatusChanges: config.syncStatusChanges,
      syncComments: config.syncComments,
      autoAddLabels: config.autoAddLabels,
      lastSyncAt: config.lastSyncAt?.toISOString() || null,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/integrations/github
 * Set up repository for connected GitHub integration
 * Also supports legacy PAT-based setup for backward compatibility
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
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    // Check if this is legacy PAT-based setup or OAuth repo setup
    if (body.accessToken) {
      // Legacy PAT-based setup
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
            connectedBy: session.user.id,
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
          connectedBy: session.user.id,
        });
      }

      return NextResponse.json({
        success: true,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
        webhookSecret,
      });
    } else {
      // OAuth repo setup - set repository for existing OAuth connection
      const validated = setupRepoSchema.parse(body);

      const existing = await db
        .select()
        .from(githubIntegrations)
        .where(eq(githubIntegrations.organizationId, organizationId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!existing) {
        return NextResponse.json(
          { error: "GitHub not connected. Please connect your GitHub account first." },
          { status: 400 },
        );
      }

      // Validate that the token can access this repo
      const client = new GitHubClient({
        accessToken: existing.accessToken,
        owner: validated.owner,
        repo: validated.repo,
      });
      const isValid = await client.validateToken();

      if (!isValid) {
        return NextResponse.json(
          { error: "Cannot access this repository. Please check permissions." },
          { status: 400 },
        );
      }

      const webhookSecret = existing.webhookSecret || randomBytes(32).toString("hex");

      await db
        .update(githubIntegrations)
        .set({
          owner: validated.owner,
          repo: validated.repo,
          webhookSecret,
        })
        .where(eq(githubIntegrations.id, existing.id));

      return NextResponse.json({
        success: true,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
        webhookSecret,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}

/**
 * PATCH /api/integrations/github
 * Update GitHub integration configuration
 */
export async function PATCH(req: NextRequest) {
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
    const validated = updateConfigSchema.parse(body);

    const existing = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existing) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404 },
      );
    }

    // If changing repo, validate access
    if (validated.owner && validated.repo) {
      const client = new GitHubClient({
        accessToken: existing.accessToken,
        owner: validated.owner,
        repo: validated.repo,
      });
      const isValid = await client.validateToken();

      if (!isValid) {
        return NextResponse.json(
          { error: "Cannot access this repository" },
          { status: 400 },
        );
      }
    }

    await db
      .update(githubIntegrations)
      .set({
        ...(validated.owner && { owner: validated.owner }),
        ...(validated.repo && { repo: validated.repo }),
        ...(validated.autoSync !== undefined && { autoSync: validated.autoSync }),
        ...(validated.syncTriggerStatuses && { syncTriggerStatuses: validated.syncTriggerStatuses }),
        ...(validated.syncStatusChanges !== undefined && { syncStatusChanges: validated.syncStatusChanges }),
        ...(validated.syncComments !== undefined && { syncComments: validated.syncComments }),
        ...(validated.autoAddLabels !== undefined && { autoAddLabels: validated.autoAddLabels }),
      })
      .where(eq(githubIntegrations.id, existing.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}

/**
 * DELETE /api/integrations/github
 * Disconnect GitHub integration
 */
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
