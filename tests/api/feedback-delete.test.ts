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

describe("DELETE /api/feedback/[id]", () => {
  describe("GET handler - deleted feedback", () => {
    it("returns 404 for deleted feedback", async () => {
      const handler = buildGetFeedbackHandler(
        makeDeps({ deleted: true }),
      );
      const res = await handler(
        new Request("http://localhost/api/feedback/1"),
        { params: { id: "1" } },
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.code).toBe("DELETED");
      expect(body.error).toBe("Feedback has been deleted");
    });

    it("returns feedback data when not deleted", async () => {
      const mockFeedback = {
        feedback: {
          feedbackId: 1,
          title: "Test feedback",
          description: "Test description",
          type: "bug",
          priority: "medium",
          status: "new",
        },
        attachments: [],
        votes: { count: 0, list: [], userVote: { hasVoted: false, voteId: null } },
      };

      const handler = buildGetFeedbackHandler(makeDeps(mockFeedback));
      const res = await handler(
        new Request("http://localhost/api/feedback/1"),
        { params: { id: "1" } },
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.feedbackId).toBe(1);
      expect(body.data.title).toBe("Test feedback");
    });
  });
});

describe("Soft delete permissions", () => {
  it("should have DELETE_FEEDBACK permission for admin", async () => {
    const { ROLE_PERMISSIONS, PERMISSIONS } = await import(
      "@/lib/auth/permissions"
    );
    expect(ROLE_PERMISSIONS.admin).toContain(PERMISSIONS.DELETE_FEEDBACK);
  });

  it("should have DELETE_FEEDBACK permission for product_manager", async () => {
    const { ROLE_PERMISSIONS, PERMISSIONS } = await import(
      "@/lib/auth/permissions"
    );
    expect(ROLE_PERMISSIONS.product_manager).toContain(
      PERMISSIONS.DELETE_FEEDBACK,
    );
  });

  it("should NOT have DELETE_FEEDBACK permission for developer", async () => {
    const { ROLE_PERMISSIONS, PERMISSIONS } = await import(
      "@/lib/auth/permissions"
    );
    expect(ROLE_PERMISSIONS.developer).not.toContain(
      PERMISSIONS.DELETE_FEEDBACK,
    );
  });

  it("should NOT have DELETE_FEEDBACK permission for customer_support", async () => {
    const { ROLE_PERMISSIONS, PERMISSIONS } = await import(
      "@/lib/auth/permissions"
    );
    expect(ROLE_PERMISSIONS.customer_support).not.toContain(
      PERMISSIONS.DELETE_FEEDBACK,
    );
  });

  it("should NOT have DELETE_FEEDBACK permission for customer", async () => {
    const { ROLE_PERMISSIONS, PERMISSIONS } = await import(
      "@/lib/auth/permissions"
    );
    expect(ROLE_PERMISSIONS.customer).not.toContain(PERMISSIONS.DELETE_FEEDBACK);
  });
});

describe("canDeleteFeedback helper", () => {
  it("returns true for admin", async () => {
    const { canDeleteFeedback } = await import("@/lib/auth/permissions");
    expect(canDeleteFeedback("admin")).toBe(true);
  });

  it("returns true for product_manager", async () => {
    const { canDeleteFeedback } = await import("@/lib/auth/permissions");
    expect(canDeleteFeedback("product_manager")).toBe(true);
  });

  it("returns false for developer", async () => {
    const { canDeleteFeedback } = await import("@/lib/auth/permissions");
    expect(canDeleteFeedback("developer")).toBe(false);
  });

  it("returns false for customer_support", async () => {
    const { canDeleteFeedback } = await import("@/lib/auth/permissions");
    expect(canDeleteFeedback("customer_support")).toBe(false);
  });

  it("returns false for customer", async () => {
    const { canDeleteFeedback } = await import("@/lib/auth/permissions");
    expect(canDeleteFeedback("customer")).toBe(false);
  });
});
