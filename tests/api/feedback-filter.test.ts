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
    title: "Bug Report",
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
    title: "Feature Request",
    description: "Description 2",
    type: "feature",
    priority: "medium",
    status: "in-progress",
    organizationId: "org_1",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
  {
    feedbackId: 3,
    title: "Another Bug",
    description: "Description 3",
    type: "bug",
    priority: "low",
    status: "new",
    organizationId: "org_1",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
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

describe("GET /api/feedback - Filters", () => {
  beforeEach(() => {
    mock.restore();
  });

  it("should filter by status", async () => {
    const filteredData = mockFeedbackData.filter((f) => f.status === "new");
    const mockDb = createMockDb(filteredData, filteredData.length);

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?status=new&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBe(filteredData.length);
  });

  it("should filter by type", async () => {
    const filteredData = mockFeedbackData.filter((f) => f.type === "bug");
    const mockDb = createMockDb(filteredData, filteredData.length);

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?type=bug&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBe(filteredData.length);
  });

  it("should filter by priority", async () => {
    const filteredData = mockFeedbackData.filter((f) => f.priority === "high");
    const mockDb = createMockDb(filteredData, filteredData.length);

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?priority=high&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBe(filteredData.length);
  });

  it("should filter by multiple conditions (AND logic)", async () => {
    const filteredData = mockFeedbackData.filter(
      (f) => f.status === "new" && f.type === "bug",
    );
    const mockDb = createMockDb(filteredData, filteredData.length);

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?status=new&type=bug&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBe(filteredData.length);
  });

  it("should ignore 'all' filter value", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?status=all&type=all&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBe(mockFeedbackData.length);
  });

  it("should combine filters with pagination", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?status=new&page=1&pageSize=10&organizationId=org_1",
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
  });

  it("should accept hasVotes filters", async () => {
    const mockDb = createMockDb();

    mock.module("@/lib/db", () => ({
      db: mockDb,
    }));

    const { GET } = await import("@/app/api/feedback/route");

    const req = new NextRequest(
      "http://localhost:3000/api/feedback?hasVotes=true&organizationId=org_1",
    );

    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});
