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

import { randomBytes, randomUUID, createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { user, verification } from "@/lib/db/schema";
import { sendEmail } from "@/lib/services/email";
import { logger } from "@/lib/logger";

const RESET_TOKEN_EXPIRY_HOURS = 1;
const RESET_TOKEN_BYTES = 32;

async function generateResetToken(): Promise<string> {
  return randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

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

  const parsed = forgotPasswordSchema.safeParse(body);
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

  const { email } = parsed.data;

  // Rate limit by IP + email to reduce abuse without leaking whether the email exists.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { response: rateLimitResponse } = await rateLimit(req, {
    windowMs: 60 * 60, // 1 hour
    maxRequests: 5,
    keyGenerator: async () => `auth:forgot-password:${ip}:${email}`,
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

    // Find user by email
    const users = await database
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (users.length === 0) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { message: "如果邮箱存在，您将收到重置密码的链接" },
        { status: 200 },
      );
    }

    const { id: userId, name } = users[0];

    // Generate reset token (store hashed token; send raw token via email)
    const token = await generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    // Store or update verification token
    await database
      .delete(verification)
      .where(
        and(
          eq(verification.identifier, `password-reset:${userId}`),
        ),
      );

    await database.insert(verification).values({
      id: randomUUID(),
      identifier: `password-reset:${userId}`,
      value: tokenHash,
      expiresAt,
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background: #0056b3; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
            .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Echo</div>
            </div>
            <div class="content">
              <h2>重置您的密码</h2>
              <p>您好 ${name || "用户"}，</p>
              <p>我们收到了您的密码重置请求。如果这是您的操作，请点击下方的按钮重置密码：</p>
              <a href="${resetUrl}" class="button">重置密码</a>
              <p>或者复制以下链接到浏览器：</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
              <div class="warning">
                <strong>注意：</strong>此链接将在 ${RESET_TOKEN_EXPIRY_HOURS} 小时后过期。如果您没有请求重置密码，请忽略此邮件。
              </div>
            </div>
            <div class="footer">
              <p>此邮件由系统自动发送，请勿回复。</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
重置您的密码

您好 ${name || "用户"}，

我们收到了您的密码重置请求。如果这是您的操作，请访问以下链接重置密码：

${resetUrl}

注意：此链接将在 ${RESET_TOKEN_EXPIRY_HOURS} 小时后过期。如果您没有请求重置密码，请忽略此邮件。

此邮件由系统自动发送，请勿回复。
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: "重置您的 Echo 密码",
      html: emailHtml,
      text: emailText,
    });

    const emailDiagnostics = {
      from: process.env.RESEND_FROM_EMAIL || "noreply@echo.app",
      to: email,
      subject: "重置您的 Echo 密码",
    };

    if (emailResult.success) {
      logger.info(
        { userId, email, ...emailDiagnostics, messageId: emailResult.messageId },
        "Password reset email accepted for delivery",
      );
    } else {
      logger.error(
        {
          userId,
          email,
          ...emailDiagnostics,
          resendError: emailResult.error,
        },
        "Password reset email delivery failed",
      );
      // Return success anyway to avoid email enumeration
    }

    return NextResponse.json(
      { message: "如果邮箱存在，您将收到重置密码的链接" },
      { status: 200 },
    );
  } catch (error) {
    logger.error({ err: error, email }, "Forgot password request failed");
    return NextResponse.json(
      { error: "服务器错误，请稍后重试", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
