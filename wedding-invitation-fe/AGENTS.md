# AGENTS.md — Wedding Invitation SaaS

## Project Overview
Next.js App Router SaaS for digital wedding invitations. Stack: TypeScript, Tailwind CSS, Framer Motion, TanStack Query.

## Key Architecture

### Directory Layout
```
src/
  app/
    layout.tsx          # Wraps with QueryProvider
    page.tsx
  providers/
    QueryProvider.tsx   # QueryClientProvider (use client)
  hooks/
    useInvitation.ts    # useInvitation(slug: string) — TanStack Query
  components/
    engine/
      InvitationShell.tsx  # Core navigation engine (vertical slideshow)
```

### Provider Wiring
- `QueryProvider.tsx` must be `"use client"` — wraps children with `QueryClientProvider`.
- `layout.tsx` (root) wraps `{children}` with `<QueryProvider>`.

### InvitationShell Navigation Logic
- Vertical slideshow: `AnimatePresence` + `motion.div` from Framer Motion.
- Track current slide with `currentIndex` state (0–7, 8 slides total via `switch`).
- **Mouse wheel**: `onWheel` — `deltaY > 0` → next, `deltaY < 0` → prev.
- **Tap/click**: `onClick` with `clientY` — top 50% (`< window.innerHeight / 2`) → prev, bottom 50% → next.
- Transition: `spring` with `stiffness: 100, damping: 20`.
- `initial={{ y: '100%' }}`, `animate={{ y: 0 }}`, `exit={{ y: '-100%' }}`.
- Container: `h-screen w-full overflow-hidden touch-none`.

### useInvitation Hook
- Fetches the real invitation from `GET /api/v1/public/invitation/:slug` via `getInvitationBySlug`, then maps it with `apiInvitationToInvitationData` and merges the public RSVP list (`GET /api/v1/public/invitation/:slug/rsvp`) into `wishes`.
- Uses TanStack Query `useQuery` with `queryKey: ['invitation', slug]` and `staleTime: 60000`.
- API base URL comes from `NEXT_PUBLIC_API_BASE_URL` in `src/lib/api.ts`, defaulting to `http://localhost:8080`.

## Styling
- Global background: `#F8F5F2` — set in `globals.css` or `layout.tsx` body class.
- Tailwind CSS for all utility styling.

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build (needs network for Google Fonts)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (run after lint)

# End-to-end tests (Playwright, headless)
npm run test:e2e:all # Bring up infra, then run the suite — the one command
npm run test:e2e     # Suite only (infra already running)
npm run test:e2e:infra  # Postgres + MinIO + the dedicated wedding_e2e database
```
Run order after changes: `lint → type-check`.

## End-to-End Tests
- Live in `e2e/`. `playwright.config.ts` starts both servers itself: the Go API on
  `8090` and Next on `3101` — deliberately not 8080/3001, which a developer's own
  stack usually holds.
- Each spec seeds its own account and invitation through the API
  (`seedAccount`), so runs never collide and are safe to repeat.
- Tests assert against server truth (`fetchInvitation`) as well as the DOM — a
  caption is only "saved" if `PATCH` really persisted it.
- `global-setup.ts` warms `/login` and `/dashboard` so `next dev`'s on-demand
  compilation cannot race the first assertion; `global-teardown.ts` truncates
  `wedding_e2e` afterwards. MinIO objects are deleted by the specs.
- The API base comes from `NEXT_PUBLIC_API_BASE_URL` (`src/lib/api.ts`), which the
  config sets; the default remains `http://localhost:8080`.
- Browser: the suite prefers a system Chrome (`/usr/bin/google-chrome`), because
  `playwright install` needs network access. Override with `E2E_CHROME`.

## Agent Delegation
- **All front-end work** (components, pages, styling, animations): always delegate via `task(category="visual-engineering", load_skills=["frontend-design"], ...)`.
- Load the `frontend-design` skill from skills — never do UI/component work without it.

## Gotchas
- All interactive components (`useQuery`, `useState`, event handlers) need `"use client"`.
- `AnimatePresence` requires a unique `key` on each `motion.div` child for exit animations to fire.
- `touch-none` on the shell prevents default mobile scroll from interfering with custom navigation.
- Do not use `as any` or `@ts-ignore` — fix types properly.
