# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

Echo is a modern Next.js application using the App Router with React 19, TypeScript, and Tailwind CSS v4. The project uses Bun as the package manager and Shadcn/ui (Radix UI primitives with Base UI) for component library.

## Development Commands

This project uses **Bun** as the package manager (not npm, yarn, or pnpm).

```bash
bun dev          # Start development server on http://localhost:3000
bun run build    # Build for production
bun start        # Start production server
bun run lint     # Run ESLint
```

## Architecture

### Directory Structure
- `app/` - Next.js App Router (layout.tsx, page.tsx, globals.css)
- `components/` - Custom components
- `components/ui/` - Shadcn/ui components (14 base components)
- `lib/` - Utility functions
- `public/` - Static assets

### Import Aliases (from components.json)
```
@/components  → components/
@/lib         → lib/
@/components/ui → components/ui
@/hooks       → hooks/ (not yet created)
```

### Styling System

**Tailwind CSS v4** with inline configuration in `app/globals.css`:
- No separate tailwind.config file - uses `@theme inline` directive
- CSS custom properties for all theming (light/dark mode)
- Uses **oklch color space** for perceptually uniform colors
- Custom dark mode via `.dark` class selector
- Includes `tw-animate-css` for animations

**Shadcn/ui Configuration:**
- Style variant: `radix-maia`
- Base color: `neutral`
- Icon library: `lucide-react`
- RSC (React Server Components): enabled

### Component Conventions

1. UI components from Shadcn are in `components/ui/` - modify these directly rather than re-installing
2. Use the `cn()` utility from `lib/utils.ts` for class name merging (combines clsx and tailwind-merge)
3. All component files are `.tsx` with React Server Components enabled

### TypeScript Configuration

- `strict: true` enabled
- Path alias `@/*` maps to project root
- Module resolution: `bundler` mode
- JSX: `react-jsx` transform

### Internationalization

- The project uses **next-intl** for internationalization.
- All user-facing text in components and pages must be localized using language files (e.g., `messages/en.json`).
- Avoid hardcoding strings in TSX files; use the `useTranslations` hook instead.

## Tech Stack Summary

| Technology | Version |
|------------|---------|
| Next.js | 16.1.1 |
| React | 19.2.3 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Shadcn/ui | 3.6.2 |
| Base UI | 1.0.0 |
| Radix UI | 1.4.3 |
| Lucide React | 0.562.0 |

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes