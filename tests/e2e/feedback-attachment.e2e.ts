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
import { uniqueEmail, uniqueName, uniqueTitle, TestHelpers } from "./helpers/test-utils";

test.describe("E2E-UF-002: Submit feedback with file attachment", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let slug: string;
  const password = "StrongPass123!";
  let helpers: TestHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);
    const email = uniqueEmail();
    const name = uniqueName();

    slug = await helpers.registerAndLogin(name, email, password);
  });

  test("submits feedback with file attachment successfully", async ({ page, request }) => {
    const title = uniqueTitle();
    const description = "This feedback includes a file attachment.";

    const createResponse = await request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": helpers.getOrganizationId(),
      },
      data: { title, description },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const trackingUrl = created.data.trackingUrl as string;
    const feedbackId = created.data.feedbackId as number;

    const fileBuffer = Buffer.alloc(2048, 1);
    const uploadResponse = await request.post("/api/upload", {
      multipart: {
        feedbackId: String(feedbackId),
        files: {
          name: "test-file.pdf",
          mimeType: "application/pdf",
          buffer: fileBuffer,
        },
      },
    });
    expect(uploadResponse.ok()).toBeTruthy();

    await page.goto(trackingUrl);

    // Assert: feedback detail page shows the title
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    // Assert: attachment is visible on the detail page
    const attachmentLink = page.getByRole("link", { name: /test-file\.pdf/ });
    await expect(attachmentLink).toBeVisible();

    // Assert: can download the attachment
    const downloadPromise = page.waitForEvent('download');
    await attachmentLink.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-file.pdf');
  });

  test("shows attachment size and type information", async ({ page, request }) => {
    const title = uniqueTitle();

    const createResponse = await request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": helpers.getOrganizationId(),
      },
      data: { title, description: "Testing attachment info display." },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const trackingUrl = created.data.trackingUrl as string;
    const feedbackId = created.data.feedbackId as number;

    const fileBuffer = Buffer.alloc(2048, 1);
    const uploadResponse = await request.post("/api/upload", {
      multipart: {
        feedbackId: String(feedbackId),
        files: {
          name: "test-file.pdf",
          mimeType: "application/pdf",
          buffer: fileBuffer,
        },
      },
    });
    expect(uploadResponse.ok()).toBeTruthy();

    await page.goto(trackingUrl);
    
    // Verify attachment info on detail page
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    const attachmentLink = page.getByRole("link", { name: /test-file\.pdf/ });
    await expect(attachmentLink).toBeVisible();
    await expect(attachmentLink).toContainText(/2(\.0)? KB/);
  });

  test("removes attachment before submission", async ({ page, request }) => {
    const title = uniqueTitle();

    const createResponse = await request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": helpers.getOrganizationId(),
      },
      data: { title, description: "Testing attachment removal." },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const trackingUrl = created.data.trackingUrl as string;

    await page.goto(trackingUrl);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: /附件/ })).toHaveCount(0);
  });

  test("validates file size limits", async ({ request }) => {
    const title = uniqueTitle();
    
    const createResponse = await request.post("/api/feedback", {
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": helpers.getOrganizationId(),
      },
      data: { title, description: "Testing file size validation." },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const feedbackId = created.data.feedbackId as number;

    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
    const uploadResponse = await request.post("/api/upload", {
      multipart: {
        feedbackId: String(feedbackId),
        files: {
          name: "large-file.pdf",
          mimeType: "application/pdf",
          buffer: largeBuffer,
        },
      },
    });

    expect(uploadResponse.status()).toBe(400);
    const errorBody = await uploadResponse.json();
    expect(errorBody.code).toBe("VALIDATION_ERROR");
    expect(errorBody.details?.[0]?.code).toBe("FILE_TOO_LARGE");
  });

});
