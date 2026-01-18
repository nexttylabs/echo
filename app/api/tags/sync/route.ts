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
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags, PREDEFINED_TAGS } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Invalid slug", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const predefined = PREDEFINED_TAGS.find((t) => t.slug === slug);

    if (!predefined) {
      return NextResponse.json(
        { error: "Unknown tag", code: "NOT_FOUND" },
        { status: 400 },
      );
    }

    let [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (!tag) {
      const [created] = await db
        .insert(tags)
        .values({
          name: predefined.name,
          slug: predefined.slug,
          color: "#3b82f6",
        })
        .returning();
      tag = created;
    }

    return NextResponse.json(tag);
  } catch (error) {
    return apiError(error);
  }
}
