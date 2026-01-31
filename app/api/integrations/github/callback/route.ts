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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

interface OAuthState {
  organizationId: string;
  userId: string;
  timestamp: number;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

/**
 * Handle GitHub OAuth callback
 * Exchange authorization code for access token and save integration
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from GitHub
  if (error) {
    const errorDesc = searchParams.get("error_description") || error;
    return redirectToSettings(`GitHub authorization failed: ${errorDesc}`);
  }

  if (!code || !stateParam) {
    return redirectToSettings("Missing authorization code or state");
  }

  // Validate state parameter
  let state: OAuthState;
  try {
    state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
  } catch {
    return redirectToSettings("Invalid state parameter");
  }

  // Check state age
  if (Date.now() - state.timestamp > STATE_MAX_AGE_MS) {
    return redirectToSettings("Authorization request expired");
  }

  // Verify user session
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.id !== state.userId) {
    return redirectToSettings("Session mismatch - please try again");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToSettings("GitHub OAuth not configured");
  }

  if (!db) {
    return redirectToSettings("Database not configured");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData: GitHubTokenResponse = await tokenResponse.json();

    if (tokenData.error) {
      return redirectToSettings(
        `Token exchange failed: ${tokenData.error_description || tokenData.error}`,
      );
    }

    if (!tokenData.access_token) {
      return redirectToSettings("No access token received");
    }

    // Get user info to verify token works
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userResponse.ok) {
      return redirectToSettings("Failed to verify GitHub token");
    }

    // Check if integration already exists
    const existing = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, state.organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    // Calculate token expiry if provided
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    if (existing) {
      // Update existing integration with new token
      await db
        .update(githubIntegrations)
        .set({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt,
          connectedBy: state.userId,
        })
        .where(eq(githubIntegrations.id, existing.id));
    } else {
      // Create new integration (repo will be selected in next step)
      await db.insert(githubIntegrations).values({
        organizationId: state.organizationId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt,
        owner: "", // Will be set when user selects a repo
        repo: "", // Will be set when user selects a repo
        connectedBy: state.userId,
      });
    }

    // Redirect back to settings with success
    return redirectToSettings(null, true);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return redirectToSettings("An unexpected error occurred");
  }
}

function redirectToSettings(error: string | null, success = false): NextResponse {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations`,
  );
  if (error) {
    url.searchParams.set("error", error);
  }
  if (success) {
    url.searchParams.set("github_connected", "true");
  }
  return NextResponse.redirect(url.toString());
}
