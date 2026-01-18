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

type InsertStub = {
  insert: () => {
    values: () => {
      returning: () => Promise<unknown[]>;
    };
  };
};

const makeDb = () => ({
  insert: () => ({
    values: () => ({
      returning: async () => [
        {
          feedbackId: 1,
          title: "t",
          description: "d",
          type: "bug",
          priority: "low",
          status: "new",
          organizationId: "org",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    }),
  }),
});

describe("POST /api/feedback", () => {
  it("returns trackingUrl", async () => {
    const handler = buildCreateFeedbackHandler({ db: makeDb() as InsertStub });
    const res = await handler(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": "org",
        },
        body: JSON.stringify({
          title: "t",
          description: "d",
          type: "bug",
          priority: "low",
        }),
      }),
    );

    const json = await res.json();
    expect(json.data.trackingUrl).toBe("/feedback/1");
  });
});
