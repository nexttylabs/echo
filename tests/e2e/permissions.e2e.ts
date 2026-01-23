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

import { randomUUID } from "crypto";
import type { APIRequestContext, Page } from "@playwright/test";
import { test, expect, TestHelpers, uniqueEmail, uniqueName } from "./helpers/test-utils";
import { TestDataManager } from "./fixtures/test-data";

const password = "StrongPass123!";
const baseUrl = "http://localhost:3000";

type TestUser = {
  email: string;
  name: string;
  password: string;
};

async function registerUser(request: APIRequestContext, user: TestUser) {
  const response = await request.post("/api/auth/register", { data: user });
  if (!response.ok()) {
    throw new Error("Failed to register test user");
  }
  return response.json();
}

async function registerAndLoginUser(
  helpers: TestHelpers,
  request: APIRequestContext,
  user: TestUser,
) {
  const json = await registerUser(request, user);
  await helpers.login(user.email, user.password);
  return {
    organizationId: json?.data?.organization?.id as string,
    organizationSlug: json?.data?.organization?.slug as string,
    userId: json?.data?.user?.id as string,
    organizationName: json?.data?.organization?.name as string,
  };
}

async function setOrgCookie(page: Page, organizationId: string) {
  await page.context().addCookies([
    {
      name: "orgId",
      value: organizationId,
      url: baseUrl,
    },
  ]);
}

async function inviteUser(
  request: APIRequestContext,
  organizationId: string,
  email: string,
  role: string,
) {
  const response = await request.post(`/api/organizations/${organizationId}/invitations`, {
    data: { email, role },
  });
  if (!response.ok()) {
    throw new Error("Failed to invite user to organization");
  }
  const json = await response.json();
  return json?.data?.token as string;
}

async function acceptInvite(
  request: APIRequestContext,
  token: string,
) {
  const response = await request.post("/api/invitations/accept", {
    data: { token },
  });
  if (!response.ok()) {
    throw new Error("Failed to accept invitation");
  }
}

test.describe("E2E-UF-026: Unauthorized access protection", () => {
  test("redirects to login when accessing protected pages without authentication", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/settings/profile",
      "/settings/organization",
      "/admin/feedback",
      "/admin/feedback/123/edit",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/\/login/);
      await expect(page.locator('input[name="email"], #email')).toBeVisible();
      await expect(page.locator('input[name="password"], #password')).toBeVisible();
    }
  });

  test("returns 401 for API endpoints without authentication", async ({ request }) => {
    const endpoints = [
      { method: "get", url: "/api/feedback" },
      { method: "get", url: "/api/api-keys" },
      { method: "post", url: "/api/organizations", data: { name: `Unauthorized Org ${Date.now()}` } },
      { method: "post", url: `/api/organizations/${randomUUID()}/invitations`, data: { email: uniqueEmail(), role: "developer" } },
    ] as const;

    for (const endpoint of endpoints) {
      const response =
        endpoint.method === "get"
          ? await request.get(endpoint.url)
          : await request.post(endpoint.url, { data: endpoint.data });
      expect(response.status()).toBe(401);
    }
  });

  test("prevents direct URL access to admin pages", async ({ page }) => {
    await page.goto("/admin/feedback");
    await page.waitForURL(/\/login/);

    await page.goto("/admin/feedback/123/edit");
    await page.waitForURL(/\/login/);
  });
});

test.describe("E2E-UF-027: Role-based feedback permissions", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let adminUser: TestUser;
  let memberUser: TestUser;
  let supportUser: TestUser;
  let organizationId: string;
  let feedbackId: number;
  let memberInviteToken: string;
  let supportInviteToken: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    testDataManager = new TestDataManager(page.request);

    adminUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const adminInfo = await registerAndLoginUser(helpers, request, adminUser);
    organizationId = adminInfo.organizationId;
    await setOrgCookie(page, organizationId);

    const feedback = await testDataManager.createFeedback({
      title: "Test Feedback for Permissions",
      description: "This feedback tests role-based permissions",
      organizationId,
    });
    feedbackId = feedback.feedbackId;

    memberUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };
    supportUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    memberInviteToken = await inviteUser(page.request, organizationId, memberUser.email, "developer");
    supportInviteToken = await inviteUser(page.request, organizationId, supportUser.email, "customer_support");

    await registerUser(request, memberUser);
    await registerUser(request, supportUser);

    await page.context().clearCookies();
  });

  test.afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  test("admin can modify feedback status", async ({ page }) => {
    await helpers.login(adminUser.email, adminUser.password);
    await setOrgCookie(page, organizationId);

    await page.goto(`/admin/feedback/${feedbackId}`);

    const statusSelect = page.getByRole("combobox");
    await expect(statusSelect).toBeVisible();

    await statusSelect.click();
    await page.getByRole("option", { name: "处理中" }).click();

    await expect(statusSelect).toContainText("处理中");
  });

  test("member cannot modify feedback status", async ({ page }) => {
    await helpers.login(memberUser.email, memberUser.password);
    await acceptInvite(page.request, memberInviteToken);
    await setOrgCookie(page, organizationId);

    await page.goto(`/admin/feedback/${feedbackId}`);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByText("新接收")).toBeVisible();

    const response = await page.request.put(`/api/feedback/${feedbackId}`, {
      data: { status: "in-progress" },
      headers: { "x-organization-id": organizationId },
    });

    expect(response.status()).toBe(403);
  });

  test("support can only view feedback", async ({ page }) => {
    await helpers.login(supportUser.email, supportUser.password);
    await acceptInvite(page.request, supportInviteToken);
    await setOrgCookie(page, organizationId);

    await page.goto(`/admin/feedback/${feedbackId}`);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByText("新接收")).toBeVisible();

    const patchResponse = await page.request.put(`/api/feedback/${feedbackId}`, {
      data: { status: "in-progress" },
      headers: { "x-organization-id": organizationId },
    });
    expect(patchResponse.status()).toBe(403);

    const deleteResponse = await page.request.delete(`/api/feedback/${feedbackId}`, {
      headers: { "x-organization-id": organizationId },
    });
    expect(deleteResponse.status()).toBe(403);
  });
});

test.describe("E2E-UF-028: Organization management permissions", () => {
  let helpers: TestHelpers;
  let adminUser: TestUser;
  let memberUser: TestUser;
  let organizationId: string;
  let adminUserId: string;
  let memberUserId: string;
  let memberInviteToken: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    adminUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const adminInfo = await registerAndLoginUser(helpers, request, adminUser);
    organizationId = adminInfo.organizationId;
    adminUserId = adminInfo.userId;
    await setOrgCookie(page, organizationId);

    memberUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    memberInviteToken = await inviteUser(page.request, organizationId, memberUser.email, "developer");
    const memberInfo = await registerUser(request, memberUser);
    memberUserId = memberInfo?.data?.user?.id as string;

    await page.context().clearCookies();
  });

  test("admins can access organization management", async ({ page }) => {
    await helpers.login(adminUser.email, adminUser.password);
    await setOrgCookie(page, organizationId);
    await page.goto("/settings/organization");
    await expect(page.getByRole("heading", { name: "组织管理" })).toBeVisible();
  });

  test("only admins can invite members", async ({ page }) => {
    await helpers.login(adminUser.email, adminUser.password);
    await setOrgCookie(page, organizationId);

    const adminInvite = await page.request.post(`/api/organizations/${organizationId}/invitations`, {
      data: { email: uniqueEmail(), role: "developer" },
    });
    expect(adminInvite.status()).toBe(201);

    await page.context().clearCookies();
    await helpers.login(memberUser.email, memberUser.password);
    await acceptInvite(page.request, memberInviteToken);
    await setOrgCookie(page, organizationId);

    const memberInvite = await page.request.post(`/api/organizations/${organizationId}/invitations`, {
      data: { email: uniqueEmail(), role: "developer" },
    });
    expect(memberInvite.status()).toBe(403);
  });

  test("only admins can remove members", async ({ page }) => {
    await helpers.login(memberUser.email, memberUser.password);
    await acceptInvite(page.request, memberInviteToken);
    await setOrgCookie(page, organizationId);

    const memberRemove = await page.request.delete(
      `/api/organizations/${organizationId}/members/${adminUserId}`,
    );
    expect(memberRemove.status()).toBe(403);

    await page.context().clearCookies();
    await helpers.login(adminUser.email, adminUser.password);
    await setOrgCookie(page, organizationId);

    const adminRemove = await page.request.delete(
      `/api/organizations/${organizationId}/members/${memberUserId}`,
    );
    expect(adminRemove.status()).toBe(200);
  });

  test("role changes require appropriate permissions", async ({ page }) => {
    await helpers.login(memberUser.email, memberUser.password);
    await acceptInvite(page.request, memberInviteToken);
    await setOrgCookie(page, organizationId);

    const memberChange = await page.request.put(
      `/api/organizations/${organizationId}/members/${memberUserId}`,
      { data: { role: "product_manager" } },
    );
    expect(memberChange.status()).toBe(403);
  });
});

test.describe("Permission boundary testing", () => {
  test("users cannot access other organizations' data", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const testDataManager = new TestDataManager(page.request);

    const user1: TestUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const user2: TestUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const user1Info = await registerAndLoginUser(helpers, request, user1);
    await setOrgCookie(page, user1Info.organizationId);

    const feedback = await testDataManager.createFeedback({
      title: "Org 1 Feedback",
      description: "This belongs to org 1",
      organizationId: user1Info.organizationId,
    });

    await page.context().clearCookies();
    const user2Info = await registerAndLoginUser(helpers, request, user2);
    await setOrgCookie(page, user2Info.organizationId);

    const response = await page.request.get(`/api/feedback/${feedback.feedbackId}`, {
      headers: { "x-organization-id": user2Info.organizationId },
    });
    expect(response.status()).toBe(404);

    await testDataManager.cleanupAll();
  });

  test("session isolation between users", async ({ context, request }) => {
    const browserContext = await context.browser();
    if (!browserContext) throw new Error("Browser context not available");

    const context1 = await browserContext.newContext();
    const context2 = await browserContext.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const helpers1 = new TestHelpers(page1, request);
    const helpers2 = new TestHelpers(page2, request);

    const user1: TestUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const user2: TestUser = {
      email: uniqueEmail(),
      name: uniqueName(),
      password,
    };

    const user1Info = await registerUser(request, user1);
    const user2Info = await registerUser(request, user2);

    await helpers1.login(user1.email, user1.password);
    await helpers2.login(user2.email, user2.password);

    const user1OrgName = user1Info?.data?.organization?.name as string;
    const user2OrgName = user2Info?.data?.organization?.name as string;

    await expect(page1.getByRole("combobox")).toContainText(user1OrgName);
    await expect(page2.getByRole("combobox")).toContainText(user2OrgName);

    await expect(page1.getByRole("combobox")).not.toContainText(user2OrgName);
    await expect(page2.getByRole("combobox")).not.toContainText(user1OrgName);

    await context1.close();
    await context2.close();
  });
});
