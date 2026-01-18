# Logout Redirect Design

## Context
Currently, the logout button in the `Sidebar` component is a simple link to `/api/auth/sign-out`. This default behavior might not consistently redirect the user to the homepage (`/`) as desired, or it might rely on server-side defaults that are not configured to redirect to the homepage.

## Goals
- Ensure that clicking "Logout" ("退出") in the sidebar logs the user out.
- Ensure the user is immediately redirected to the homepage (`/`) after logout.
- Maintain existing UI styling.

## Proposed Solution

We will update the `Sidebar` component to handle logout on the client side using the `authClient` from `better-auth`.

### Changes
1.  **File:** `components/layout/sidebar.tsx`
2.  **Logic:**
    -   Import `authClient` from `@/lib/auth/client`.
    -   Import `useRouter` from `next/navigation`.
    -   Create a `handleLogout` async function:
        -   Call `await authClient.signOut()`.
        -   In the `onSuccess` callback (or immediately after await), call `router.push('/')`.
        -   Call `onClose()` if it exists (for mobile sidebar).
3.  **UI:**
    -   Change the "退出" button from a `Link` to a `div` or `span` (or keep `Link` with `href="#"` and `onClick` handler, but removing `href` is cleaner for accessibility if styled as a button).
    -   Since it's inside a `Button` component with `asChild`, we should remove `asChild` and just use the `Button` directly with `onClick`.

### Code Snippet Concept
```tsx
const handleLogout = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        router.push("/");
      },
    },
  });
  onClose?.();
};

// ...

<Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={handleLogout}>
  <LogOut className="mr-2 h-4 w-4" />
  退出
</Button>
```

## Verification
-   Click "退出" in the sidebar.
-   Verify user is logged out.
-   Verify URL changes to `/`.
