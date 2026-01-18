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

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Stub Jest fake timers check for @testing-library/dom compatibility
const globalWithJest = globalThis as typeof globalThis & {
  jestFakeTimersAreEnabled?: () => boolean;
  jest?: {
    advanceTimersByTime?: (ms: number) => void;
  };
};

globalWithJest.jestFakeTimersAreEnabled = () => false;
globalWithJest.jest = { advanceTimersByTime: () => {} };

// Register happy-dom globals
GlobalRegistrator.register();

// Set required environment variables for tests
process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
process.env.MIDDLEWARE_SECRET = "test-secret";
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

// Mock fetch for domain lookup during tests
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  if (url.includes("/api/internal/domain-lookup")) {
    return new Response(JSON.stringify({ orgSlug: "demo", organizationId: "org_1" }), { status: 200 });
  }
  // Allow explicit org lookup bypass
  if (url.includes("example.com")) {
      return new Response("OK", { status: 200 });
  }
  if (!originalFetch) {
    throw new Error("fetch is not available in this environment");
  }
  // Fallback to real fetch for other requests
  return originalFetch(input, init);
}) as typeof fetch;

import { mock } from "bun:test";
mock.module("better-auth/react", () => ({
  createAuthClient: () => ({
    useSession: () => ({
      data: { user: { id: "test-user" } },
      isPending: false,
      error: null,
    }),
    signIn: mock(() => Promise.resolve()),
    signOut: mock(() => Promise.resolve()),
  }),
}));
