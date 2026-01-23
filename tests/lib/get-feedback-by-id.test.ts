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
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";

const makeDb = (rows: unknown[]) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  }),
});

describe("getFeedbackById", () => {
  it("returns null when missing", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await getFeedbackById(makeDb([]) as any, 1);
    expect(result).toBeNull();
  });
});
