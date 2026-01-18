# Echo Business Logic Chain

## Registration and Organization Bootstrap
- Register user -> create organization -> add admin member -> create profile
- Entry: app/api/auth/register/handler.ts
- Models: user, organizations, organization_members, user_profiles

## Organization and Membership
- Create organization (admin-only)
- Manage members (remove, change role, keep at least one admin)
- Invitations (admin-only, email invite, token expiry)
- Entry: app/api/organizations/handler.ts
- Entry: app/api/organizations/[orgId]/members/[memberId]/handler.ts
- Entry: app/api/organizations/[orgId]/invitations/handler.ts
- Models: organizations, organization_members, invitations

## Organization Settings (Portal/Widget)
- Read/update portal config for organization
- Widget config resolves from organization_settings with URL overrides
- Entry: lib/services/portal-settings.ts
- Entry: app/widget/[organizationId]/page.tsx
- Models: organization_settings

## Feedback Lifecycle
- Create feedback (validation, optional submit-on-behalf, auto-classify)
- List feedback (filters, pagination, vote count)
- Get feedback detail (attachments, votes, status history)
- Update status (status_history append + notify)
- Soft delete feedback
- Entry: app/api/feedback/route.ts
- Entry: app/api/feedback/handler.ts
- Entry: app/api/feedback/[id]/route.ts
- Entry: lib/feedback/get-feedback-by-id.ts
- Models: feedback, status_history, attachments, votes

## Comments
- Auth user comment (internal allowed for org members)
- Guest comment (public only, guest token cookie)
- Notify feedback submitter for public comments
- Entry: app/api/feedback/[id]/comments/route.ts
- Models: comments

## Votes
- Vote add/remove with visitorId or userId
- Entry: app/api/feedback/[id]/vote/route.ts
- Models: votes

## Tags
- Suggest tags from AI
- Apply tags to feedback
- Sync predefined tag into tags table
- Entry: app/api/feedback/[id]/suggest-tags/route.ts
- Entry: app/api/tags/sync/route.ts
- Models: tags, feedback_tags

## AI Processing
- Async classification, tag suggestions, duplicate detection
- Persist ai_processing_results and duplicate_feedback
- Update feedback processingStatus/processedAt
- Entry: lib/workers/feedback-processor.ts
- Entry: app/api/feedback/[id]/processing-status/route.ts
- Models: ai_processing_results, duplicate_feedback, feedback

## Notifications
- Status change -> notify submitter
- Public comment -> notify submitter (except author)
- Email delivery + notification status updates
- Entry: lib/services/notifications/index.ts
- Models: notifications, notification_preferences

## Webhooks
- CRUD webhooks for organization
- Event delivery with signature, retries, and webhook_events tracking
- Entry: app/api/webhooks/route.ts
- Entry: app/api/webhooks/[webhookId]/route.ts
- Entry: lib/webhooks/sender.ts
- Entry: lib/webhooks/retry.ts
- Models: webhooks, webhook_events

## GitHub Integration
- Configure integration and webhook secret
- Sync feedback to GitHub issue
- Sync issue state back to feedback status
- Entry: app/api/integrations/github/route.ts
- Entry: lib/services/github-sync.ts
- Entry: app/api/webhooks/github/route.ts
- Models: github_integrations, feedback

## API Keys
- Create/list/toggle/delete API keys
- Verify API key and attach org context
- Entry: lib/services/api-keys.ts
- Entry: lib/middleware/api-key.ts
- Models: api_keys
