# Plan

We will move Portal settings under each project, create new project-scoped Portal routes with an overview page, migrate existing Portal settings pages into the new structure, and update navigation so Portal is no longer a global settings section.

## Scope
- In: project-scoped Portal routes, Portal overview page, migration of Portal settings pages, navigation updates
- Out: new backend fields/logic, Portal front-end public UI changes, analytics on overview

## Action items
[ ] Review current Portal settings pages and project settings page to confirm fields and entry points
[ ] Add project-scoped Portal routes and an overview page with portal sub-nav
[ ] Migrate existing Portal settings pages to new routes (experience/growth/access/modules)
[ ] Re-map fields so access page holds visibility/permission/noindex, growth holds sharing + SEO
[ ] Update global settings sidebar and project settings entry to link Portal
[ ] Manually verify routing, permissions, and project context switching

## Open questions
- None (decisions: remove /settings/portal-* routes, modules as overview fold, no analytics on overview)
