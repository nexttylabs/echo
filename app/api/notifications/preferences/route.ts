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
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
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

    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1);

    return NextResponse.json({
      data: prefs || { statusChange: true, newComment: true },
    });
  } catch (error) {
    return apiError(error);
  }
}

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
    const statusChange = body.statusChange ?? true;
    const newComment = body.newComment ?? true;

    const [existing] = await db
      .select({ userId: notificationPreferences.userId })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({ statusChange, newComment })
        .where(eq(notificationPreferences.userId, session.user.id));
    } else {
      await db.insert(notificationPreferences).values({
        userId: session.user.id,
        statusChange,
        newComment,
      });
    }

    return NextResponse.json({
      data: { statusChange, newComment },
      message: "Preferences saved successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}
