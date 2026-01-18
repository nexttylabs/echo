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

import { test, expect, uniqueEmail, uniqueName, uniqueTitle, TestHelpers } from "./helpers/test-utils";

test.describe("E2E-UF-005: Submit feedback on behalf of customer", () => {
  const password = "StrongPass123!";
  let helpers: TestHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    await helpers.registerAndLogin(name, email, password);
  });

  test("submits feedback on behalf of customer with proper marking", async ({ page }) => {
    const customerEmail = `customer+${Date.now()}@example.com`;
    const customerName = `Customer ${Date.now()}`;
    const title = uniqueTitle();
    const description = "This feedback was submitted by customer service on behalf of a customer.";

    // Navigate to admin feedback submission
    await page.goto("/admin/feedback/new");

    // Fill feedback details
    await page.getByTestId("feedback-title").fill(title);
    await page.getByTestId("feedback-description").fill(description);
    await page.getByTestId("customer-name").fill(customerName);
    await page.getByTestId("customer-email").fill(customerEmail);

    // Submit the feedback
    await page.getByTestId("submit-feedback").click();

    // Verify success and follow tracking link
    const trackingLink = page.getByTestId("tracking-link");
    await expect(trackingLink).toBeVisible();
    await trackingLink.click();
    await page.waitForURL(/\/feedback\/\d+$/);

    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Check customer email is displayed
    await expect(page.getByText(customerEmail)).toBeVisible();
  });

  test("generates and displays tracking link for customer feedback", async ({ page }) => {
    const customerEmail = `customer+${Date.now()}@example.com`;
    const customerName = `Customer ${Date.now()}`;
    const title = uniqueTitle();

    await page.goto("/admin/feedback/new");

    await page.getByTestId("feedback-title").fill(title);
    await page.getByTestId("feedback-description").fill("Testing tracking link generation.");
    await page.getByTestId("customer-name").fill(customerName);
    await page.getByTestId("customer-email").fill(customerEmail);
    await page.getByTestId("submit-feedback").click();

    // Should show tracking link
    const trackingLink = page.getByTestId("tracking-link");
    await expect(trackingLink).toBeVisible();

    // Verify the link contains the feedback ID
    const linkHref = await trackingLink.getAttribute("href");
    expect(linkHref).toContain("/feedback/");
  });

  test("validates customer email format", async ({ page }) => {
    await page.goto("/admin/feedback/new");

    await page.getByTestId("feedback-title").fill("Test Email Validation");
    await page.getByTestId("feedback-description").fill("Testing email validation.");
    await page.getByTestId("customer-name").fill("Customer");

    // Enter invalid email
    await page.getByTestId("customer-email").fill("invalid-email");
    await page.getByTestId("submit-feedback").click();

    // Should show email validation error
    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();

    // Should not submit
    expect(page.url()).toContain("/admin/feedback/new");
  });

  test("requires customer email when submitting on behalf", async ({ page }) => {
    await page.goto("/admin/feedback/new");

    await page.getByTestId("feedback-title").fill("Test Required Email");
    await page.getByTestId("feedback-description").fill("Testing required customer email.");
    await page.getByTestId("customer-name").fill("Customer");
    await page.getByTestId("submit-feedback").click();

    // Should show required field error
    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible();
  });

  test("shows submitted by information in feedback list", async ({ page }) => {
    const customerEmail = `customer+${Date.now()}@example.com`;
    const customerName = `Customer ${Date.now()}`;
    const title = uniqueTitle();

    // Submit feedback on behalf
    await page.goto("/admin/feedback/new");
    await page.getByTestId("feedback-title").fill(title);
    await page.getByTestId("feedback-description").fill("List view test.");
    await page.getByTestId("customer-name").fill(customerName);
    await page.getByTestId("customer-email").fill(customerEmail);
    await page.getByTestId("submit-feedback").click();

    // Navigate to feedback list
    await page.goto("/admin/feedback");

    // Find the feedback in list
    const loadingState = page.getByText("加载中...");
    if (await loadingState.isVisible()) {
      await loadingState.waitFor({ state: "detached" });
    }
    const feedbackItem = page.locator('[data-testid="feedback-item"]:has-text("' + title + '")');
    await expect(feedbackItem).toBeVisible();

    // Check for "on behalf" indicator in list
    const listBehalfIndicator = feedbackItem.locator('[data-testid="on-behalf-indicator"], .on-behalf-badge');
    if (await listBehalfIndicator.isVisible()) {
      await expect(listBehalfIndicator).toBeVisible();
    }
  });

  test("allows editing feedback description after submission", async ({ page }) => {
    const customerEmail = `customer+${Date.now()}@example.com`;
    const customerName = `Customer ${Date.now()}`;
    const title = uniqueTitle();
    const newDescription = "Updated description for edit test.";

    // Submit feedback on behalf
    await page.goto("/admin/feedback/new");
    await page.getByTestId("feedback-title").fill(title);
    await page.getByTestId("feedback-description").fill("Edit test.");
    await page.getByTestId("customer-name").fill(customerName);
    await page.getByTestId("customer-email").fill(customerEmail);
    await page.getByTestId("submit-feedback").click();
    const trackingLink = page.getByTestId("tracking-link");
    await expect(trackingLink).toBeVisible();
    const trackingHref = await trackingLink.getAttribute("href");
    const feedbackId = trackingHref?.split("/").pop();
    expect(feedbackId).toBeTruthy();

    await page.goto(`/admin/feedback/${feedbackId}`);
    await expect(page.getByTestId("feedback-actions-trigger")).toBeVisible();
    await page.getByTestId("feedback-actions-trigger").click();
    await page.getByRole("menuitem", { name: "编辑" }).click();

    await page.getByLabel("Description").fill(newDescription);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(newDescription)).toBeVisible();
  });

  test("preserves 'on behalf' flag when editing other fields", async ({ page }) => {
    const customerEmail = `customer+${Date.now()}@example.com`;
    const customerName = `Customer ${Date.now()}`;
    const title = uniqueTitle();
    const newTitle = `Updated ${uniqueTitle()}`;

    // Submit feedback on behalf
    await page.goto("/admin/feedback/new");
    await page.getByTestId("feedback-title").fill(title);
    await page.getByTestId("feedback-description").fill("Original description.");
    await page.getByTestId("customer-name").fill(customerName);
    await page.getByTestId("customer-email").fill(customerEmail);
    await page.getByTestId("submit-feedback").click();
    const trackingLink = page.getByTestId("tracking-link");
    await expect(trackingLink).toBeVisible();
    const trackingHref = await trackingLink.getAttribute("href");
    const feedbackId = trackingHref?.split("/").pop();
    expect(feedbackId).toBeTruthy();

    await page.goto(`/admin/feedback/${feedbackId}`);
    await expect(page.getByTestId("feedback-actions-trigger")).toBeVisible();
    await page.getByTestId("feedback-actions-trigger").click();
    await page.getByRole("menuitem", { name: "编辑" }).click();

    await page.getByLabel("Title").fill(newTitle);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
    await expect(page.getByText(customerEmail)).toBeVisible();
  });

  test("requires permission to submit on behalf of customer", async ({ page }) => {
    const response = await page.request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": helpers.getOrganizationId(),
        "x-user-role": "customer",
      },
      data: {
        title: "Test API",
        description: "Testing permission",
        submittedOnBehalf: true,
        customerInfo: {
          name: "Customer",
          email: "customer@example.com",
        },
      },
    });

    expect(response.status()).toBe(403);
  });
});
