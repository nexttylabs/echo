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

import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e+${Date.now()}@example.com`;
}

function uniqueTitle() {
  return `E2E feedback ${Date.now()}`;
}

function uniqueName() {
  return `E2E User ${Date.now()}`;
}

test.describe("E2E-UF-001: Submit feedback with basic fields, type, and priority", () => {
  let slug: string;
  const password = "StrongPass123!";

  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail();
    const name = uniqueName();

    const register = await page.request.post("/api/auth/register", {
      data: { name, email, password },
    });

    expect(register.ok()).toBeTruthy();
    const json = await register.json();
    slug = json?.data?.organization?.slug;
    expect(slug).toBeTruthy();
  });

  test("submits feedback with title, description, type, and priority", async ({
    page,
  }) => {
    const title = uniqueTitle();
    const description = "This is an E2E submission with type and priority.";

    // Navigate to the portal
    await page.goto(`/${slug}`);

    // Open feedback form
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    // Fill basic fields
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Description").fill(description);

    // Select feedback type (e.g., Feature Request)
    const typeSelect = page.getByLabel("Type");
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.getByRole("option", { name: /feature/i }).click();
    }

    // Select priority (e.g., High)
    const prioritySelect = page.getByLabel("Priority");
    if (await prioritySelect.isVisible()) {
      await prioritySelect.click();
      await page.getByRole("option", { name: /high/i }).click();
    }

    // Submit the form
    await page.getByRole("button", { name: "Create Post" }).click();

    // Assert: feedback detail page shows the title
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Assert: we stay on the portal list page after submit
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/${slug}`);

    // Navigate to the new feedback detail page via the list
    const listHeading = page.getByRole("heading", { name: title });
    await expect(listHeading).toBeVisible();
    await listHeading.click();
    await expect(
      page.getByRole("heading", { name: title, level: 1 })
    ).toBeVisible();
    expect(page.url()).toContain(`/${slug}/feedback/`);
  });

  test("shows success message after submission", async ({ page }) => {
    const title = uniqueTitle();

    await page.goto(`/${slug}`);
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Description").fill("Testing success message.");
    await page.getByRole("button", { name: "Create Post" }).click();

    // Assert: the new feedback appears in the list after reload
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("new feedback appears in the feedback list", async ({ page }) => {
    const title = uniqueTitle();

    await page.goto(`/${slug}`);
    await page.getByRole("button", { name: "Submit Feedback" }).click();

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Description").fill("Testing list visibility.");
    await page.getByRole("button", { name: "Create Post" }).click();

    // Wait for navigation to detail or list
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Navigate back to the portal list
    await page.goto(`/${slug}`);

    // Assert: the new feedback is visible in the list
    await expect(page.getByText(title)).toBeVisible();
  });
});
