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

export interface GitHubConfig {
  accessToken: string;
  owner: string;
  repo: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  assignee?: {
    id: number;
    login: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
}

export class GitHubClient {
  private config: GitHubConfig;
  private baseUrl = "https://api.github.com";

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.config.accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createIssue(params: {
    title: string;
    body: string;
    labels?: string[];
    assignees?: string[];
  }): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      "POST",
      `/repos/${this.config.owner}/${this.config.repo}/issues`,
      params,
    );
  }

  async updateIssue(
    issueNumber: number,
    params: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
      labels?: string[];
    },
  ): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      "PATCH",
      `/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
      params,
    );
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(
      "GET",
      `/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
    );
  }

  async getLabels(): Promise<GitHubLabel[]> {
    return this.request<GitHubLabel[]>(
      "GET",
      `/repos/${this.config.owner}/${this.config.repo}/labels`,
    );
  }

  async createLabel(params: {
    name: string;
    color: string;
    description?: string;
  }): Promise<GitHubLabel> {
    return this.request<GitHubLabel>(
      "POST",
      `/repos/${this.config.owner}/${this.config.repo}/labels`,
      params,
    );
  }

  async getRepository(): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(
      "GET",
      `/repos/${this.config.owner}/${this.config.repo}`,
    );
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.getRepository();
      return true;
    } catch {
      return false;
    }
  }
}
