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

import { describe, expect, it } from "bun:test";
import { buildCreateFeedbackHandler } from "@/app/api/feedback/handler";
import { feedback } from "@/lib/db/schema";

type FakeDeps = Parameters<typeof buildCreateFeedbackHandler>[0];

type InsertReturn = {
  values: (values: Record<string, unknown>) => {
    returning: () => Promise<Array<Record<string, unknown>>>;
  };
};

const makeDeps = () => {
  let inserted: Record<string, unknown> | null = null;

  const insert = (table?: unknown) => ({
    values: (values: Record<string, unknown>) => {
      if (table === feedback) {
        inserted = values;
      }
      return {
        returning: async () => [
          {
            feedbackId: 1,
            ...values,
            status: values.status ?? "new",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
    },
  });

  const db: FakeDeps["db"] = {
    insert: insert as unknown as () => InsertReturn,
  };

  return {
    db,
    getInserted: () => inserted,
  } satisfies FakeDeps & { getInserted: () => Record<string, unknown> | null };
};

const makeDepsWithInsertError = () => {
  const insert = () => ({
    values: () => ({
      returning: async () => {
        throw new Error("DB failure");
      },
    }),
  });

  const db: FakeDeps["db"] = {
    insert: insert as unknown as () => InsertReturn,
  };

  return { db } satisfies FakeDeps;
};

describe("POST /api/feedback", () => {
  it("creates feedback when payload is valid", async () => {
    const deps = makeDeps();
    const handler = buildCreateFeedbackHandler(deps);

    const res = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": "org_1",
        },
        body: JSON.stringify({
          title: "Great idea",
          description: "Please add dark mode",
          type: "feature",
          priority: "high",
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.feedbackId).toBe(1);
    expect(deps.getInserted()?.organizationId).toBe("org_1");
  });

  it("returns 400 when organization id is missing", async () => {
    const handler = buildCreateFeedbackHandler(makeDeps());

    const res = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Great idea",
          description: "Please add dark mode",
          type: "feature",
          priority: "high",
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when payload is invalid", async () => {
    const handler = buildCreateFeedbackHandler(makeDeps());

    const res = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": "org_1",
        },
        body: JSON.stringify({
          title: "",
          description: "x",
          type: "bug",
          priority: "high",
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when database insert fails", async () => {
    const handler = buildCreateFeedbackHandler(makeDepsWithInsertError());

    const res = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": "org_1",
        },
        body: JSON.stringify({
          title: "Great idea",
          description: "Please add dark mode",
          type: "feature",
          priority: "high",
        }),
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.code).toBe("INTERNAL_ERROR");
  });
});
