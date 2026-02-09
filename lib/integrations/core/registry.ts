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

import type { IntegrationType, IntegrationCapability } from "./types";
import type { IntegrationProvider } from "./provider";

/**
 * Registry for managing integration providers.
 * Providers register themselves on module load.
 */
class IntegrationRegistry {
  private providers = new Map<IntegrationType, IntegrationProvider>();

  /**
   * Register a provider.
   * @param provider - Provider instance to register
   */
  register(provider: IntegrationProvider): void {
    if (this.providers.has(provider.type)) {
      console.warn(
        `Provider ${provider.type} is already registered. Overwriting.`
      );
    }
    this.providers.set(provider.type, provider);
  }

  /**
   * Get a provider by type.
   * @param type - Provider type
   */
  get(type: IntegrationType): IntegrationProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get a provider by type, throwing if not found.
   * @param type - Provider type
   */
  getOrThrow(type: IntegrationType): IntegrationProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Integration provider '${type}' not found`);
    }
    return provider;
  }

  /**
   * Get all registered providers.
   */
  getAll(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers that support a specific capability.
   * @param capability - Required capability
   */
  getByCapability(capability: IntegrationCapability): IntegrationProvider[] {
    return this.getAll().filter((p) =>
      p.metadata.capabilities.includes(capability)
    );
  }

  /**
   * Get all provider metadata for UI display.
   */
  getAllMetadata() {
    return this.getAll().map((p) => p.metadata);
  }

  /**
   * Check if a provider type is registered.
   * @param type - Provider type
   */
  has(type: IntegrationType): boolean {
    return this.providers.has(type);
  }

  /**
   * Get the count of registered providers.
   */
  get size(): number {
    return this.providers.size;
  }
}

// Singleton instance
export const integrationRegistry = new IntegrationRegistry();

// Re-export for convenience
export { IntegrationRegistry };
