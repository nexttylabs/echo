# Settings Center Design

## Overview

Consolidate all settings-related features (notifications, profile, organization, etc.) into a unified Settings Center, accessible from the user dropdown menu in the sidebar.

## Current Problems

1. "Notifications Settings" appears in both navigation area and user section
2. Missing user Profile page entry
3. "Organization Settings" link points to `/settings/organizations/new` (create page instead of management page)
4. Settings features scattered across different locations

## Design Decisions

- **Settings entry**: User dropdown menu only (not in main navigation)
- **Layout**: Left-right split layout (sidebar menu + content area)
- **Categories**: Profile, Notifications, Appearance, Organization (admin), API Keys (admin/pm)

## Sidebar Structure

```
Navigation:
├── Dashboard        /dashboard
└── Feedback         /feedback

Projects:
├── + New Project
└── Project list...

User Area (bottom):
└── [Avatar] Username ▼   ← Dropdown menu
    ├── Settings         → /settings
    └── Sign Out
```

## Settings Center Routes

```
/settings
├── /settings/profile        Personal profile (default)
├── /settings/notifications  Notification preferences
├── /settings/appearance     Theme settings
├── /settings/organization   Organization management (admin only)
└── /settings/api-keys       API key management (admin/pm only)
```

## Page Content

### Profile `/settings/profile`
- Avatar upload/change
- Name editing
- Email display (read-only or editable)
- Change password

### Notifications `/settings/notifications`
- Email notification toggle
- Notification type preferences (new feedback, status changes, comment replies, etc.)

### Appearance `/settings/appearance`
- Theme toggle (light/dark/system)
- Language selection (if needed)

### Organization `/settings/organization` (admin only)
- Organization name, description editing
- Member list and role management
- Invite new members

### API Keys `/settings/api-keys` (admin/pm only)
- Key list
- Create/delete keys

## File Structure

```
app/(dashboard)/settings/
├── layout.tsx              ← Settings layout (left-right split)
├── page.tsx                ← Redirect to /settings/profile
├── profile/page.tsx
├── notifications/page.tsx
├── appearance/page.tsx
├── organization/page.tsx
└── api-keys/page.tsx

components/settings/
├── settings-sidebar.tsx    ← Left menu with role-based visibility
└── index.ts
```

## Component Changes

### Sidebar (`components/layout/sidebar.tsx`)
- Remove "Notifications Settings" and "Organization Settings" nav items
- Replace user area with `DropdownMenu` component
- Dropdown contains: Settings link, Sign Out button

### Settings Layout
```tsx
// SettingsLayout
<div className="flex">
  <aside>        ← SettingsSidebar (left menu)
  <main>         ← Content area {children}
</div>
```

### Permission Control
- `SettingsSidebar`: Conditionally render menu items based on `user.role`
- Each page: Server-side permission check (prevent direct URL access)

## Implementation Notes

- Use existing Radix UI `DropdownMenu` component
- Reuse existing notification settings page content
- Organization page should use existing organization/member management logic
