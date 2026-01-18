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

import { test as base, Page, APIRequestContext, expect } from "@playwright/test";

// Test data generators
export function uniqueEmail() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e+${suffix}@example.com`;
}

export function uniqueTitle() {
  return `E2E feedback ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueName() {
  return `E2E User ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueOrganizationName() {
  return `E2E Org ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueProjectName() {
  return `E2E Project ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function resolveOrganizationSlug(json: unknown): string {
  const slug =
    typeof json === "object" && json
      ? (json as { data?: { organization?: { slug?: string } } }).data
          ?.organization?.slug
      : undefined;
  if (!slug) {
    throw new Error("Failed to get organization slug");
  }
  return slug;
}

export function isHealthStatusOk(status: string | undefined): boolean {
  return status === "ok" || status === "connected";
}

// Test fixtures
export interface TestFixtures {
  authenticatedPage: Page;
  organizationSlug: string;
  adminPage: Page;
  testUser: {
    email: string;
    name: string;
    password: string;
  };
  adminUser: {
    email: string;
    name: string;
    password: string;
  };
}

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user = {
      email: uniqueEmail(),
      name: uniqueName(),
      password: "StrongPass123!",
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(user);
  },

  adminUser: async ({}, use) => {
    const user = {
      email: `admin+${Date.now()}@example.com`,
      name: `Admin User ${Date.now()}`,
      password: "AdminPass123!",
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(user);
  },

  organizationSlug: async ({ testUser, request }, use) => {
    // Register user and create organization
    const register = await request.post("/api/auth/register", {
      data: testUser,
    });

    if (!register.ok()) {
      throw new Error("Failed to register test user");
    }

    const json = await register.json();
    const slug = resolveOrganizationSlug(json);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(slug);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Login user
    await page.goto("/login");
    await page.locator('input[name="email"], #email').fill(testUser.email);
    await page.locator('input[name="password"], #password').fill(testUser.password);
    await page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard/);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },

  adminPage: async ({ page, adminUser, request }, use) => {
    // Register admin user
    const register = await request.post("/api/auth/register", {
      data: adminUser,
    });

    if (!register.ok()) {
      throw new Error("Failed to register admin user");
    }

    // Login as admin
    await page.goto("/login");
    await page.locator('input[name="email"], #email').fill(adminUser.email);
    await page.locator('input[name="password"], #password').fill(adminUser.password);
    await page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard/);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

// Common test helpers
export class TestHelpers {
  private organizationId?: string;
  private organizationSlug?: string;

  constructor(private page: Page, private request: APIRequestContext) {}

  async createFeedback(data: {
    title: string;
    description: string;
    type?: string;
    priority?: string;
    organizationSlug: string;
  }) {
    await this.page.goto(`/${data.organizationSlug}`);
    await this.page.getByRole("button", { name: "Submit Feedback" }).click();
    
    await this.page.getByLabel("Title").fill(data.title);
    await this.page.getByLabel("Description").fill(data.description);
    
    if (data.type) {
      const typeSelect = this.page.getByLabel("Type");
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await this.page.getByRole("option", { name: data.type }).click();
      }
    }
    
    if (data.priority) {
      const prioritySelect = this.page.getByLabel("Priority");
      if (await prioritySelect.isVisible()) {
        await prioritySelect.click();
        await this.page.getByRole("option", { name: data.priority }).click();
      }
    }
    
    await this.page.getByRole("button", { name: "Create Post" }).click();

    // Prefer returning the detail URL if available.
    const currentUrl = this.page.url();
    if (/\/feedback\/[^\/]+$/.test(currentUrl)) {
      return currentUrl;
    }

    const feedbackLink = this.page
      .getByRole("link", { name: new RegExp(data.title) })
      .first();
    await feedbackLink.waitFor({ state: "visible" });
    const href = await feedbackLink.getAttribute("href");
    if (href) {
      return new URL(href, this.page.url()).toString();
    }

    return this.page.url();
  }

  async login(email: string, password: string) {
    await this.page.goto("/login");
    await this.page.locator('input[name="email"], #email').fill(email);
    await this.page.locator('input[name="password"], #password').fill(password);
    await this.page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Wait for navigation
    await this.page.waitForURL(/\/dashboard/);
  }

  async registerAndLogin(name: string, email: string, password: string) {
    // Register
    const register = await this.request.post("/api/auth/register", {
      data: { name, email, password },
    });

    if (!register.ok()) {
      throw new Error("Failed to register user");
    }

    // Login
    await this.login(email, password);
    
    const json = await register.json();
    const org = json?.data?.organization;
    this.organizationId = org?.id;
    this.organizationSlug = resolveOrganizationSlug(json);
    return this.organizationSlug;
  }

  getOrganizationId() {
    if (!this.organizationId) {
      throw new Error("Organization ID not available. Call registerAndLogin first.");
    }
    return this.organizationId;
  }

  async createOrganization(name: string) {
    await this.page.goto("/admin");
    await this.page.getByRole("button", { name: "Create Organization" }).click();
    
    await this.page.getByLabel("Organization Name").fill(name);
    await this.page.getByRole("button", { name: "Create" }).click();
    
    // Wait for creation
    await this.page.waitForURL(/\/admin\/organizations\/[^\/]+$/);
    
    return this.page.url();
  }

  async createProject(name: string, organizationSlug: string) {
    await this.page.goto(`/${organizationSlug}/admin/projects`);
    await this.page.getByRole("button", { name: "Create Project" }).click();
    
    await this.page.getByLabel("Project Name").fill(name);
    await this.page.getByRole("button", { name: "Create" }).click();
    
    // Wait for creation
    await this.page.waitForURL(/\/admin\/projects\/[^\/]+$/);
    
    return this.page.url();
  }

  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }

  async waitForSuccessMessage() {
    const successIndicator = this.page
      .getByText(/success|created|submitted|updated/i)
      .or(this.page.getByRole("heading").filter({ hasText: /success|created|submitted/i }));
    
    await expect(successIndicator).toBeVisible();
  }

  async waitForErrorMessage() {
    const errorIndicator = this.page
      .getByText(/error|failed|unable/i)
      .or(this.page.getByRole("alert").filter({ hasText: /error|failed/i }));
    
    await expect(errorIndicator).toBeVisible();
  }
}

export { expect } from "@playwright/test";
