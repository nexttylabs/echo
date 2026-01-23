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
import { buildGetFeedbackHandler } from "@/app/api/feedback/[id]/handler";

type VoteItem = {
  voteId: number;
  visitorId: string | null;
  userId: string | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
};

type FeedbackResult = {
  feedback: Record<string, unknown>;
  attachments: unknown[];
  votes: {
    count: number;
    list: VoteItem[];
    userVote: {
      hasVoted: boolean;
      voteId: number | null;
    };
  };
} | { deleted: true } | null;

const makeDeps = (row?: FeedbackResult) => ({
  getFeedbackById: async () => row ?? null,
});

describe("GET /api/feedback/[id]", () => {
  it("returns 400 for invalid id", async () => {
    const handler = buildGetFeedbackHandler(makeDeps());
    const res = await handler(
      new Request("http://localhost/api/feedback/abc"),
      { params: { id: "abc" } },
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when missing", async () => {
    const handler = buildGetFeedbackHandler(makeDeps());
    const res = await handler(
      new Request("http://localhost/api/feedback/1"),
      { params: { id: "1" } },
    );

    expect(res.status).toBe(404);
  });
});
