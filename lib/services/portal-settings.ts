"use server";


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

import { db } from "@/lib/db";
import { organizationSettings, PortalConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get portal settings for an organization
 */
export async function getPortalSettings(organizationId: string): Promise<PortalConfig | null> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const [settings] = await db
    .select({ portalConfig: organizationSettings.portalConfig })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  if (!settings) {
    return null;
  }

  return settings.portalConfig ?? {};
}

/**
 * Update a specific section of portal settings
 */
export async function updatePortalSettings<T extends keyof PortalConfig>(
  organizationId: string,
  section: T,
  data: PortalConfig[T]
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    // Get current config
    const [settings] = await db
      .select({ portalConfig: organizationSettings.portalConfig })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId))
      .limit(1);

    const currentConfig = settings?.portalConfig ?? {};
    const newConfig: PortalConfig = {
      ...currentConfig,
      [section]: data,
    };

    if (settings) {
      await db
        .update(organizationSettings)
        .set({ portalConfig: newConfig })
        .where(eq(organizationSettings.organizationId, organizationId));
    } else {
      await db.insert(organizationSettings).values({
        organizationId,
        portalConfig: newConfig,
      });
    }

    // Revalidate admin settings pages
    const adminPaths = [
      "/settings/portal-branding",
      "/settings/portal-growth",
      "/settings/portal-access",
      "/settings/portal-modules",
      "/settings/portal-resources",
      "/settings/modules",
      "/settings/branding",
    ];
    adminPaths.forEach((path) => revalidatePath(path));
    
    // Revalidate all public portal pages (dynamic routes)
    revalidatePath("/[organizationSlug]", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update portal settings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

/**
 * Update entire portal config at once
 */
export async function updateFullPortalConfig(
  organizationId: string,
  config: PortalConfig
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not configured" };
  }

  try {
    const [existing] = await db
      .select({ organizationId: organizationSettings.organizationId })
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId))
      .limit(1);

    if (existing) {
      await db
        .update(organizationSettings)
        .set({ portalConfig: config })
        .where(eq(organizationSettings.organizationId, organizationId));
    } else {
      await db.insert(organizationSettings).values({
        organizationId,
        portalConfig: config,
      });
    }

    // Revalidate admin settings pages
    const adminPaths = [
      "/settings/portal-branding",
      "/settings/portal-growth",
      "/settings/portal-access",
      "/settings/portal-modules",
      "/settings/portal-resources",
      "/settings/modules",
      "/settings/branding",
    ];
    adminPaths.forEach((path) => revalidatePath(path));
    
    // Revalidate all public portal pages (dynamic routes)
    revalidatePath("/[organizationSlug]", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update portal config:", error);
    return { success: false, error: "Failed to save settings" };
  }
}
