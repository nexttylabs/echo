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
import { buildCreateFeedbackHandler } from "@/app/api/feedback/handler";

type InsertStub = {
  insert: () => {
    values: () => {
      returning: () => Promise<unknown[]>;
    };
  };
};

const makeDb = (overrides?: Partial<Record<string, unknown>>) => ({
  insert: () => ({
    values: () => ({
      returning: async () => [
        {
          feedbackId: 1,
          title: "Customer reported issue",
          description: "Customer cannot login",
          type: "bug",
          priority: "high",
          status: "new",
          organizationId: "org",
          submittedOnBehalf: true,
          submittedBy: "user-1",
          customerInfo: {
            name: "John Doe",
            email: "john@example.com",
            phone: "+86 13800000000",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          ...overrides,
        },
      ],
    }),
  }),
});

describe("POST /api/feedback (submit on behalf)", () => {
  it("should allow customer support to submit on behalf", async () => {
    const formData = {
      title: "Customer reported issue",
      description: "Customer cannot login",
      type: "bug",
      priority: "high",
      submittedOnBehalf: true,
      customerInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+86 13800000000",
      },
    };

    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
          "x-user-role": "customer_support",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.submittedOnBehalf).toBe(true);
    expect(data.data.customerInfo).toBeDefined();
    expect(data.data.customerInfo.name).toBe("John Doe");
    expect(data.data.trackingUrl).toBe("/feedback/1");
  });

  it("should allow admin to submit on behalf", async () => {
    const formData = {
      title: "Admin submitted feedback",
      description: "Admin creating feedback for customer",
      type: "feature",
      priority: "medium",
      submittedOnBehalf: true,
      customerInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
      },
    };

    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "admin-1",
          "x-user-role": "admin",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    expect(response.status).toBe(201);
  });

  it("should reject developer trying to submit on behalf", async () => {
    const formData = {
      title: "Test",
      description: "Test description",
      type: "bug",
      priority: "medium",
      submittedOnBehalf: true,
      customerInfo: {
        name: "Test",
        email: "test@example.com",
      },
    };

    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "dev-1",
          "x-user-role": "developer",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
  });

  it("should reject customer trying to submit on behalf", async () => {
    const formData = {
      title: "Test",
      description: "Test description",
      type: "bug",
      priority: "medium",
      submittedOnBehalf: true,
      customerInfo: {
        name: "Test",
        email: "test@example.com",
      },
    };

    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "customer-1",
          "x-user-role": "customer",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
  });

  it("should require customer info when submitting on behalf", async () => {
    const formData = {
      title: "Test",
      description: "Test description",
      type: "bug",
      priority: "medium",
      submittedOnBehalf: true,
    };

    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
          "x-user-role": "customer_support",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("CUSTOMER_INFO_REQUIRED");
  });

  it("should allow normal submission without on-behalf flag", async () => {
    const formData = {
      title: "Normal feedback",
      description: "This is a normal feedback",
      type: "feature",
      priority: "low",
    };

    const normalDb = {
      insert: () => ({
        values: () => ({
          returning: async () => [
            {
              feedbackId: 2,
              title: "Normal feedback",
              description: "This is a normal feedback",
              type: "feature",
              priority: "low",
              status: "new",
              organizationId: "org",
              submittedOnBehalf: false,
              submittedBy: null,
              customerInfo: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }),
      }),
    };

    const handler = buildCreateFeedbackHandler({ db: normalDb as InsertStub });
    const response = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": "org",
        },
        body: JSON.stringify(formData),
      }),
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.submittedOnBehalf).toBe(false);
    expect(data.data.customerInfo).toBeNull();
  });
});
