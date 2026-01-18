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
import { db } from "@/lib/db";
import { organizationSettings, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Internal API for domain lookup (used by middleware)
 * GET /api/internal/domain-lookup?domain=feedback.acme.com
 */
export async function GET(req: NextRequest) {
  // Verify middleware secret to prevent external access
  const secret = req.headers.get("x-middleware-secret");
  if (secret !== process.env.MIDDLEWARE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "Domain required" }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const [organization] = await db
      .select({
        organizationId: organizations.id,
        orgSlug: organizations.slug,
      })
      .from(organizationSettings)
      .innerJoin(organizations, eq(organizationSettings.organizationId, organizations.id))
      .where(eq(organizationSettings.customDomain, domain))
      .limit(1);

    if (!organization) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      orgSlug: organization.orgSlug,
      organizationId: organization.organizationId,
    });
  } catch (error) {
    console.error("Domain lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
