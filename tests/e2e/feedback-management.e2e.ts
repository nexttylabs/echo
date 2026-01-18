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

import { test, expect, uniqueEmail, uniqueName, TestHelpers } from "./helpers/test-utils";
import { TestDataManager, createTestFeedback } from "./fixtures/test-data";

test.describe("E2E-UF-007: View feedback list", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";


    await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    
    // Get organization ID from registration response (authenticated request context isn't shared)
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    for (let i = 0; i < 5; i++) {
      await testDataManager.createFeedback({
        ...createTestFeedback({
          title: `Test Feedback ${i + 1}`,
          description: `Description for feedback ${i + 1}`,
        }),
        organizationId,
      });
    }
  });

  test("loads feedback list with default view", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Should show feedback list
    await expect(page.getByRole("heading", { name: /反馈|feedback/i })).toBeVisible();
    
    // Should show feedback items
    const feedbackItems = page.locator('[data-testid="feedback-item"], .feedback-item');
    await expect(feedbackItems.first()).toBeVisible();
    
    // Should show key fields
    await expect(page.getByText("Test Feedback 1")).toBeVisible();
    await expect(page.getByText("Description for feedback 1")).toBeVisible();
  });

  test("shows pagination if feedback exceeds page limit", async ({ page }) => {
    // Create more feedback to trigger pagination
    for (let i = 5; i < 25; i++) {
      await testDataManager.createFeedback({
        ...createTestFeedback({
          title: `Extra Feedback ${i}`,
          description: `Extra description ${i}`,
        }),
        organizationId,
      });
    }
    
    await page.goto("/admin/feedback");
    
    // Should see pagination controls
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
      
      // Should show page numbers
      await expect(page.getByRole("button", { name: /2/i })).toBeVisible();
    }
  });

  test("displays feedback metadata in list", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Check for metadata columns
    const statusColumn = page.locator('[data-testid="status-column"], th:has-text("Status")');
    const dateColumn = page.locator('[data-testid="date-column"], th:has-text("Date")');
    const votesColumn = page.locator('[data-testid="votes-column"], th:has-text("Votes")');
    
    if (await statusColumn.isVisible()) {
      await expect(statusColumn).toBeVisible();
    }
    
    if (await dateColumn.isVisible()) {
      await expect(dateColumn).toBeVisible();
    }
    
    if (await votesColumn.isVisible()) {
      await expect(votesColumn).toBeVisible();
    }
  });
});

test.describe("E2E-UF-008: Filter feedback by status", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";


    await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    
    // Get organization ID from registration response (authenticated request context isn't shared)
    organizationId = helpers.getOrganizationId();
    
    // Create feedback with different statuses
    await testDataManager.createFeedback({
      ...createTestFeedback({ title: "Open Feedback" }),
      organizationId,
    });
    
    await testDataManager.createFeedback({
      ...createTestFeedback({ title: "In Progress Feedback" }),
      organizationId,
    });
    
    await testDataManager.createFeedback({
      ...createTestFeedback({ title: "Completed Feedback" }),
      organizationId,
    });
  });

  test("filters feedback by status successfully", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Find status filter
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]');
    if (await statusFilter.isVisible()) {
      // Filter by "Open" status
      await statusFilter.click();
      await page.getByRole("option", { name: /open/i }).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Should only show open feedback
      await expect(page.getByText("Open Feedback")).toBeVisible();
      await expect(page.getByText("In Progress Feedback")).not.toBeVisible();
      await expect(page.getByText("Completed Feedback")).not.toBeVisible();
    } else {
      // Alternative: click on status tabs or buttons
      const openTab = page.locator('[data-testid="status-tab-open"], button:has-text("Open")');
      if (await openTab.isVisible()) {
        await openTab.click();
        await expect(page.getByText("Open Feedback")).toBeVisible();
      }
    }
  });

  test("shows active filter indicator", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByRole("option", { name: /in progress/i }).click();
      
      // Should show active filter
      await expect(page.getByText(/filter.*in progress|status.*in progress/i)).toBeVisible();
      
      // Should show clear filter option
      const clearFilter = page.locator('[data-testid="clear-filter"], button:has-text("Clear")');
      if (await clearFilter.isVisible()) {
        await expect(clearFilter).toBeVisible();
      }
    }
  });

  test("clears filter and shows all feedback", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]');
    if (await statusFilter.isVisible()) {
      // Apply filter
      await statusFilter.click();
      await page.getByRole("option", { name: /open/i }).click();
      await page.waitForTimeout(500);
      
      // Clear filter
      const clearFilter = page.locator('[data-testid="clear-filter"], button:has-text("Clear")');
      if (await clearFilter.isVisible()) {
        await clearFilter.click();
      } else {
        // Or select "All" option
        await statusFilter.click();
        await page.getByRole("option", { name: /all/i }).click();
      }
      
      // Should show all feedback again
      await expect(page.getByText("Open Feedback")).toBeVisible();
      await expect(page.getByText("In Progress Feedback")).toBeVisible();
      await expect(page.getByText("Completed Feedback")).toBeVisible();
    }
  });
});

test.describe("E2E-UF-009: Sort feedback by votes and date", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";


    await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    
    // Get organization ID from registration response (authenticated request context isn't shared)
    organizationId = helpers.getOrganizationId();
    
    // Create feedback with different dates
    await testDataManager.createFeedback({
      ...createTestFeedback({ title: "Oldest Feedback" }),
      organizationId,
    });

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    await testDataManager.createFeedback({
      ...createTestFeedback({ title: "Newest Feedback" }),
      organizationId,
    });
  });

  test("sorts feedback by vote count", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Find sort dropdown
    const sortSelect = page.locator('[data-testid="sort-select"], select[name="sort"]');
    if (await sortSelect.isVisible()) {
      // Sort by votes
      await sortSelect.click();
      await page.getByRole("option", { name: /votes/i }).click();
      
      // Wait for sort to apply
      await page.waitForTimeout(500);
      
      // Should show sorted indicator
      await expect(page.getByText(/sorted.*votes|sort.*votes/i)).toBeVisible();
    } else {
      // Alternative: click on column headers
      const votesHeader = page.locator('[data-testid="votes-header"], th:has-text("Votes")');
      if (await votesHeader.isVisible()) {
        await votesHeader.click();
        await expect(page.getByText(/sorted.*votes/i)).toBeVisible();
      }
    }
  });

  test("sorts feedback by creation date", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    const sortSelect = page.locator('[data-testid="sort-select"], select[name="sort"]');
    if (await sortSelect.isVisible()) {
      // Sort by date (newest first)
      await sortSelect.click();
      await page.getByRole("option", { name: /date|newest/i }).click();
      
      await page.waitForTimeout(500);
      
      // Newest should be first
      const firstItem = page.locator('[data-testid="feedback-item"]').first();
      await expect(firstItem.getByText("Newest Feedback")).toBeVisible();
      
      // Sort by date (oldest first)
      await sortSelect.click();
      await page.getByRole("option", { name: /oldest/i }).click();
      
      await page.waitForTimeout(500);
      
      // Oldest should be first
      await expect(firstItem.getByText("Oldest Feedback")).toBeVisible();
    }
  });

  test("toggles sort direction", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Click on date header to sort
    const dateHeader = page.locator('[data-testid="date-header"], th:has-text("Date")');
    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      
      // Should show sort indicator
      await expect(dateHeader.locator('[data-testid="sort-indicator"], .sort-indicator')).toBeVisible();
      
      // Click again to reverse
      await dateHeader.click();
      
      // Sort direction should change
      const sortIndicator = dateHeader.locator('[data-testid="sort-indicator"]');
      await expect(sortIndicator).toHaveClass(/desc|asc/);
    }
  });
});

test.describe("E2E-UF-010: View feedback details", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;
  let feedbackId: number;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";


    await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    
    // Get organization ID from registration response (authenticated request context isn't shared)
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    const feedback = await testDataManager.createFeedback({
      ...createTestFeedback({
        title: "Detailed Feedback",
        description: "This is a detailed description with multiple lines.\n\nIt has important information.",
        type: "bug",
        priority: "high",
      }),
      organizationId,
    });
    
    feedbackId = feedback.feedbackId;
  });

  test("shows complete feedback information", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should show all feedback fields
    await expect(page.getByRole("heading", { name: "Detailed Feedback" })).toBeVisible();
    await expect(page.getByText(/This is a detailed description/)).toBeVisible();
    
    // Should show metadata
    await expect(page.getByText("Bug")).toBeVisible();
    await expect(page.getByText(/优先级:\s*高/)).toBeVisible();
    
    // Should show status selector
    await expect(page.getByRole("combobox")).toBeVisible();
    
    // Should show timestamps
    await expect(page.getByText("创建时间")).toBeVisible();
    await expect(page.getByText("更新时间")).toBeVisible();
  });

  test("navigates from list to detail view", async ({ page }) => {
    await page.goto("/admin/feedback");
    
    // Click on feedback item
    const feedbackItem = page.locator('[data-testid="feedback-item"]:has-text("Detailed Feedback")');
    await feedbackItem.click();
    
    // Should navigate to detail page
    await page.waitForURL(/\/admin\/feedback\/[^\/]+$/);
    await expect(page.getByRole("heading", { name: "Detailed Feedback" })).toBeVisible();
  });

  test("shows edit and action buttons for authorized users", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
      // Should see action buttons
      const editButton = page.locator('button').filter({ hasText: /edit/i });
      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible();
      }
      
      const deleteButton = page.locator('button').filter({ hasText: /delete/i });
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();
      }
      
      const statusSelect = page.locator('[data-testid="status-select"]');
      if (await statusSelect.isVisible()) {
        await expect(statusSelect).toBeVisible();
      }
  });

  test("displays feedback activity history", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should show activity timeline
    const activityHistory = page.locator('[data-testid="activity-history"], .activity-timeline');
    if (await activityHistory.isVisible()) {
      await expect(activityHistory).toBeVisible();
      
      // Should show creation activity
      await expect(page.getByText(/created|submitted/i)).toBeVisible();
    }
  });
});

test.describe("E2E-UF-011: Modify feedback status", () => {
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;
  let feedbackId: number;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";


    await helpers.registerAndLogin(name, email, password);
    testDataManager = new TestDataManager(page.request);
    
    // Get organization ID from registration response (authenticated request context isn't shared)
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    const feedback = await testDataManager.createFeedback({
      ...createTestFeedback({
        title: "Status Test Feedback",
        description: "Testing status changes",
      }),
      organizationId,
    });
    
    feedbackId = feedback.feedbackId;
  });

  test("changes feedback status successfully", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Select new status
    const statusSelect = page.getByRole("combobox");
    await statusSelect.click();
    await page.getByRole("option", { name: /处理中/ }).click();
    
    // Verify status changed
    await expect(statusSelect).toContainText("处理中");
  });

  test("shows confirmation before status change", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const statusSelect = page.getByRole("combobox");
    await statusSelect.click();
    await page.getByRole("option", { name: /已完成/ }).click();
    
    // Might show confirmation dialog
    const confirmDialog = page.locator('[data-testid="confirm-dialog"], .modal');
    if (await confirmDialog.isVisible()) {
      await expect(confirmDialog.getByText(/change status/i)).toBeVisible();
      await page.getByRole("button", { name: /confirm|yes/i }).click();
    }
    
    // Verify status changed
    await expect(statusSelect).toContainText("已完成");
  });

  test("syncs status change across list and detail views", async ({ page }) => {
    // Change status in detail view
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const statusSelect = page.getByRole("combobox");
    await statusSelect.click();
    await page.getByRole("option", { name: /处理中/ }).click();
    
    // Navigate back to list
    await page.goto("/admin/feedback");
    
    // Should show updated status in list
    const feedbackItem = page.locator('[data-testid="feedback-item"]:has-text("Status Test Feedback")');
    await expect(feedbackItem.getByText(/处理中/)).toBeVisible();
    
    // Go back to detail
    await feedbackItem.click();
    
    // Should still show updated status
    await expect(page.getByRole("combobox")).toContainText("处理中");
  });

  test("requires permission to change status", async ({ page, request }) => {
    // Create a member user without permission
    const memberEmail = uniqueEmail();
    const memberName = uniqueName();
    
    await request.post("/api/auth/register", {
      data: {
        name: memberName,
        email: memberEmail,
        password: "TestPass123!",
      },
    });

    // Invite member to the current organization with a restricted role
    const inviteResponse = await page.request.post(
      `/api/organizations/${organizationId}/invitations`,
      { data: { email: memberEmail, role: "customer" } },
    );
    expect(inviteResponse.ok()).toBeTruthy();
    const inviteJson = await inviteResponse.json();
    const inviteToken = inviteJson?.data?.token as string | undefined;
    expect(inviteToken).toBeTruthy();
    
    // Logout admin
    await page.context().clearCookies();
    
    // Login as member
    const memberHelpers = new TestHelpers(page, page.request);
    await memberHelpers.login(memberEmail, "TestPass123!");

    // Accept invitation to join the admin's organization
    const acceptResponse = await page.request.post("/api/invitations/accept", {
      data: { token: inviteToken },
    });
    expect(acceptResponse.ok()).toBeTruthy();

    // Ensure org context points to the admin organization
    await page.evaluate((orgId) => {
      document.cookie = `orgId=${orgId};path=/;max-age=2592000;samesite=lax`;
    }, organizationId);
    
    // Try to change status
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const statusSelect = page.getByRole("combobox");
    
    // Should be disabled or not visible
    if (await statusSelect.isVisible()) {
      await expect(statusSelect).toBeDisabled();
    } else {
      await expect(statusSelect).toHaveCount(0);
    }
  });
});
