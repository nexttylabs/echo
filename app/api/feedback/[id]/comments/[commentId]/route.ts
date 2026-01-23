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
import { comments } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiError } from "@/lib/api/errors";
import type { UserRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const { commentId } = await params;
    const commentIdNum = parseInt(commentId);

    if (isNaN(commentIdNum)) {
      return NextResponse.json(
        { error: "Invalid comment ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    
    // Get user role from organization membership
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("orgId")?.value;
    
    let userRole: UserRole | null = null;
    if (currentOrgId) {
      const { getUserRoleInOrganization } = await import("@/lib/auth/organization");
      userRole = await getUserRoleInOrganization(db, userId, currentOrgId);
    }

    const [existingComment] = await db
      .select({
        commentId: comments.commentId,
        userId: comments.userId,
      })
      .from(comments)
      .where(eq(comments.commentId, commentIdNum))
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Users can delete their own comments, or admins/owners can delete any
    const canDelete =
      existingComment.userId === userId || userRole === "admin" || userRole === "owner";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Insufficient permissions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const [deletedComment] = await db
      .delete(comments)
      .where(eq(comments.commentId, commentIdNum))
      .returning();

    return NextResponse.json({
      data: deletedComment,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return apiError(error);
  }
}
