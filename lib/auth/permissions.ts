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

export type UserRole =
  | "owner"
  | "admin"
  | "product_manager"
  | "developer"
  | "customer_support"
  | "customer";

export const PERMISSIONS = {
  CREATE_FEEDBACK: "create_feedback",
  SUBMIT_ON_BEHALF: "submit_on_behalf",
  DELETE_FEEDBACK: "delete_feedback",
  MANAGE_ORG: "manage_org",
  UPDATE_FEEDBACK_STATUS: "update_feedback_status",
  BACKUP_CREATE: "backup_create",
  BACKUP_VIEW: "backup_view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
    PERMISSIONS.DELETE_FEEDBACK,
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.UPDATE_FEEDBACK_STATUS,
    PERMISSIONS.BACKUP_CREATE,
    PERMISSIONS.BACKUP_VIEW,
  ],
  admin: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
    PERMISSIONS.DELETE_FEEDBACK,
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.UPDATE_FEEDBACK_STATUS,
    PERMISSIONS.BACKUP_CREATE,
    PERMISSIONS.BACKUP_VIEW,
  ],
  product_manager: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
    PERMISSIONS.DELETE_FEEDBACK,
    PERMISSIONS.UPDATE_FEEDBACK_STATUS,
    PERMISSIONS.BACKUP_VIEW,
  ],
  developer: [PERMISSIONS.CREATE_FEEDBACK],
  customer_support: [
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.SUBMIT_ON_BEHALF,
  ],
  customer: [PERMISSIONS.CREATE_FEEDBACK],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function canSubmitOnBehalf(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.SUBMIT_ON_BEHALF);
}

export function canUpdateFeedbackStatus(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.UPDATE_FEEDBACK_STATUS);
}

export function canDeleteFeedback(role: UserRole): boolean {
  return hasPermission(role, PERMISSIONS.DELETE_FEEDBACK);
}

export function canEditFeedback(role: UserRole): boolean {
  return role === "admin" || role === "product_manager";
}
