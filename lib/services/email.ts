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

import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  success: boolean;
  error?: string;
  messageId?: string;
};

export async function sendEmail(
  payload: SendEmailPayload,
): Promise<SendEmailResult> {
  const { to, subject, html, text } = payload;
  const from = process.env.RESEND_FROM_EMAIL || "noreply@echo.app";

  if (process.env.NODE_ENV !== "test") {
    logger.info({ from, to, subject }, "Email send requested");
  }

  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      logger.warn("RESEND_API_KEY not set, skipping email send");
    }
    return { success: true };
  }

  try {
    const resendResponse = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (resendResponse.error) {
      const errorMessage = [
        resendResponse.error.name,
        resendResponse.error.message,
      ]
        .filter(Boolean)
        .join(": ") || "Unknown Resend API error";

      logger.error(
        {
          from,
          to,
          subject,
          error: resendResponse.error,
        },
        "Resend reported email delivery failure",
      );
      return { success: false, error: `Resend API error: ${errorMessage}` };
    }

    const messageId = resendResponse.data?.id;

    if (process.env.NODE_ENV !== "test") {
      logger.info(
        { from, to, subject, messageId },
        "Email accepted by Resend",
      );
    }

    return { success: true, messageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMsg, from, to, subject },
      "Failed to send email",
    );
    return { success: false, error: errorMsg };
  }
}
