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

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import * as schema from "../db/schema";

if (!db) {
  throw new Error("DATABASE_URL is not configured");
}

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] BETTER_AUTH_SECRET is not set. Session cookies will be invalidated on server restart. " +
    "Set BETTER_AUTH_SECRET in .env.local to fix this."
  );
}

type SocialProviderName = "google" | "github";

const warnedMissingSocialProviders = new Set<SocialProviderName>();

function resolveSocialProviderFromEnv(
  provider: SocialProviderName,
  clientIdEnv: string,
  clientSecretEnv: string,
  env: NodeJS.ProcessEnv
) {
  const clientId = env[clientIdEnv];
  const clientSecret = env[clientSecretEnv];

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  if (env.NODE_ENV !== "test" && !warnedMissingSocialProviders.has(provider)) {
    warnedMissingSocialProviders.add(provider);
    console.warn(
      `[auth] ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET are required to enable ${provider} social login. Provider is disabled.`
    );
  }

  return null;
}

export function getSocialProvidersFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const google = resolveSocialProviderFromEnv(
    "google",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    env
  );
  const github = resolveSocialProviderFromEnv(
    "github",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    env
  );

  return {
    ...(google ? { google } : {}),
    ...(github ? { github } : {}),
  };
}

const socialProviders = getSocialProvidersFromEnv();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
  plugins: [nextCookies()],
});
