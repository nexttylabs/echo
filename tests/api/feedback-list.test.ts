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

import { describe, expect, it, mock, beforeEach } from "bun:test";
import { NextRequest } from "next/server";

const mockFeedbackData = [
  {
    feedbackId: 1,
    title: "Test Feedback 1",
    description: "Description 1",
    type: "bug",
    priority: "high",
    status: "new",
    organizationId: "org_1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    feedbackId: 2,
    title: "Test Feedback 2",
    description: "Description 2",
    type: "feature",
    priority: "medium",
    status: "in-progress",
    organizationId: "org_1",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
];

const createMockDb = (data = mockFeedbackData, total = data.length) => ({
  select: mock(() => ({
    from: mock(() => ({
      where: mock(() => {
        const result = [{ value: total }];
        const adminRows = [{ role: "admin" }];
        return {
          orderBy: mock(() => ({
            limit: mock(() => ({
              offset: mock(() => Promise.resolve(data)),
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
});

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



mock.module("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

describe("GET /api/feedback", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("returns paginated feedback list with organization isolation", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?organizationId=org_1&page=1&pageSize=20",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
    expect(data).toHaveProperty("totalPages");
  });

  it("returns 400 when organizationId is missing", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?page=1&pageSize=20",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("MISSING_ORG_ID");
  });

  it("returns 400 for invalid pagination parameters", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?organizationId=org_1&page=0&pageSize=20",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_PAGINATION");
  });

  it("returns 400 when pageSize exceeds limit", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?organizationId=org_1&page=1&pageSize=200",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_PAGINATION");
  });

  it("supports sorting parameters", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?organizationId=org_1&sortBy=createdAt&sortOrder=asc",
    );

    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it("returns 500 when database is not configured", async () => {
    mock.module("@/lib/db", () => ({
      db: null,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("DATABASE_NOT_CONFIGURED");
  });
});
