# Admin Feedback Filters & Sorting Design

Date: 2026-01-16
Owner: Codex
Scope: /admin/feedback list filters, sorting, pagination, assignee candidates, URL-driven state

## Goals
- Provide robust filtering/sorting/pagination for admin feedback list.
- Make list state URL-driven for deep linking and refresh persistence.
- Add assignee, hasVotes, hasReplies filters with multi-select support.
- Add organization members API for assignee candidates and cache client-side.

## Non-Goals
- Redesign feedback detail/edit pages.
- Add new permissions or RBAC policies beyond existing org access.
- Introduce new analytics or tracking.

## Summary
The admin feedback list becomes fully URL-driven. Filters and sorting are encoded in query parameters, and the list fetches data from `/api/feedback` using those parameters. A new `GET /api/organizations/[orgId]/members` endpoint provides candidate assignees (displayName + userId). The client caches member lists in `sessionStorage` by organization to reduce repeated fetches.

## User Experience
- Controls bar above list: search, filters, sorting, primary action (e.g. New Feedback/Export).
- Secondary row: selected filter chips + clear all.
- Right side: total count and per-page size.
- Filters are multi-select for `status`, `type`, `priority`, `assignee`, `hasVotes`, `hasReplies`.
- Any filter/sort change resets `page=1`.

## URL Parameters
- `query`: text search across title/description.
- `status`: CSV of statuses.
- `type`: CSV of types.
- `priority`: CSV of priorities.
- `assignee`: CSV of userIds plus `unassigned`.
- `hasVotes`: CSV of boolean values (`true,false`) for multi-select behavior.
- `hasReplies`: CSV of boolean values (`true,false`) for multi-select behavior.
- `sortBy`: `createdAt | voteCount | priority | status`.
- `sortOrder`: `asc | desc`.
- `page`: numeric.
- `pageSize`: numeric.

Example:
`?status=new,planned&assignee=unassigned,usr_123&hasVotes=true&sortBy=createdAt&sortOrder=desc&page=1`

## Data Sources
- Feedback list: existing `/api/feedback` with new query parameters and filters.
- Assignees: new `/api/organizations/[orgId]/members`.

## API: GET /api/organizations/[orgId]/members
- Auth: current session user must belong to org.
- Returns array:
  - `userId` (string)
  - `displayName` (string, derived from user name/email fallback)
  - `avatarUrl` (optional)

## Assignee Cache
- `sessionStorage` key: `org:${organizationId}:members`.
- Read cache first; if stale or missing, fetch and update cache.
- UI includes fixed option `unassigned` at top.

## Error Handling
- Feedback fetch errors render inline error with next step.
- Assignee fetch failures fall back to empty list and show warning UI state.

## Accessibility
- Icon-only buttons include `aria-label`.
- Dropdowns and chips are keyboard navigable.
- Loading copy uses ellipsis character `…`.

## Testing
- Unit: query param parsing and serialization helpers.
- Integration: list fetch updates on filter change; page resets to 1.
- API: members endpoint returns only org members, denies unauthorized.

## Open Questions
- Final CTA label and action target (New Feedback vs Export).
