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
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createHash } from "crypto";

export interface ApiKeyContext {
  organizationId: string;
  apiKeyId: number;
}

export interface AuthResult {
  error?: NextResponse;
  context?: ApiKeyContext;
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function requireApiKey(req: NextRequest): Promise<AuthResult> {
  const apiKey =
    req.headers.get("X-API-Key") ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return {
      error: NextResponse.json(
        {
          error: "API key is required",
          code: "MISSING_API_KEY",
        },
        { status: 401 },
      ),
    };
  }

  if (!db) {
    return {
      error: NextResponse.json(
        {
          error: "Database not configured",
          code: "DATABASE_NOT_CONFIGURED",
        },
        { status: 500 },
      ),
    };
  }

  try {
    const hashedKey = hashApiKey(apiKey);

    const keyRecord = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.hashedKey, hashedKey))
      .limit(1);

    if (keyRecord.length === 0) {
      return {
        error: NextResponse.json(
          {
            error: "Invalid API key",
            code: "INVALID_API_KEY",
          },
          { status: 401 },
        ),
      };
    }

    const key = keyRecord[0];

    if (key.disabled) {
      return {
        error: NextResponse.json(
          {
            error: "API key is disabled",
            code: "API_KEY_DISABLED",
          },
          { status: 401 },
        ),
      };
    }

    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.keyId, key.keyId));

    return {
      context: {
        organizationId: key.organizationId,
        apiKeyId: key.keyId,
      },
    };
  } catch (error) {
    logger.error({ err: error }, "API key authentication failed");
    return {
      error: NextResponse.json(
        {
          error: "Authentication failed",
          code: "AUTH_ERROR",
        },
        { status: 500 },
      ),
    };
  }
}
