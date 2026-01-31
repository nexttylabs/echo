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
import { getCurrentOrganizationId } from "@/lib/auth/organization";
import { apiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  default_branch: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

/**
 * Get list of repositories the user has access to
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
    // Get the GitHub integration to retrieve access token
    const integration = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.organizationId, organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!integration) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 404 },
      );
    }

    // Fetch repositories from GitHub
    const repos = await fetchUserRepos(integration.accessToken);

    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        owner: repo.owner.login,
        ownerAvatar: repo.owner.avatar_url,
        description: repo.description,
        defaultBranch: repo.default_branch,
        canPush: repo.permissions?.push ?? false,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  // Fetch all pages of repos (up to 500 to prevent infinite loops)
  while (page <= 5) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();
    allRepos.push(...repos);

    // If we got fewer repos than requested, we've reached the end
    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return allRepos;
}
