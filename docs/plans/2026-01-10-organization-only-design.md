# Design: Organization-Only Model (No Projects/Boards)

**Date:** 2026-01-10
**Status:** Approved

## Summary
Move Echo to an organization-only model. Remove the “project” concept and any boards. Each organization owns exactly three resource areas: Feedback, Roadmap, and Changelog. Public portal becomes a single organization entry at `/<organizationSlug>`, with tabs switching among the three.

## Goals
- Remove all project/board concepts from data model, routes, and UI.
- Consolidate configuration at organization level (portal/widget settings, domain, visibility).
- Keep organization isolation and permissions unchanged.
- Ensure MVP: auto-create a default organization for new users.

## Non-Goals
- Data migration from existing projects (data loss is acceptable per requirement).
- Multi-portal or per-resource domains.
- Multiple organizations per user experience redesign.

## Data Model Changes
- Drop `projects` table and all `projectId` references.
- Remove `projectId` fields, indexes, and foreign keys from other tables.
- Store portal/widget configuration on organization level:
  - Option A (preferred): new `organization_settings` table.
  - Option B: add columns on `organizations`.
- Feedback, roadmap, and changelog records are keyed by `organizationId`.

## Routing & UX
- Public portal: `/<organizationSlug>`
  - Default view: Feedback
  - Tabs: Feedback / Roadmap / Changelog
- Remove routes:
  - `/settings/projects`
  - `/settings/projects/new`
  - `/settings/projects/[projectSlug]`
  - `/widget/[organizationId]/[projectId]`
- Add/update routes:
  - `/settings/organization`
  - `/settings/organization/portal`

## API Changes
- Remove project CRUD APIs.
- Update portal/widget APIs to be organization-scoped only.
- Any endpoints that require `projectId` now infer by `organizationId`.

## Content Model
- Feedback: organization-scoped list and detail views.
- Roadmap: organization-scoped items and timeline.
- Changelog: organization-scoped entries.

## Permissions
- No change: permissions remain organization-scoped.
- Admin-only access to organization settings and portal config.

## Data Loss & Rollout
- Existing project data will be dropped.
- Migration scripts should remove project-related tables/columns and cleanup foreign keys.

## Testing
- Route access: no project pages remain.
- Portal loads at `/<organizationSlug>` with tabs switching among sections.
- Organization settings update portal config successfully.
- Feedback list and detail work without `projectId`.

## Open Questions
- Final choice: `organization_settings` vs adding columns on `organizations`.
