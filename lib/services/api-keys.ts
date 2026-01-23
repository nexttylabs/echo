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

import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

/**
 * Generate API Key
 * Format: echo_{orgId}_{random}
 */
export function generateApiKey(organizationId: string): string {
  const random = randomBytes(32)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 32);
  return `echo_${organizationId.slice(0, 8)}_${random}`;
}

/**
 * Hash API Key (SHA-256)
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Extract key prefix for display
 */
export function extractApiKeyPrefix(key: string): string {
  return key.substring(0, 20);
}

/**
 * Create API Key
 */
export async function createApiKey(
  organizationId: string,
  name: string,
  expiresInDays?: number,
) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const rawKey = generateApiKey(organizationId);
  const hashedKey = hashApiKey(rawKey);
  const prefix = extractApiKeyPrefix(rawKey);

  let expiresAt: Date | undefined;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  const [record] = await db
    .insert(apiKeys)
    .values({
      organizationId,
      name,
      hashedKey,
      prefix,
    })
    .returning();

  return {
    key: rawKey,
    record,
  };
}

/**
 * List organization's API Keys
 */
export async function listApiKeys(organizationId: string) {
  if (!db) {
    throw new Error("Database not configured");
  }

  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, organizationId))
    .orderBy(apiKeys.createdAt);
}

/**
 * Delete API Key
 */
export async function deleteApiKey(
  keyId: number,
  organizationId: string,
): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.keyId, keyId), eq(apiKeys.organizationId, organizationId)));
}

/**
 * Toggle API Key disabled status
 */
export async function toggleApiKey(
  keyId: number,
  organizationId: string,
  disabled: boolean,
): Promise<void> {
  if (!db) {
    throw new Error("Database not configured");
  }

  await db
    .update(apiKeys)
    .set({ disabled })
    .where(and(eq(apiKeys.keyId, keyId), eq(apiKeys.organizationId, organizationId)));
}

/**
 * Verify API Key and return record if valid
 */
export async function verifyApiKey(key: string) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const hashedKey = hashApiKey(key);

  const keyRecord = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.hashedKey, hashedKey))
    .limit(1);

  if (keyRecord.length === 0) {
    return null;
  }

  const record = keyRecord[0];

  if (record.disabled) {
    return null;
  }

  return record;
}
