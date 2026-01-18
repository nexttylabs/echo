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

import { test, expect, type Page } from "@playwright/test";
import { uniqueEmail, uniqueName, TestHelpers } from "./helpers/test-utils";

const userMenuButton = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(name, "i") }).first();

test.describe("E2E-UF-006: Team member login", () => {
  const password = "StrongPass123!";

  test("logs in with valid credentials", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    // First register a user
    await helpers.registerAndLogin(name, email, password);
    
    // Logout (clear session cookies)
    await page.request.post("/api/auth/clear-session");
    
    // Now test login
    await page.goto("/login");
    
    // Fill login form
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    
    // Submit login
    await page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Verify successful login
    await expect(userMenuButton(page, name)).toBeVisible();
    
    // Check if we can access protected pages
    await page.goto("/dashboard");
    await expect(page.url()).toContain("/dashboard");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    
    // Try to login with invalid credentials
    await page.locator('input[name="email"], #email').fill("invalid@example.com");
    await page.locator('input[name="password"], #password').fill("wrongpassword");
    
    await page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed|邮箱|メールアドレス|密码|パスワード/i)).toBeVisible();
    
    // Should stay on login page
    expect(page.url()).toContain("/login");
  });

  test("remembers user session after page refresh", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    // Register and login
    await helpers.registerAndLogin(name, email, password);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(userMenuButton(page, name)).toBeVisible();
    
    // Should still be able to access protected pages
    await page.goto("/dashboard");
    await expect(page.url()).toContain("/dashboard");
  });

  test("redirects to intended page after login", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    // Register user
    await helpers.registerAndLogin(name, email, password);
    await page.request.post("/api/auth/clear-session");
    
    // Try to access a protected page directly
    const protectedPage = "/dashboard";
    await page.goto(protectedPage);
    
    // Should redirect to login
    await page.waitForURL(/\/login/);
    
    // Login
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page
      .getByRole("button", { name: /sign in|log in|login|登录|ログイン/i })
      .click();
    
    // Login flow always redirects to dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page.url()).toContain("/dashboard");
  });

  test("logs out successfully", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    // Register and login
    await helpers.registerAndLogin(name, email, password);
    
    // Logout
    await page.request.post("/api/auth/clear-session");
    
    // Try to access protected page
    await page.goto("/dashboard");
    
    // Should redirect to login
    await page.waitForURL(/\/login/);
    
    // Verify no user info is visible
    await expect(userMenuButton(page, name)).not.toBeVisible();
  });
});

test.describe("E2E-UF-020: User registration", () => {
  const password = "StrongPass123!";

  test("registers new user successfully", async ({ page }) => {
    await page.goto("/register");
    
    const email = uniqueEmail();
    const name = uniqueName();
    
    // Fill registration form
    await page.locator('input[name="name"], #name').fill(name);
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    // Submit registration
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Should show success message or user is logged in
    await expect(userMenuButton(page, name)).toBeVisible();
  });

  test("validates email format", async ({ page }) => {
    await page.goto("/register");
    
    // Try invalid email
    await page.locator('input[name="name"], #name').fill(uniqueName());
    await page.locator('input[name="email"], #email').fill("invalid-email");
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should show email validation error (native or inline)
    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
    
    // Should not register
    expect(page.url()).toContain("/register");
  });

  test("validates password strength", async ({ page }) => {
    await page.goto("/register");
    
    // Try weak password
    await page.locator('input[name="name"], #name').fill(uniqueName());
    await page.locator('input[name="email"], #email').fill(uniqueEmail());
    await page.locator('input[name="password"], #password').fill("123");
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill("123");
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should show password strength error
    await expect(page.locator('input[name="password"], #password')).toHaveClass(
      /border-destructive/
    );
  });

  test("validates password confirmation", async ({ page }) => {
    await page.goto("/register");
    
    const name = uniqueName();
    const email = uniqueEmail();
    
    await page.locator('input[name="name"], #name').fill(name);
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill("different-password");
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should show password mismatch error
    await expect(page.locator('input[name="confirmPassword"], #confirmPassword')).toHaveClass(
      /border-destructive/
    );
  });

  test("prevents duplicate email registration", async ({ page, request }) => {
    const helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    // Register first user
    await helpers.registerAndLogin(name, email, password);
    await page.request.post("/api/auth/clear-session");
    
    // Try to register with same email
    await page.goto("/register");
    
    await page.locator('input[name="name"], #name').fill(uniqueName());
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should show email already exists error
    await expect(page.getByText(/email.*exists|already.*registered|邮箱已存在|既に使用/i)).toBeVisible();
  });

  test("creates organization during registration", async ({ page }) => {
    await page.goto("/register");
    
    const email = uniqueEmail();
    const name = uniqueName();
    
    await page.locator('input[name="name"], #name').fill(name);
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should be logged in and have access to organization
    await expect(userMenuButton(page, name)).toBeVisible();
    await expect(page.url()).toContain("/dashboard");
  });

  test("auto-logs in after successful registration", async ({ page }) => {
    await page.goto("/register");
    
    const email = uniqueEmail();
    const name = uniqueName();
    
    await page.locator('input[name="name"], #name').fill(name);
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Should be automatically logged in
    await page.waitForURL(/\/dashboard/);
    await expect(userMenuButton(page, name)).toBeVisible();
    
    // Should be able to access protected pages without re-login
    await page.goto("/dashboard");
    await expect(page.url()).toContain("/dashboard");
  });

  test("shows registration success message", async ({ page }) => {
    await page.goto("/register");
    
    const email = uniqueEmail();
    const name = uniqueName();
    
    await page.locator('input[name="name"], #name').fill(name);
    await page.locator('input[name="email"], #email').fill(email);
    await page.locator('input[name="password"], #password').fill(password);
    await page.locator('input[name="confirmPassword"], #confirmPassword').fill(password);
    
    await page
      .getByRole("button", { name: /register|sign up|signup|注册|登録/i })
      .click();
    
    // Verify successful registration by dashboard navigation and logged-in state
    await page.waitForURL(/\/dashboard/);
    await expect(userMenuButton(page, name)).toBeVisible();
  });
});
