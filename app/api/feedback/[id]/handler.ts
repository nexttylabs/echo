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

import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";

type VoteItem = {
  voteId: number;
  visitorId: string | null;
  userId: string | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
};

type Deps = {
  getFeedbackById: (id: number) => Promise<
    | {
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
      }
    | { deleted: true }
    | null
  >;
};

export function buildGetFeedbackHandler(deps: Deps) {
  return async function GET(
    _req: Request,
    { params }: { params: { id: string } },
  ) {
    const id = Number(params.id);

    if (!params.id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid feedback ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    try {
      const result = await deps.getFeedbackById(id);
      if (!result) {
        return NextResponse.json(
          { error: "Feedback not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      if ("deleted" in result) {
        return NextResponse.json(
          { error: "Feedback has been deleted", code: "DELETED" },
          { status: 404 },
        );
      }

      const { feedback, attachments, votes } = result;
      return NextResponse.json({
        data: {
          ...feedback,
          attachments,
          votes,
        },
      });
    } catch (error) {
      return apiError(error);
    }
  };
}
