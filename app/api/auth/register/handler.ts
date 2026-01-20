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

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import type { db as database } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { generateSlug } from "@/lib/utils/slug";
import { user, organizations, organizationMembers } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

type Database = NonNullable<typeof database>;

export type RegisterDeps = {
  auth: {
    api: {
      signUpEmail: (args: {
        body: {
          name: string;
          email: string;
          password: string;
        };
        returnHeaders?: boolean;
        headers?: Headers;
      }) => Promise<{ headers: Headers; response: { token: string | null; user: { id: string; email: string } } }>;
    };
  };
  db: {
    transaction: Database["transaction"];
    delete: Database["delete"];
  };
};

const EMAIL_EXISTS_MESSAGE = "User already exists. Use another email.";
const EMAIL_EXISTS_MATCH = "user already exists";

export function buildRegisterHandler(deps: RegisterDeps) {
  return async function POST(req: Request) {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const parsed = registerSchema.safeParse(body);
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

    const { name, email, password } = parsed.data;

    try {
      const { headers, response } = await deps.auth.api.signUpEmail({
        returnHeaders: true,
        body: { name, email, password },
        headers: req.headers,
      });

      const userId = response?.user?.id;
      if (!userId) {
        return NextResponse.json(
          { error: "Registration failed", code: "REGISTRATION_FAILED" },
          { status: 500 },
        );
      }

      const organizationId = randomUUID();
      const orgName = `${name}'s Organization`;
      const orgSlug = generateSlug(orgName);

      try {
        await deps.db.transaction(async (tx) => {
          await tx
            .insert(organizations)
            .values({ id: organizationId, name: orgName, slug: orgSlug });
          await tx
            .insert(organizationMembers)
            .values({ organizationId, userId, role: "admin" });
        });
      } catch (txError) {
        // Rollback: delete the user that was created by signUpEmail
        // This cascades to delete session and account records
        logger.error({ err: txError, userId }, "Organization setup failed, rolling back user creation");
        try {
          await deps.db.delete(user).where(eq(user.id, userId));
        } catch (deleteError) {
          logger.error({ err: deleteError, userId }, "Failed to rollback user creation");
        }
        throw txError;
      }

      const res = NextResponse.json(
        {
          data: {
            user: response.user,
            organization: {
              id: organizationId,
              name: orgName,
              slug: orgSlug,
            },
          },
          message: "Registration successful",
        },
        { status: 201 },
      );

      const setCookie = headers.get("set-cookie");
      if (setCookie) {
        res.headers.set("set-cookie", setCookie);
      }

      return res;
    } catch (error) {
      if (error instanceof APIError) {
        const message = String(error.message || "");
        const isEmailExists =
          message === EMAIL_EXISTS_MESSAGE ||
          message.toLowerCase().includes(EMAIL_EXISTS_MATCH);

        if (isEmailExists) {
          return NextResponse.json(
            { error: "邮箱已存在", code: "EMAIL_EXISTS" },
            { status: 409 },
          );
        }

        const status =
          typeof error.status === "number"
            ? error.status
            : error.status === "UNPROCESSABLE_ENTITY"
              ? 422
              : 400;

        return NextResponse.json(
          { error: error.message, code: "AUTH_ERROR" },
          { status },
        );
      }

      logger.error({ err: error }, "Registration failed with unexpected error");
      return NextResponse.json(
        { error: "Registration failed", code: "REGISTRATION_FAILED" },
        { status: 500 },
      );
    }
  };
}
