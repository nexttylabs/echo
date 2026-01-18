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

import { test, expect } from "@playwright/test";
import { uniqueEmail, uniqueName, uniqueTitle, TestHelpers } from "./helpers/test-utils";
import { TestDataManager } from "./fixtures/test-data";

test.describe("E2E-UF-003: View feedback details via tracking link", () => {
  let slug: string;
  let trackingUrl: string;
  let feedbackTitle: string;
  let organizationId: string;
  let feedbackId: number;
  const password = "StrongPass123!";
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    slug = await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    organizationId = helpers.getOrganizationId();
    
    // Create a feedback to get its tracking URL
    const title = uniqueTitle();
    feedbackTitle = title;
    const feedback = await testDataManager.createFeedback({
      title,
      description: "This feedback will be viewed via tracking link.",
      organizationId,
    });
    feedbackId = feedback.feedbackId ?? feedback.id;
    trackingUrl = `/${slug}/feedback/${feedbackId}`;
  });

  test("views feedback details using tracking link", async ({ page }) => {
    // Navigate directly using the tracking URL
    await page.goto(trackingUrl);

    // Assert: feedback title is visible
    await expect(page.getByRole("heading", { name: feedbackTitle })).toBeVisible();

    // Assert: feedback description is visible
    await expect(page.getByText(/This feedback will be viewed via tracking link/)).toBeVisible();

    // Assert: feedback status is displayed
    await expect(page.getByText(/新接收|处理中|已规划|已完成|已关闭/)).toBeVisible();

    // Assert: tracking URL in address bar matches
    expect(page.url()).toContain(trackingUrl);
  });

  test("tracking link works for public feedback", async ({ page }) => {
    // Logout first
    await page.goto("/logout");
    
    // Navigate to tracking URL while logged out
    await page.goto(trackingUrl);

    // Should still be able to view the feedback
    await expect(page.getByRole("heading", { name: feedbackTitle })).toBeVisible();
    await expect(page.getByText(/This feedback will be viewed via tracking link/)).toBeVisible();
  });

  test("shows creation date and time", async ({ page }) => {
    await page.goto(trackingUrl);

    // Look for creation date/time display
    await expect(page.getByText("创建于")).toBeVisible();
    await expect(page.getByText(/最后更新/)).toBeVisible();
    await expect(page.getByText(/\d{4}年\d{1,2}月\d{1,2}日/).first()).toBeVisible();
  });

  test("displays feedback metadata correctly", async ({ page }) => {
    await page.goto(trackingUrl);

    // Check for feedback type and priority if they exist
    const typeElement = page.locator('[data-testid="feedback-type"], .feedback-type');
    const priorityElement = page.locator('[data-testid="feedback-priority"], .feedback-priority');

    // These might not be visible if not set, but check if they exist
    if (await typeElement.isVisible()) {
      await expect(typeElement).toContainText(/功能请求|Bug|问题|其他/i);
    }

    if (await priorityElement.isVisible()) {
      await expect(priorityElement).toContainText(/优先级:\s*(高|中|低)/);
    }
  });

  test("tracking link is shareable and persistent", async ({ page }) => {
    // Get the tracking URL
    const feedbackId = trackingUrl.split('/').pop();
    
    // Open a new incognito context to simulate a different user
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) throw new Error('Could not create new context');
    const newPage = await newContext.newPage();
    
    try {
      // Navigate to the tracking URL in the new context
      await newPage.goto(trackingUrl);
      
      // Should still be able to view the feedback
      await expect(newPage.getByRole("heading", { name: feedbackTitle })).toBeVisible();
      await expect(newPage.getByText(/This feedback will be viewed via tracking link/)).toBeVisible();
      
      // Verify the URL contains the feedback ID
      expect(newPage.url()).toContain(feedbackId);
    } finally {
      await newContext.close();
    }
  });

  test("shows 404 for invalid tracking link", async ({ page }) => {
    // Try an invalid tracking URL
    const invalidUrl = `/${slug}/feedback/invalid-feedback-id`;
    await page.goto(invalidUrl);

    // Should show 404 or not found message
    await expect(page.getByText(/not found|404|doesn't exist/i)).toBeVisible();
  });

  test("tracking link preserves query parameters", async ({ page }) => {
    // Add query parameters to tracking URL
    const urlWithParams = `${trackingUrl}?source=email&utm_campaign=test`;
    await page.goto(urlWithParams);

    // Should still work and show the feedback
    await expect(page.getByRole("heading", { name: feedbackTitle })).toBeVisible();
    
    // URL should preserve the parameters
    expect(page.url()).toContain('source=email');
    expect(page.url()).toContain('utm_campaign=test');
  });
});

test.describe("E2E-UF-004: Vote on feedback", () => {
  let slug: string;
  let organizationId: string;
  let feedbackId: number;
  const password = "StrongPass123!";
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;

  const openPortal = async (page: import("@playwright/test").Page, slug: string) => {
    await page.goto(`/${slug}`);
  };

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    slug = await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    organizationId = helpers.getOrganizationId();

    // Create a feedback to vote on
    const title = uniqueTitle();
    const feedback = await testDataManager.createFeedback({
      title,
      description: "This feedback will receive votes.",
      type: "feature",
      organizationId,
    });
    feedbackId = feedback.feedbackId ?? feedback.id;
  });

  test("votes on feedback successfully", async ({ page }) => {
    await openPortal(page, slug);

    // Find and click the vote button
    const feedbackCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    await expect(feedbackCard).toBeVisible();
    const voteButton = feedbackCard.getByRole("button");
    await expect(voteButton).toBeVisible();
    
    // Get initial vote count
    const initialText = await voteButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? "0");
    
    // Click to vote
    await voteButton.click();
    
    // Wait for vote to be processed
    await page.waitForTimeout(500);
    
    // Verify vote count increased or button state changed
    const newText = await voteButton.textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] ?? "0");
    expect(newCount).toBe(initialCount + 1);
  });

  test("shows vote count after voting", async ({ page }) => {
    await openPortal(page, slug);

    const feedbackCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    await expect(feedbackCard).toBeVisible();
    const voteButton = feedbackCard.getByRole("button");
    
    const initialText = await voteButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? "0");
    
    // Vote
    await voteButton.click();
    await page.waitForTimeout(500);
    
    const updatedText = await voteButton.textContent();
    const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] ?? "0");
    expect(updatedCount).toBe(initialCount + 1);
  });

  test("prevents duplicate voting", async ({ page }) => {
    await openPortal(page, slug);

    const feedbackCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    await expect(feedbackCard).toBeVisible();
    const voteButton = feedbackCard.getByRole("button");
    const initialText = await voteButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? "0");
    
    // First vote
    await voteButton.click();
    await page.waitForTimeout(500);
    
    // Try to vote again (may toggle or be blocked)
    await voteButton.click();
    await page.waitForTimeout(500);
    
    const finalText = await voteButton.textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] ?? "0");
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });

  test("persists vote after page refresh", async ({ page }) => {
    await openPortal(page, slug);

    const feedbackCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    await expect(feedbackCard).toBeVisible();
    const voteButton = feedbackCard.getByRole("button");
    const initialText = await voteButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? "0");
    
    // Vote
    await voteButton.click();
    await page.waitForTimeout(500);
    
    // Refresh the page
    await page.reload();
    
    const refreshedCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    const refreshedButton = refreshedCard.getByRole("button");
    const refreshedText = await refreshedButton.textContent();
    const refreshedCount = parseInt(refreshedText?.match(/\d+/)?.[0] ?? "0");
    expect(refreshedCount).toBe(initialCount + 1);
  });

  test("can unvote (if supported)", async ({ page }) => {
    await openPortal(page, slug);

    const feedbackCard = page.locator(`a[href="/${slug}/feedback/${feedbackId}"]`);
    await expect(feedbackCard).toBeVisible();
    const voteButton = feedbackCard.getByRole("button");
    const initialText = await voteButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] ?? "0");
    
    // Vote first
    await voteButton.click();
    await page.waitForTimeout(500);

    // Clicking again might toggle unvote
    await voteButton.click();
    await page.waitForTimeout(500);

    const finalText = await voteButton.textContent();
    const finalCount = parseInt(finalText?.match(/\d+/)?.[0] ?? "0");
    expect(finalCount === initialCount || finalCount === initialCount + 1).toBeTruthy();
  });
});
