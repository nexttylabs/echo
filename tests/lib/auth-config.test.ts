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

import { describe, expect, it } from "bun:test";

const TEST_DATABASE_URL = "postgres://user:pass@localhost:5432/echo";

async function loadAuthConfig() {
  process.env.DATABASE_URL ??= TEST_DATABASE_URL;
  return import("@/lib/auth/config");
}

describe("auth session config", () => {
  it("uses 30-day session expiry", async () => {
    const { auth } = await loadAuthConfig();
    expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 30);
  });
});

describe("auth social provider config", () => {
  it("enables google and github providers when env vars are set", async () => {
    const { getSocialProvidersFromEnv } = await loadAuthConfig();
    const providers = getSocialProvidersFromEnv({
      ...process.env,
      NODE_ENV: "test",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: "github-client-secret",
    });

    expect(providers.google).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });
    expect(providers.github).toEqual({
      clientId: "github-client-id",
      clientSecret: "github-client-secret",
    });
  });

  it("does not enable a provider when its env pair is missing", async () => {
    const { getSocialProvidersFromEnv } = await loadAuthConfig();
    const providers = getSocialProvidersFromEnv({
      ...process.env,
      NODE_ENV: "test",
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: undefined,
    });

    expect(providers.google).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });
    expect(providers.github).toBeUndefined();
  });
});
