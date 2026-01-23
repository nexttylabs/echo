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
import { FeedbackStatusEnum } from "@/lib/validations/feedback";
import { GET } from "@/app/api/v1/spec/route";

const expectedStatuses = [
  "new",
  "in-progress",
  "planned",
  "completed",
  "closed",
];

describe("Feedback status enum", () => {
  it("uses canonical status values in validation", () => {
    expect(FeedbackStatusEnum.options).toEqual(expectedStatuses);
  });

  it("uses canonical status values in OpenAPI spec", async () => {
    const response = await GET();
    const spec = await response.json();

    const feedbackStatusEnum =
      spec.components.schemas.Feedback.properties.status.enum;
    expect(feedbackStatusEnum).toEqual(expectedStatuses);

    const updateStatusEnum =
      spec.paths["/api/v1/feedback/{id}"].put.requestBody.content[
        "application/json"
      ].schema.properties.status.enum;
    expect(updateStatusEnum).toEqual(expectedStatuses);
  });
});
