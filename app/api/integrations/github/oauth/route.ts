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
import { getCurrentOrganizationId } from "@/lib/auth/organization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";

/**
 * Initiate GitHub OAuth flow
 * Redirects user to GitHub authorization page
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

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 500 },
    );
  }

  // Build OAuth state for security (includes org ID and user ID)
  const state = Buffer.from(
    JSON.stringify({
      organizationId,
      userId: session.user.id,
      timestamp: Date.now(),
    }),
  ).toString("base64url");

  // Build callback URL
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`;

  // GitHub OAuth scopes needed for repo access
  const scopes = ["repo", "read:user", "user:email"].join(" ");

  const authUrl = new URL(GITHUB_OAUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
