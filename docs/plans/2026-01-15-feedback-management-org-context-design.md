# Feedback Management Organization Context - Design

Date: 2026-01-15

## Summary
Refactor Feedback Management to be organization-aware by default. Introduce a unified organization context resolver that reads organization from URL, headers, and cookies (in that priority) and enforces organization membership on server-side. Add an organization switcher only on `/dashboard` that writes the selected org to cookie and URL. All feedback-related pages and APIs must use the resolver to prevent cross-organization data access.

## Goals
- Enforce organization isolation across all feedback pages and APIs.
- Centralize organization resolution and authorization on the server.
- Support multi-organization users with a dashboard switcher.
- Persist organization selection with cookie and allow URL override.

## Non-Goals
- No global organization picker outside `/dashboard`.
- No super-admin global org visibility.
- No UI redesign beyond adding the switcher on `/dashboard`.

## Current State
- Some endpoints accept `organizationId` query/header but not consistently enforced.
- `/dashboard` uses a single organization and some pages still hardcode IDs.
- Multiple feedback APIs and pages query feedback by ID without consistent org checks.

## Proposed Architecture
### Organization Context Resolver
Add a new module (e.g. `lib/auth/org-context.ts`) that provides:
- `getOrgContext(request, options)`
  - Resolves `organizationId` from:
    1) URL query (`organizationId`)
    2) Header (`x-organization-id`)
    3) Cookie (`orgId`)
  - Optionally reads `organizationSlug` for portal routes when provided.
  - Returns `{ organizationId, memberRole, source }`.
  - If user is logged in and `organizationId` is present, verifies membership.
  - If user is anonymous, allows read-only contexts for public routes.
- `requireOrgContext(request, options)`
  - Same as above, but throws/returns 403 when membership is missing or invalid.

### Enforcement
- All feedback list, detail, stats, comments, votes, duplicates, and similarity APIs must call `requireOrgContext`.
- All feedback pages (dashboard, admin, feedback detail) must use resolver-derived org.
- Portal pages use slug -> org ID and bypass membership checks for read-only views.

## Data Flow
1. User lands on `/dashboard`.
2. Dashboard requests user organizations and renders a switcher.
3. Switcher selection writes `orgId` cookie and updates URL query (`?organizationId=...`).
4. Server components and API routes resolve org via URL > header > cookie.
5. Feedback queries always include `organizationId` constraint and org membership checks.

## Error Handling
- Missing org: return 400 `MISSING_ORG_ID`.
- Not a member: return 403 `FORBIDDEN`.
- Feedback not in org: return 404.
- Anonymous access to protected endpoints: return 401/403.

## Compatibility
- Existing callers that pass `organizationId` continue to work.
- New behavior is more strict; missing org will now fail with 400.
- Portal routes remain public read-only with explicit org resolution.

## Implementation Scope
- Add org context resolver and membership utilities.
- Update all feedback APIs to use resolver.
- Update feedback pages to consume resolver-derived org ID.
- Add dashboard organization switcher (only on `/dashboard`).
- Cookie handling (set on dashboard, read everywhere).

## Risks & Mitigations
- **Default org on first load**: if cookie is missing, select the first org and persist it.
- **Portal contamination**: portal routes should not read org cookie; rely on slug-derived org ID.
- **Incomplete enforcement**: audit all feedback routes and service-layer queries.

## Testing
- Unit tests for resolver precedence (URL > header > cookie) and membership check.
- API tests for org isolation on list/detail endpoints.
- Dashboard switcher test to verify cookie + URL update.

## Rollout
1. Ship resolver + API enforcement.
2. Ship dashboard switcher and default org behavior.
3. Add logging for missing org or forbidden access to validate adoption.
