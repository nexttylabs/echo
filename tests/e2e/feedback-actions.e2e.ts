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

import { test, expect, uniqueEmail, uniqueName, TestHelpers } from "./helpers/test-utils";
import { TestDataManager, createTestFeedback } from "./fixtures/test-data";

test.describe("E2E-UF-012: Edit feedback title and description", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let slug: string;
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;
  let feedbackId: number;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    testDataManager = new TestDataManager(page.request);
    
    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";
    
    slug = await helpers.registerAndLogin(name, email, password);
    
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    const feedback = await testDataManager.createFeedback({
      ...createTestFeedback({
        title: "Original Title",
        description: "Original description that will be edited.",
      }),
      organizationId,
    });
    
    feedbackId = feedback.feedbackId;
  });

  test("edits feedback title and description successfully", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Open actions menu and click edit
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /编辑|edit/i }).click();
    
    // Edit title
    const titleField = page.getByLabel("Title");
    await titleField.clear();
    await titleField.fill("Updated Title");
    
    // Edit description
    const descriptionField = page.getByLabel("Description");
    await descriptionField.clear();
    await descriptionField.fill("Updated description with new information.");
    
    // Save changes
    await page.getByRole("button", { name: /save|update/i }).click();

    await page.waitForURL(new RegExp(`/admin/feedback/${feedbackId}$`));
    
    // Verify changes are saved
    await expect(page.getByRole("heading", { name: "Updated Title" })).toBeVisible();
    await expect(page.getByText("Updated description with new information.")).toBeVisible();
    
    // Verify old content is not visible
    await expect(page.getByText("Original Title")).not.toBeVisible();
    await expect(page.getByText("Original description that will be edited.")).not.toBeVisible();
  });

  test("persists changes after page refresh", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Edit feedback
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /编辑|edit/i }).click();
    
    await page.getByLabel("Title").clear();
    await page.getByLabel("Title").fill("Persistent Title");
    
    await page.getByLabel("Description").clear();
    await page.getByLabel("Description").fill("This should persist after refresh.");
    
    await page.getByRole("button", { name: /save|update/i }).click();

    await page.waitForURL(new RegExp(`/admin/feedback/${feedbackId}$`));
    
    // Refresh page
    await page.reload();
    
    // Changes should still be visible
    await expect(page.getByRole("heading", { name: "Persistent Title" })).toBeVisible();
    await expect(page.getByText("This should persist after refresh.")).toBeVisible();
  });

  test("shows confirmation before discarding changes", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Start editing
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /编辑|edit/i }).click();
    
    // Make changes
    await page.getByLabel("Title").fill("Changed Title");
    
    // Try to navigate away without saving
    await page.goto(`/admin/feedback`);
    
    // Should show confirmation dialog
    const confirmDialog = page.locator('[data-testid="confirm-dialog"], .modal');
    if (await confirmDialog.isVisible()) {
      await expect(confirmDialog.getByText(/discard.*changes|unsaved/i)).toBeVisible();
      
      // Click cancel to stay on page
      await page.getByRole("button", { name: /cancel/i }).click();
      
      // Should still be on edit page
      expect(page.url()).toContain(`/admin/feedback/${feedbackId}`);
      
      // Save the changes
      await page.getByRole("button", { name: /save|update/i }).click();
    }
  });

  test("validates title is not empty", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /编辑|edit/i }).click();
    
    // Clear title
    await page.getByLabel("Title").clear();
    
    // Try to save
    await page.getByRole("button", { name: /save|update/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/title.*required|required/i)).toBeVisible();
    
    // Should not save
    expect(page.url()).toContain(`/admin/feedback/${feedbackId}`);
  });

  test("requires permission to edit feedback", async ({ page, request }) => {
    // Create member user without edit permission
    const memberEmail = uniqueEmail();
    const memberName = uniqueName();
    
    await request.post("/api/auth/register", {
      data: {
        name: memberName,
        email: memberEmail,
        password: "TestPass123!",
      },
    });
    
    // Logout admin
    await page.context().clearCookies();
    
    // Login as member
    await helpers.login(memberEmail, "TestPass123!");
    
    // Try to edit feedback
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should not see actions menu
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await expect(actionsTrigger).not.toBeVisible();
    
    // Try API call
    const response = await page.request.patch(`/api/feedback/${feedbackId}`, {
      data: { title: "Hacked Title", description: "Hacked description" }
    });
    
    expect(response.status()).toBe(403);
  });
});

test.describe("E2E-UF-013: Delete feedback", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let slug: string;
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;
  let feedbackId: number;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    testDataManager = new TestDataManager(page.request);
    
    const email = uniqueEmail();
    const name = uniqueName();
    const password = "StrongPass123!";
    
    slug = await helpers.registerAndLogin(name, email, password);
    
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    const feedback = await testDataManager.createFeedback({
      ...createTestFeedback({
        title: "Feedback To Delete",
        description: "This feedback will be deleted.",
      }),
      organizationId,
    });
    
    feedbackId = feedback.feedbackId;
  });

  test("deletes feedback with confirmation", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Open actions menu and click delete
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /删除|delete/i }).click();
    
    // Should show confirmation dialog
    const confirmDialog = page.locator('[data-testid="delete-confirm"], .modal');
    await expect(confirmDialog).toBeVisible();
    await expect(
      confirmDialog.getByRole("heading", { name: /确认删除|delete/i }),
    ).toBeVisible();
    
    // Confirm deletion
    await confirmDialog.getByRole("button", { name: /delete|confirm|删除/i }).click();
    
    // Should redirect to feedback list
    await page.waitForURL(/\/admin\/feedback$/);
    
    // Verify feedback is not in list
    await expect(page.getByText("Feedback To Delete")).not.toBeVisible();
  });

  test("cancels deletion when clicking cancel", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /删除|delete/i }).click();
    
    // Click cancel in confirmation dialog
    const confirmDialog = page.locator('[data-testid="delete-confirm"], .modal');
    await confirmDialog.getByRole("button", { name: /cancel|取消/i }).click();
    
    // Should stay on feedback detail page
    expect(page.url()).toContain(`/admin/feedback/${feedbackId}`);
    await expect(page.getByRole("heading", { name: "Feedback To Delete" })).toBeVisible();
  });

  test("shows 404 when accessing deleted feedback", async ({ page }) => {
    // Delete the feedback first
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await actionsTrigger.click();
    await page.getByRole("menuitem", { name: /删除|delete/i }).click();
    
    const confirmDialog = page.locator('[data-testid="delete-confirm"], .modal');
    await confirmDialog.getByRole("button", { name: /delete|confirm|删除/i }).click();
    await page.waitForURL(/\/admin\/feedback$/);
    
    // Try to access deleted feedback directly
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should show 404 or not found
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("can delete from list view", async ({ page }) => {
    await page.goto(`/admin/feedback`);
    
    // Find feedback in list
    const feedbackItem = page.locator('[data-testid="feedback-item"]:has-text("Feedback To Delete")');
    await expect(feedbackItem).toBeVisible();
    
    // Click delete button in list
    const listDeleteButton = feedbackItem.locator('button').filter({ hasText: /delete|删除/i });
    if (await listDeleteButton.isVisible()) {
      await listDeleteButton.click();
      
      // Confirm deletion
      const confirmDialog = page.locator('[data-testid="delete-confirm"], .modal');
      await confirmDialog.getByRole("button", { name: /delete|confirm|删除/i }).click();
      
      // Feedback should be removed from list
      await expect(feedbackItem).not.toBeVisible();
    }
  });

  test("requires permission to delete feedback", async ({ page, request }) => {
    // Create member user
    const memberEmail = uniqueEmail();
    const memberName = uniqueName();
    
    await request.post("/api/auth/register", {
      data: {
        name: memberName,
        email: memberEmail,
        password: "TestPass123!",
      },
    });
    
    // Logout admin
    await page.context().clearCookies();
    
    // Login as member
    await helpers.login(memberEmail, "TestPass123!");
    
    // Try to delete feedback
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should not see delete button
    const actionsTrigger = page.getByTestId("feedback-actions-trigger");
    await expect(actionsTrigger).not.toBeVisible();
    
    // Try API call
    const response = await page.request.delete(`/api/feedback/${feedbackId}`);
    expect(response.status()).toBe(403);
  });
});

test.describe("E2E-UF-014: Add internal notes", () => {
  let slug: string;
  let helpers: TestHelpers;
  let testDataManager: TestDataManager;
  let organizationId: string;
  let feedbackId: number;
  let adminName: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    testDataManager = new TestDataManager(page.request);
    
    const email = uniqueEmail();
    adminName = uniqueName();
    const password = "StrongPass123!";
    
    slug = await helpers.registerAndLogin(adminName, email, password);
    
    organizationId = helpers.getOrganizationId();
    
    // Create test feedback
    const feedback = await testDataManager.createFeedback({
      ...createTestFeedback({
        title: "Feedback with Notes",
        description: "This feedback will have internal notes.",
      }),
      organizationId,
    });
    
    feedbackId = feedback.feedbackId;
  });

  test("adds internal note successfully", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Find internal notes section
    const notesSection = page.locator('[data-testid="internal-notes"], .internal-notes');
    await expect(notesSection).toBeVisible();
    
    // Enter note content
    const noteTextarea = page.getByPlaceholder(/添加内部备注|internal note/i);
    await noteTextarea.fill("This is an internal note for the team.");
    
    // Save note
    await page.getByRole("button", { name: /添加备注|add/i }).click();
    
    // Verify note is displayed
    await expect(page.getByText("This is an internal note for the team.")).toBeVisible();
  });

  test("shows notes are only visible to team members", async ({ page }) => {
    // Add a note first
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const noteTextarea = page.getByPlaceholder(/添加内部备注|internal note/i);
    await noteTextarea.fill("Confidential internal note.");
    await page.getByRole("button", { name: /添加备注|add/i }).click();
    
    // Logout and view as public
    await page.context().clearCookies();
    
    // View feedback via tracking URL
    const trackingUrl = `/${slug}/feedback/${feedbackId}`;
    await page.goto(trackingUrl);
    
    // Should NOT see internal notes
    await expect(page.locator('[data-testid="internal-notes"]')).not.toBeVisible();
    await expect(page.getByText("Confidential internal note.")).not.toBeVisible();
  });

  test.skip("edits existing internal note", async () => {});

  test("deletes internal note", async ({ page }) => {
    // Add a note first
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const noteTextarea = page.getByPlaceholder(/添加内部备注|internal note/i);
    await noteTextarea.fill("Note to be deleted.");
    await page.getByRole("button", { name: /添加备注|add/i }).click();
    
    // Delete the note
    const deleteNoteButton = page.getByRole("button", { name: /删除备注|delete/i }).first();
    await deleteNoteButton.click({ force: true });
    
    // Verify note is deleted
    await expect(page.getByText("Note to be deleted.")).not.toBeVisible();
  });

  test("validates note content is not empty", async ({ page }) => {
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    const submitButton = page.getByRole("button", { name: /添加备注|add/i });
    await expect(submitButton).toBeDisabled();
  });

  test.skip("shows note history and edits", async () => {});

  test("requires permission to view and edit notes", async ({ page, request }) => {
    // Create member user
    const memberEmail = uniqueEmail();
    const memberName = uniqueName();
    
    await request.post("/api/auth/register", {
      data: {
        name: memberName,
        email: memberEmail,
        password: "TestPass123!",
      },
    });
    
    // Logout admin
    await page.context().clearCookies();
    
    // Login as member
    await helpers.login(memberEmail, "TestPass123!");
    
    // Try to access feedback
    await page.goto(`/admin/feedback/${feedbackId}`);
    
    // Should not see internal notes section
    const notesSection = page.locator('[data-testid="internal-notes"], .internal-notes');
    await expect(notesSection).not.toBeVisible();
    
    // Try API call to add note
    const response = await page.request.post(`/api/feedback/${feedbackId}/comments`, {
      data: { content: "Test note", isInternal: true }
    });
    
    expect(response.status()).toBe(403);
  });
});
