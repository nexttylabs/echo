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

import { APIRequestContext } from "@playwright/test";

export interface TestData {
  organizations: string[];
  projects: string[];
  feedback: Array<{ id: string; organizationId: string }>;
  users: string[];
}

export class TestDataManager {
  private cleanup: TestData = {
    organizations: [],
    projects: [],
    feedback: [],
    users: [],
  };

  constructor(private request: APIRequestContext) {}

  async createOrganization(data: { name: string; slug?: string }) {
    const response = await this.request.post("/api/admin/organizations", {
      data,
    });

    if (!response.ok()) {
      throw new Error("Failed to create test organization");
    }

    const json = await response.json();
    const orgId = json?.data?.id;
    
    if (orgId) {
      this.cleanup.organizations.push(orgId);
    }

    return json.data;
  }

  async createProject(data: { name: string; organizationId: string }) {
    const response = await this.request.post("/api/admin/projects", {
      data,
    });

    if (!response.ok()) {
      throw new Error("Failed to create test project");
    }

    const json = await response.json();
    const projectId = json?.data?.id;
    
    if (projectId) {
      this.cleanup.projects.push(projectId);
    }

    return json.data;
  }

  async createFeedback(data: {
    title: string;
    description: string;
    type?: string;
    priority?: string;
    organizationId: string;
    submitterEmail?: string;
  }) {
    const { organizationId, ...payload } = data;
    const response = await this.request.post("/api/feedback", {
      data: payload,
      headers: { "x-organization-id": organizationId },
    });

    if (!response.ok()) {
      throw new Error("Failed to create test feedback");
    }

    const json = await response.json();
    const feedbackId = json?.data?.feedbackId ?? json?.data?.id;

    if (feedbackId) {
      this.cleanup.feedback.push({ id: String(feedbackId), organizationId });
    }

    return json.data;
  }

  async createUser(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.request.post("/api/auth/register", {
      data,
    });

    if (!response.ok()) {
      throw new Error("Failed to create test user");
    }

    const json = await response.json();
    const userId = json?.data?.user?.id;
    
    if (userId) {
      this.cleanup.users.push(userId);
    }

    return json.data;
  }

  async inviteToOrganization(data: { organizationId: string; email: string; role?: string }) {
    const response = await this.request.post(
      `/api/admin/organizations/${data.organizationId}/invitations`,
      { data }
    );

    if (!response.ok()) {
      throw new Error("Failed to invite user to organization");
    }

    return response.json();
  }

  async cleanupAll() {
    const errors: string[] = [];

    // Clean up feedback
    for (const feedbackEntry of this.cleanup.feedback) {
      try {
        await this.request.delete(`/api/feedback/${feedbackEntry.id}`, {
          headers: { "x-organization-id": feedbackEntry.organizationId },
        });
      } catch (error) {
        errors.push(`Failed to delete feedback ${feedbackEntry.id}: ${error}`);
      }
    }

    // Clean up projects
    for (const projectId of this.cleanup.projects) {
      try {
        await this.request.delete(`/api/admin/projects/${projectId}`);
      } catch (error) {
        errors.push(`Failed to delete project ${projectId}: ${error}`);
      }
    }

    // Clean up organizations
    for (const organizationId of this.cleanup.organizations) {
      try {
        await this.request.delete(`/api/admin/organizations/${organizationId}`);
      } catch (error) {
        errors.push(`Failed to delete organization ${organizationId}: ${error}`);
      }
    }

    // Clean up users (if needed)
    for (const userId of this.cleanup.users) {
      try {
        await this.request.delete(`/api/admin/users/${userId}`);
      } catch (error) {
        // User cleanup might not be necessary or allowed
        console.warn(`Failed to delete user ${userId}: ${error}`);
      }
    }

    if (errors.length > 0) {
      console.warn("Cleanup errors:", errors);
    }

    // Reset cleanup tracking
    this.cleanup = {
      organizations: [],
      projects: [],
      feedback: [],
      users: [],
    };
  }
}

// Factory functions for creating test data
export const createTestFeedback = (overrides: Partial<{
  title: string;
  description: string;
  type: string;
  priority: string;
}> = {}) => ({
  title: `Test Feedback ${Date.now()}`,
  description: "This is a test feedback created for E2E testing.",
  type: "feature",
  priority: "medium",
  ...overrides,
});

export const createTestOrganization = (overrides: Partial<{
  name: string;
  slug: string;
}> = {}) => ({
  name: `Test Org ${Date.now()}`,
  slug: `test-org-${Date.now()}`,
  ...overrides,
});

export const createTestProject = (overrides: Partial<{
  name: string;
}> = {}) => ({
  name: `Test Project ${Date.now()}`,
  ...overrides,
});

export const createTestUser = (overrides: Partial<{
  name: string;
  email: string;
  password: string;
  role: string;
}> = {}) => {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test+${timestamp}@example.com`,
    password: "TestPass123!",
    role: "member",
    ...overrides,
  };
};
