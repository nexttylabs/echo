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
import { z } from "zod";
import { createApiKey, listApiKeys } from "@/lib/services/api-keys";
import { apiError, validationError } from "@/lib/api/errors";
import { getCurrentOrganizationId } from "@/lib/auth/organization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
});

/**
 * GET /api/api-keys - List API Keys
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

  try {
    const keys = await listApiKeys(organizationId);

    const sanitized = keys.map((k) => ({
      keyId: k.keyId,
      name: k.name,
      prefix: k.prefix,
      displayKey: `${k.prefix}...`,
      disabled: k.disabled,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
    }));

    return NextResponse.json({ data: sanitized });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/api-keys - Create API Key
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

  try {
    const body = await req.json();
    const validated = createKeySchema.parse(body);

    const { key, record } = await createApiKey(
      organizationId,
      validated.name,
      validated.expiresInDays,
    );

    return NextResponse.json(
      {
        data: {
          keyId: record.keyId,
          name: record.name,
          prefix: record.prefix,
          key,
          disabled: record.disabled,
          createdAt: record.createdAt,
          warning: "Save this key now. You will not be able to see it again.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }
    return apiError(error);
  }
}
