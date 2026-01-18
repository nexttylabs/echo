# Roles and Permissions Design

**Date:** 2026-01-03

## Goal
Define a minimal RBAC module with explicit roles and permissions, and align the user schema and validation with the role model.

## Architecture
We will add a pure, side-effect-free RBAC module at `lib/auth/permissions.ts`. It will export a `UserRole` union type, a `PERMISSIONS` constant map, a `Permission` union derived from the map, and a `ROLE_PERMISSIONS` record that defines which roles can perform each action. The module will expose `hasPermission(role, permission)` and `canSubmitOnBehalf(role)` helpers. The design is intentionally simple: no I/O, no session coupling, and conservative defaults (unknown roles return false). This provides a stable base for middleware and UI gating without over-engineering.

To keep data models consistent, we will add a `role` column to the Drizzle `user` table definition in `lib/db/schema/auth.ts`, defaulting to `customer`. We will also add a Zod `userRoleSchema` (and type export) in `lib/validations/auth.ts` so validation and user input handling are aligned with the same role list. The `customer` role represents end users and is granted only `CREATE_FEEDBACK`.

## Data Flow
Callers pass a role string and permission identifier to the RBAC module. The module returns a boolean. No database or external services are involved.

## Error Handling
Unknown roles or missing mappings return false. This prevents accidental over-permissioning.

## Testing
Unit tests will cover role-to-permission mapping, `hasPermission`, and `canSubmitOnBehalf`. Validation tests will assert `userRoleSchema` accepts known roles and rejects unknown ones.
