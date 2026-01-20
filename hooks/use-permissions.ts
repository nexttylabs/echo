"use client";


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

import {
  hasAllPermissions,
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/auth/permissions";
import { useCurrentRole } from "@/hooks/use-organization";

/**
 * Check if the current user has a specific permission.
 * Uses the user's role in the current organization from OrganizationProvider context.
 * 
 * @param permission - The permission to check
 * @param roleOverride - Optional role to use instead of the context role
 * @returns true if the user has the permission
 */
export function useCan(
  permission: Permission,
  roleOverride?: UserRole | null,
): boolean {
  const contextRole = useCurrentRole();
  const role = roleOverride ?? contextRole;

  return role ? hasPermission(role, permission) : false;
}

/**
 * Check if the current user has all of the specified permissions.
 * Uses the user's role in the current organization from OrganizationProvider context.
 * 
 * @param permissions - Single permission or array of permissions to check
 * @param roleOverride - Optional role to use instead of the context role
 * @returns true if the user has all permissions
 */
export function useHasPermission(
  permissions: Permission | Permission[],
  roleOverride?: UserRole | null,
): boolean {
  const contextRole = useCurrentRole();
  const role = roleOverride ?? contextRole;

  if (!role) {
    return false;
  }

  const list = Array.isArray(permissions) ? permissions : [permissions];
  return hasAllPermissions(role, list);
}

