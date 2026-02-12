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

import { createHash } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { verification, account } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  // Rate limit reset attempts by IP to reduce token brute force.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { response: rateLimitResponse } = await rateLimit(req, {
    windowMs: 60 * 10, // 10 minutes
    maxRequests: 30,
    keyGenerator: async () => `auth:reset-password:${ip}`,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    if (!db) {
      logger.error("Database is not configured");
      return NextResponse.json(
        { error: "服务器错误，请稍后重试", code: "SERVER_ERROR" },
        { status: 500 },
      );
    }

    const database = db;

    // Find valid verification token
    const now = new Date();
    const tokenHash = hashResetToken(token);
    const verifications = await database
      .select({ id: verification.id, identifier: verification.identifier })
      .from(verification)
      .where(
        and(
          eq(verification.value, tokenHash),
          gt(verification.expiresAt, now),
        ),
      )
      .limit(1);

    if (verifications.length === 0) {
      return NextResponse.json(
        { error: "重置令牌无效或已过期", code: "INVALID_TOKEN" },
        { status: 400 },
      );
    }

    const { id: verificationId, identifier } = verifications[0];

    // Extract userId from identifier
    const userId = identifier.replace("password-reset:", "");

    // Hash new password using better-auth
    const { data: passwordHash, error } = await auth.api.hashPassword({
      body: { password },
    });

    if (error || !passwordHash) {
      logger.error({ error }, "Failed to hash password");
      return NextResponse.json(
        { error: "密码重置失败", code: "HASH_ERROR" },
        { status: 500 },
      );
    }

    // Update user's password
    await database
      .update(account)
      .set({ password: passwordHash })
      .where(eq(account.userId, userId));

    // Delete the verification token
    await database.delete(verification).where(eq(verification.id, verificationId));

    logger.info({ userId }, "Password reset successfully");

    return NextResponse.json(
      { message: "密码重置成功，请使用新密码登录" },
      { status: 200 },
    );
  } catch (error) {
    logger.error({ err: error }, "Reset password request failed");
    return NextResponse.json(
      { error: "服务器错误，请稍后重试", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
