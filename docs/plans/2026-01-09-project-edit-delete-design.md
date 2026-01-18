# Design: Project Edit and Delete Features

## Overview
Add functionality to edit project details (name, description) and delete projects within the Project Settings page. This completes the project management lifecycle.

## Components

### 1. `ProjectEditForm`
A client component for editing basic project information.
- **Location**: `components/project/project-edit-form.tsx`
- **Props**: `project: Project`
- **State**: Uses `react-hook-form` with `zodResolver` and `updateProjectSchema`.
- **UI**:
  - Card with "Project Details" title.
  - Input for Name.
  - Textarea for Description.
  - Submit button.
- **Action**: calls `PUT /api/projects/[projectId]`.

### 2. `ProjectDeleteSection`
A client component for the "Danger Zone".
- **Location**: `components/project/project-delete-section.tsx`
- **Props**: `project: Project`
- **UI**:
  - Card with red border/styling to indicate danger.
  - Title "Danger Zone".
  - "Delete Project" button (destructive variant).
  - Confirmation Dialog (`AlertDialog`) requiring user confirmation.
- **Action**: calls `DELETE /api/projects/[projectId]`.
- **Post-Action**: Redirects to `/settings/projects` (or dashboard).

### 3. `ProjectSettings` (Refactor)
Update the existing `components/project/project-settings.tsx`.
- Currently, it contains the entire Widget Config form logic.
- **Refactoring**:
  - Extract the existing form logic into `components/project/project-widget-form.tsx`.
  - Update `ProjectSettings` to be a layout container that renders:
    1. `<ProjectEditForm />`
    2. `<ProjectWidgetForm />` (The extracted widget config)
    3. `<ProjectDeleteSection />`

## API Interactions
- **Update**: `PUT /api/projects/[projectId]` (Existing)
  - Supports partial updates of `name`, `description`, `widgetConfig`.
- **Delete**: `DELETE /api/projects/[projectId]` (Existing)
  - Deletes project and cascades (handled by DB schema, verified in previous reads).

## Plan
1. Extract `ProjectWidgetForm` from `project-settings.tsx`.
2. Create `ProjectEditForm`.
3. Create `ProjectDeleteSection`.
4. Reassemble `ProjectSettings`.
