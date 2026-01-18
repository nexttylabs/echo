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

import { authClient } from "@/lib/auth/client";
import {
  hasAllPermissions,
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/auth/permissions";

type Session = (typeof authClient)["$Infer"]["Session"];

export function useCan(
  permission: Permission,
  sessionOverride?: Session | null,
): boolean {
  const session =
    sessionOverride === undefined ? authClient.useSession().data : sessionOverride;
  const role = (session?.user as { role?: UserRole })?.role;

  return role ? hasPermission(role, permission) : false;
}

export function useHasPermission(
  permissions: Permission | Permission[],
  sessionOverride?: Session | null,
): boolean {
  const session =
    sessionOverride === undefined ? authClient.useSession().data : sessionOverride;
  const role = (session?.user as { role?: UserRole })?.role;

  if (!role) {
    return false;
  }

  const list = Array.isArray(permissions) ? permissions : [permissions];
  return hasAllPermissions(role, list);
}
