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

import { test, expect, TestHelpers, uniqueEmail, uniqueName } from "./helpers/test-utils";

test.describe("E2E-UF-021: Widget settings", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const name = uniqueName();
    const email = uniqueEmail();
    await helpers.registerAndLogin(name, email, "TestPass123!");
  });

  test("shows widgets page and coming soon state", async ({ page }) => {
    await page.goto("/settings/widgets");

    await expect(page.getByRole("heading", { name: /widgets & embeds/i })).toBeVisible();
    await expect(page.getByText(/Widget configuration coming soon/i)).toBeVisible();
    await expect(page.getByText(/Changelog widget coming soon/i)).toBeVisible();
  });
});

test.describe("E2E-UF-022: Public widget", () => {
  let helpers: TestHelpers;
  let organizationId: string;
  let organizationName: string;

  test.beforeEach(async ({ page, request }) => {
    helpers = new TestHelpers(page, request);

    const name = uniqueName();
    const email = uniqueEmail();
    await helpers.registerAndLogin(name, email, "TestPass123!");

    organizationId = helpers.getOrganizationId();
    organizationName = `${name}'s Organization`;
  });

  test("renders widget for organization", async ({ page }) => {
    await page.goto(`/widget/${organizationId}`);

    await expect(page.getByRole("heading", { name: /feedback/i })).toBeVisible();
    await expect(page.getByText(organizationName)).toBeVisible();
    await expect(page.getByText(/We'd love to hear your thoughts/i)).toBeVisible();
  });
});
