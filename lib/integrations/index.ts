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

// Core exports
export * from "./core";

// Provider exports
export { GitHubProvider, githubProvider } from "./providers/github";

// Legacy client export (for backward compatibility)
export { GitHubClient } from "./github";

// Registry auto-registration
import { integrationRegistry } from "./core/registry";
import { githubProvider } from "./providers/github";

// Register built-in providers
integrationRegistry.register(githubProvider);
