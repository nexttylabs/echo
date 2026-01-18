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
import { auth } from "@/lib/auth/config";
import { deleteApiKey, toggleApiKey } from "@/lib/services/api-keys";
import { apiError } from "@/lib/api/errors";
import { getCurrentOrganizationId } from "@/lib/auth/organization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ keyId: string }>;
};

/**
 * DELETE /api/api-keys/:keyId - Delete API Key
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

  try {
    const { keyId } = await params;
    await deleteApiKey(parseInt(keyId), organizationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * PATCH /api/api-keys/:keyId - Update API Key (toggle disabled)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  try {
    const body = await req.json();
    const { disabled } = body;

    if (typeof disabled !== "boolean") {
      return NextResponse.json(
        { error: "disabled field is required (boolean)" },
        { status: 400 },
      );
    }

    const { keyId } = await params;
    await toggleApiKey(parseInt(keyId), organizationId, disabled);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
