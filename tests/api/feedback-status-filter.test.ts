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

import { describe, expect, it, mock, beforeEach } from "bun:test";
import { NextRequest } from "next/server";

describe("Feedback status filter validation", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("returns 400 for invalid status in /api/feedback", async () => {
    const mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => {
            const result = [{ value: 0 }];
            const adminRows = [{ role: "admin" }];
            return {
              orderBy: mock(() => ({
                limit: mock(() => ({
                  offset: mock(() => Promise.resolve([])),
                })),
              })),
              limit: mock(() => ({
                then: (resolve: (value: typeof adminRows) => void) =>
                  Promise.resolve(adminRows).then(resolve),
              })),
              then: (resolve: (value: typeof result) => void) =>
                Promise.resolve(result).then(resolve),
              [Symbol.iterator]: () => result[Symbol.iterator](),
            };
          }),
        })),
      })),
    };

    mock.module("next/headers", () => ({
      headers: () => Promise.resolve(new Headers()),
      cookies: () => Promise.resolve({ get: () => undefined }),
    }));

    mock.module("@/lib/auth/config", () => ({
      auth: {
        api: {
          getSession: mock(() => Promise.resolve({ user: { id: "user_1" } })),
        },
        options: {
          session: {
            expiresIn: 60 * 60 * 24 * 30,
          },
        },
      },
    }));

    mock.module("@/lib/db", () => ({ db: mockDb }));

    const { GET } = await import("@/app/api/feedback/route");
    const req = new NextRequest(
      "http://localhost:3000/api/feedback?status=processing&organizationId=org_1",
    );

    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid status in /api/v1/feedback", async () => {
    const mockDb = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => {
            const result = [{ value: 0 }];
            return {
              orderBy: mock(() => ({
                limit: mock(() => ({
                  offset: mock(() => Promise.resolve([])),
                })),
              })),
              then: (resolve: (value: typeof result) => void) =>
                Promise.resolve(result).then(resolve),
              [Symbol.iterator]: () => result[Symbol.iterator](),
            };
          }),
        })),
      })),
    };

    mock.module("@/lib/db", () => ({ db: mockDb }));
    mock.module("@/lib/middleware/api-key", () => ({
      requireApiKey: async () => ({
        context: { organizationId: "org_1", apiKeyId: 1 },
      }),
    }));

    const { GET } = await import("@/app/api/v1/feedback/route");
    const req = new NextRequest(
      "http://localhost:3000/api/v1/feedback?status=processing",
    );

    const response = await GET(req);
    expect(response.status).toBe(400);
  });
});
