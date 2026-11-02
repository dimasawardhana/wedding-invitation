# Comprehensive Technical Analysis: wedding-invitation

> Generated: 2026-10-08 | Analyzed directory: `/home/dimasajiwardhana/Documents/code/wedding-invitation`

## Executive Summary

`wedding-invitation` is the frontend of a digital wedding-invitation SaaS ("Undanganku"). It is a Next.js 15 App Router application (React 19, TypeScript strict) that renders shareable invitation pages at `/{slug}`, a customer dashboard for managing invitations, and a live-preview invitation editor. All persistence lives in an **external backend** documented in `API.md` and reached via `src/lib/api.ts` against a hardcoded `http://localhost:8080` base URL; the repo itself is pure frontend with no database, server actions, or API routes of its own.

The dominant architectural pattern is a **client-side SPA wearing a Next.js costume**: nearly every page is `"use client"`, global mutable state lives in two Zustand stores persisted to `localStorage` (`src/store/useInvitationStore.ts`, `src/store/useAuthStore.ts`), and the invitation read path (`src/components/engine/InvitationShell.tsx`) renders templates from a registry (`src/templates/registry.ts`) — one full-screen slideshow template and one scrolling template. Server state is managed by TanStack Query; form state by React Hook Form. The split between "store state" (Zustand) and "server data" (Query) is the source of the codebase's most serious defect: the public invitation page renders **theme, hero image, and wishes from the visitor's local store instead of the invitation's server-side data**, so guests may see the wrong theme and an always-empty wishes wall.

Health assessment: the code is type-strict, consistently styled, and the template-registry seam is clean — but the project is pre-production. There are no tests (a `playwright` devDependency is unused), no CI, no Dockerfile, no environment-based configuration, and several deliberately fake flows (mock dashboard stats in `OverviewTab.tsx`, a local-only RSVP delete in `GuestsTab.tsx`, a "successful" RSVP confirmation when submission is skipped). The 654-line `InvitationEditor.tsx` is the maintainability hotspot.

Top 3 recommendations:
1. **Fix the public read path**: derive theme/hero/wishes from the API response, not the persisted Zustand store (`InvitationShell.tsx:8-9,32-37`; `api.ts:214`).
2. **Eliminate fake-success paths**: RSVP no-op confirmation (`RSVPForm.tsx:121-134`), local-only guest deletion (`GuestsTab.tsx:151-158`), hardcoded stats (`OverviewTab.tsx:5-46`).
3. **Make it deployable**: env-driven API base URL (`api.ts:5`), add a `type-check` script (referenced by `AGENTS.md` but absent from `package.json`), and add mapper/flow tests plus CI.

## 1. Project Overview

### 1.1 Purpose & Scope

A SaaS where couples build a personalized wedding invitation page: pick a template, edit couple details, love-story timeline, event schedule (akad/resepsi), gallery, gifts (bank transfer + QRIS), and theme; guests open the public URL and RSVP. The repository scope is **frontend only** — the backend (auth, invitation CRUD, RSVP, image upload) is a separate service; its HTTP contract is fully specified in `API.md` (JWT bearer auth, 72h token expiry, `{status, data, message}` envelope, per-user invitation ownership with `403`).

### 1.2 Repository Structure

```
wedding-invitation/
├── API.md                  # 802-line backend API contract (authoritative)
├── package.json            # scripts: dev(:3001), build, start, lint
├── next.config.ts          # remote image allowlist (picsum, unsplash, localhost:9000)
├── tsconfig.json           # strict, @/* → ./src/*
├── eslint.config.mjs       # eslint-config-next core-web-vitals + typescript
├── public/                 # default create-next-app SVGs only (no music.mp3)
└── src/
    ├── app/                # 8 routes: /, login, register, dashboard, dashboard/[id],
    │                       #   dashboard/editor, [slug]
    ├── components/
    │   ├── auth/           # AuthGuard (client-side token gate)
    │   ├── dashboard/      # DashboardLayout, InvitationList, tabs/{Overview,Guests,Gallery,Theme},
    │   │   └── editor/     # InvitationEditor (654 LOC), PhoneFrame, PreviewGallery
    │   ├── engine/         # InvitationShell — template dispatch + data fetch
    │   ├── slides/         # 8 slide components shared by templates
    │   └── ui/             # SafeImage (next/image with error placeholder)
    ├── templates/          # registry.ts, types.ts, Storyteller, ModernScroll
    ├── hooks/              # useInvitation (public read via TanStack Query)
    ├── lib/api.ts          # API client, DTO types, 4 bidirectional mappers
    ├── store/              # useAuthStore, useInvitationStore (both zustand+persist)
    └── providers/          # QueryProvider
```

~5,576 LOC of TypeScript/TSX across 38 files; largest file is `src/components/dashboard/editor/InvitationEditor.tsx` (654 LOC).

### 1.3 Technology Stack

From `package.json`:

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `15.5.15` (pinned) |
| UI runtime | React / react-dom | `19.2.4` (pinned) |
| Language | TypeScript | `^5`, `strict: true` (`tsconfig.json:11`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss` | `^4` (no `tailwind.config`; theme via `@theme` in `globals.css`) |
| Animation | framer-motion | `^12.38.0` |
| Server state | @tanstack/react-query | `^5.99.2` |
| Client state | zustand (+ `persist` middleware) | `^5.0.12` |
| Forms | react-hook-form | `^7.73.1` |
| Icons | lucide-react | `^1.8.0` |
| Fonts | `next/font/google`: Playfair Display, Geist, Geist Mono (`layout.tsx:6-20`) | — |
| Testing (declared only) | playwright | `^1.59.1` — **unused; no test files exist** |

Runtime services (external): REST API at `http://localhost:8080` (`src/lib/api.ts:5`), S3-compatible image storage implied by `localhost:9000` remote image pattern (`next.config.ts:8`) and the `/api/v1/admin/upload/image` endpoint (`api.ts:285`).

## 2. Architecture

### 2.1 High-Level Architecture

A single Next.js application in a **client-heavy monolith** pattern with three internal layers and one external backend:

```
            ┌────────────────────────────── Next.js (port 3001) ─────────────────────────────┐
            │                                                                                 │
 Browser ──▶│  app/ routes (mostly "use client")                                              │
            │    /            landing → redirect to /dashboard if token (app/page.tsx:19-21)   │
            │    /login /register ── auth mutation → useAuthStore.setAuth                      │
            │    /dashboard ── AuthGuard ▶ InvitationList (useQuery ["invitations"])           │
            │    /dashboard/[id] ─ AuthGuard ▶ hydrate store from API ▶ DashboardLayout        │
            │    /dashboard/editor ── InvitationEditor (RHF ▶ Zustand ▶ PATCH)                 │
            │    /[slug] ── InvitationShell ▶ useInvitation ▶ registry ▶ Template             │
            │                                                                                 │
            │  State: Zustand (persist: localStorage)   Server cache: TanStack Query           │
            │      wedding-auth-store                       ["invitation", slug]              │
            │      wedding-invitation-store                 ["invitations"], ["rsvp-guests"]   │
            └───────────────────────────────────┬──────────────────────────────────────────────┘
                                                │ fetch (Bearer JWT from auth store)
                                                ▼
                              External backend @ http://localhost:8080
                              /api/v1/auth/*, /api/v1/admin/*, /api/v1/public/*
                              (contract: API.md; image storage @ localhost:9000)
```

There are no Next.js server components doing data work except trivial param unwrapping (`app/[slug]/page.tsx:5-7`); all I/O happens in the browser. No middleware, no route handlers, no server actions.

### 2.2 Component Breakdown

**`src/lib/api.ts` (304 LOC) — API client and anti-corruption layer.** The only file that knows the wire format. Contains DTO types (`ApiInvitation`, `ApiRsvp`, `ApiCouple`, snake_case), a generic `request<T>()` unwrapping the `{status, data, message}` envelope (`api.ts:81-86`), 11 endpoint functions split into `/auth`, `/admin` (Bearer via `authHeaders()` reading `useAuthStore.getState()` outside React, `api.ts:7-10`), and `/public`, plus four bidirectional mappers between API DTOs and app models (`apiInvitationToInvitationData`, `storeToApiPatchPayload`, `apiInvitationToStoreState`, `apiRsvpToWish`). `uploadImage` is hand-rolled `FormData` fetch (`api.ts:282-293`).

**`src/store/` — global client state.** `useAuthStore` holds `{token, user}` persisted as `wedding-auth-store` (`useAuthStore.ts:21-31`). `useInvitationStore` holds the entire invitation document being edited — 17 fields including couple, timeline, events, gallery, bank/QRIS accounts, wishes, theme — persisted as `wedding-invitation-store` with defaults for a sample couple ("Tony & Stella", `useInvitationStore.ts:59-128`), plus `updateInvitation(patch)` / `resetInvitation()`.

**`src/components/engine/InvitationShell.tsx` — public read engine.** Fetches via `useInvitation(slug)`, picks a template from `TEMPLATE_MAP[layoutId]` with fallback to the default (`InvitationShell.tsx:12`), and renders loading/error/invitation states. Note it sources `slug`, `heroImage`, `theme` from the **store**, not only from fetched data (`InvitationShell.tsx:8-9,33-36`) — see §9.3.

**`src/templates/` — presentation layer with a clean seam.** `registry.ts` defines the `TemplateId` union from a const array, a `TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>>`, and `DEFAULT_TEMPLATE_ID = "storyteller"` (`registry.ts:6-26`). Both templates consume the same `TemplateProps` (`types.ts:4-9`):
- `StorytellerTemplate.tsx` (198 LOC): 8-slide vertical slideshow. `AnimatePresence mode="wait"` with `motion.div` keyed by index, spring `stiffness:100, damping:20`, `initial y:"100%" → 0 → exit y:"-100%"` (`StorytellerTemplate.tsx:115-126`). Navigation: wheel deltaY direction (`:33-37`), click top/bottom half (`:39-45`), dot nav + prev/next buttons (`:128-179`), background `<audio>` with play toggle (`:113,54-62`). Slide 0 (HeroCover) intentionally disables wheel/click to force the "Open Invitation" button (`:34,40`).
- `ModernScrollTemplate.tsx` (379 LOC): one-page scroll with section components and `fadeUp` scroll reveals; reuses `RSVPForm` (`:10`).

**`src/components/slides/` — 8 shared slide components** (HeroCover, CoupleDetail, LoveJourney, EventDetail, Gallery, DigitalGift, RSVPForm, Closing) mapped to indices 0-7 in `StorytellerTemplate.renderSlide` (`:64-105`).

**`src/components/dashboard/` — admin surface.** `InvitationList.tsx` (387 LOC): grid of cards from `useQuery(["invitations"])`, create-modal (`createInvitation` with slug + two nicknames, `:105-249`), edit navigates to `/dashboard/[id]`. `DashboardLayout.tsx` (210 LOC): sidebar shell with two active tabs (`overview`, `guests` — `:22-27`). `tabs/GuestsTab.tsx` (377 LOC): RSVP table with 30s polling (`GuestsTab.tsx:148`), search/filter/sort, CSV export via Blob download (`:26-43`). `tabs/OverviewTab.tsx`: static mock data (`:5-46`). `editor/InvitationEditor.tsx` (654 LOC): see §3 Flow 4. `editor/PhoneFrame.tsx` (108 LOC): device chrome reusing `TEMPLATE_MAP` for live preview.

**`src/components/auth/AuthGuard.tsx` (29 LOC).** Client-side gate: no token in the persisted store → `router.replace("/login")`; renders children only after a microtask sets `checked` (`AuthGuard.tsx:12-28`). Pure UI gate — no token validation.

### 2.3 Data Architecture

No database, ORM, or migrations in this repo. The backend owns storage (schema not visible here; `API.md` shows UUID ids, ISO timestamps, `user_id` ownership). Frontend data model:

- **App domain model** `InvitationData` (`useInvitation.ts:50-65`) — the render contract for templates: couple `Person`s, `TimelineEvent[]` (story), `WeddingEvent[]` (akad/resepsi), `gallery: string[]`, `BankAccount[]`, `QrisAccount[]`, `Wish[]`.
- **Wire model** `ApiInvitation` (`api.ts:44-56`) — snake_case, nested `couple`, nullable collections.
- **Editor model** `InvitationStoreState` (`useInvitationStore.ts:34-52`) — camelCase, `galleryItems: {id,url,caption}[]`.

Three converters (`api.ts:177-280`) shuttle between them. Caching: TanStack Query with `staleTime: 60000` on the public read (`useInvitation.ts:75`); no persistence of server cache. Client persistence is Zustand `persist` → localStorage, which doubles as an unsaved-work buffer for the editor and as an (undesirable) source of truth for the public page.

### 2.4 API Surface

The frontend consumes (per `api.ts` and `API.md`):

| Endpoint | Method | Auth | Used by |
|---|---|---|---|
| `/api/v1/auth/login`, `/auth/register` | POST | — | `login`/`register` pages |
| `/api/v1/admin/invitation` | POST | Bearer | `InvitationList` create modal, `InvitationEditor.ensureInvitation` |
| `/api/v1/admin/invitations` | GET | Bearer | `InvitationList` |
| `/api/v1/admin/invitation/{id}` | GET / PATCH / DELETE | Bearer | `[id]` page hydrate; editor save; `deleteInvitation` (**unused**) |
| `/api/v1/admin/invitation/{id}/rsvp-list` | GET | Bearer | `GuestsTab` |
| `/api/v1/admin/upload/image` | POST (multipart) | Bearer | editor/gallery upload |
| `/api/v1/public/invitation/{slug}` | GET | — | `useInvitation` |
| `/api/v1/public/rsvp` | POST | — | `RSVPForm` |

Auth style: JWT Bearer, 72h expiry, ownership enforced server-side (`API.md:10-15`). No versioning/negotiation beyond the `/v1/` path prefix. The frontend exposes no API of its own.

## 3. Application Flows

### 3.1 Guest opens an invitation (`/{slug}`)

1. `app/[slug]/page.tsx:5-7` — server component awaits `params`, renders `<InvitationShell slug={slug} />`.
2. `InvitationShell.tsx:8-12` — reads `layoutId`, `heroImage`, `theme` from `useInvitationStore`; calls `useInvitation(slug)`.
3. `useInvitation.ts:67-77` — TanStack Query `["invitation", slug]` → `getInvitationBySlug` → `apiInvitationToInvitationData` (defensive `?? ""` mapping, event type coerced to `"akad"|"resepsi"`, `api.ts:201-210`).
4. Registry dispatch (`InvitationShell.tsx:12`): unknown `layoutId` falls back to `storyteller`.
5. `StorytellerTemplate` renders slide 0 (HeroCover). "Open" (`handleOpen`, `:47-52`) advances to slide 1 and autoplays music (`theme.music` or fallback `/music.mp3` — **the file does not exist in `public/`**). Guest navigates wheel/click/buttons; slide 5 `RSVPForm` posts to `/api/v1/public/rsvp`.
6. Outcome: guest views and RSVPs. Caveats: theme/hero come from the visitor's local store, and the wishes wall is always empty (see §9.3).

### 3.2 Authentication

1. `app/login/page.tsx:17-23` — `useMutation(login)` → `api.ts:93-99` → `setAuth(token, user)` → persisted → `router.push("/dashboard")`.
2. Protected pages wrap content in `AuthGuard` (`dashboard/page.tsx:4-9`, `dashboard/[id]/page.tsx:52-55`): token absence → `/login`.
3. Logout: `clearAuth()` + redirect (`InvitationList.tsx:257-260`, `DashboardLayout.tsx:66-69`).
4. Note: `app/register/page.tsx` (118 LOC) mirrors login; landing page redirects authenticated users to the dashboard (`app/page.tsx:19-29`).

### 3.3 Dashboard list → open a specific invitation

1. `InvitationList.tsx:262-265` — `useQuery(["invitations"], listInvitations)`, skeleton cards while loading (`:28-41`).
2. Create modal → `createInvitation` (`:112-139`) → `updateInvitation(apiInvitationToStoreState(api))` → push `/dashboard/editor`.
3. Edit card → `updateInvitation(apiInvitationToStoreState(inv))` → push `/dashboard/{id}` (`:267-270`).
4. `dashboard/[id]/page.tsx:17-28` — if the store already holds this `invitationId`, render immediately; otherwise `getInvitationById(id)` → `updateInvitation(apiInvitationToStoreState(api))`; failure shows a not-found screen. Then `DashboardLayout` with Overview/Guests tabs.

### 3.4 Editor editing + save (the core write path)

1. `app/dashboard/editor/page.tsx` renders `InvitationEditor` (**no AuthGuard** — see §8).
2. Mount (`InvitationEditor.tsx:507-545`): reset the RHF form from the store, then `ensureInvitation()` — reconciles store ↔ backend: if `invitationId` exists, verify with `getInvitationById`; on failure fall back to slug lookup, then to `createInvitation`, with **empty catch blocks** (silent failure → subsequent saves hit no server).
3. Form model: one flat `EditorFormData` (`:20-34`) converted store↔form↔live-preview-data (`storeToFormData:36-63`, `buildLiveData:65-80`). `watch()` feeds `PhoneFrame` for real-time preview (`:638`).
4. Save: eight per-section `useMutation`s plus an "all" mutation, all calling the identical `persistSection` (`:572-585`), which writes the whole form into the store and then `patchInvitation(id, storeToApiPatchPayload(state))` — i.e., **every section save PATCHes the entire invitation document** (`:547-570`). `handleSave` triggers validation only for `["title"]` regardless of section (`:587-590`).
5. A floating "Simpan Semua" bar appears when the form is dirty (`:643-651`).

### 3.5 RSVP management (dashboard)

1. `GuestsTab.tsx:140-149` — `useQuery(["rsvp-guests", invitationId])`, `refetchInterval: 30000`, disabled without `invitationId`.
2. `apiRsvpToWish` converts `ApiRsvp.attendance_status: boolean` → `"hadir"|"tidak"` (`api.ts:295-304`).
3. Derived metrics (confirmed pax, confirmations, wishes count), client-side search/filter/sort over the full list (`:169-183`), CSV export (`:26-43`).
4. Delete button mutates a **local-only** fake (`:151-158`) — no endpoint call; the row reappears on next poll.

### 3.6 Additional Flows Reference

- **Registration** — `app/register/page.tsx` (name/email/password → `register()` → same `setAuth` path as Flow 3.2).
- **Image upload** — `CoverUploader` (`InvitationEditor.tsx:172-225`), `PersonFields` photo upload (`:225`), gallery upload (`:402-424`) → `uploadImage()` (`api.ts:282-293`) → returned URL stored in form state.
- **Modern Scroll rendering** — same `InvitationShell` dispatch, different layout: `ModernScrollTemplate.tsx:344-379` composes section components and reuses `RSVPForm`.
- **Template switching** — `TemplateSelector` (`InvitationEditor.tsx:487`, rendered at `:619-622`) writes `layoutId`; effect visible in `PhoneFrame` preview.
- **Music playback** — `StorytellerTemplate` audio element + toggle (`:113,54-62,181-193`); no `music.mp3` asset exists.

## 4. Design Decisions & Trade-offs

1. **Template registry over routing per template** (`templates/registry.ts`). Chosen: one `[slug]` route, runtime dispatch by `layoutId`. Trade-off: adding a template is one file + registry entry, but `TEMPLATE_MAP` is `Record<string, ...>` rather than `Record<TemplateId, ...>`, weakening exhaustiveness checking.
2. **Zustand persist as editor working-set AND public-page state source.** Chosen: one store reused everywhere. Benefit: editor gets free unsaved-state survival and cross-page hydration. Cost: the public invitation page inherits whatever is in the visitor's localStorage (defaults, stale theme, previous invitation), which is a correctness bug at scale (§9.3).
3. **Full-document PATCH per section save** (`persistSection`). Chosen: simplicity — one payload shape, server does merge. Trade-off: bandwidth and race risk if two tabs edit the same invitation (last-writer-wins whole-document).
4. **Client-side auth only.** Chosen: zero server surface in this repo. Trade-off: guards are cosmetic; token in localStorage is XSS-readable; editor route lacks even the AuthGuard other admin pages use (`dashboard/editor/page.tsx`).
5. **Thin generic `request<T>()` with envelope unwrap** (`api.ts:81-86`). Chosen: minimal boilerplate. Cost: no `res.ok` check, no timeout, assumes JSON on every response (a 500 HTML page throws an opaque `SyntaxError`), and `uploadImage` duplicates the envelope logic.
6. **Mock-first dashboard.** `OverviewTab` stats and `InvitationList` "Aktif" badge are hardcoded; the RSVP wall on the public page renders only `initialWishes` (always `[]` from the API mapper, `api.ts:214`). Deliberate scaffolding, but currently indistinguishable from real features to a user.
7. **Tailwind v4 CSS-first config** — `globals.css` `@theme inline` (`globals.css:8-14`) with no JS config file; brand color `#D4AF37` (gold) is hardcoded as a literal ~40 times across components instead of a token.

## 5. Code Quality & Patterns

### 5.1 Code Organization & Conventions

Consistent, readable conventions: PascalCase components, camelCase hooks/stores, one component per file, `"use client"` on every interactive module, Indonesian UI copy throughout. Layering is respected — components never `fetch` directly; everything routes through `lib/api.ts`. Naming drift exists in the domain ("events" means story timeline in the store but wedding schedule in the API — `storeToApiPatchPayload` maps `store.events → stories`, `store.weddingEvents → events`, `api.ts:250-251`), which is documented nowhere except the mapper.

Duplicated type definitions are the main DRY violation: `Person` (`useInvitation.ts:6-12`, `useInvitationStore.ts:14-20`), `ThemeConfig`/`GalleryItem` re-declared in `PhoneFrame.tsx:6-16` instead of importing from the store, and `COLOR_SCHEME_MAP` duplicated between `StorytellerTemplate.tsx:17-22` and `ModernScrollTemplate.tsx:12-17` (while the editor has its own `COLOR_SCHEMES`, `InvitationEditor.tsx:82-87` — three sources for the same palette).

Two structural outliers: `InvitationEditor.tsx` (654 LOC, 15 internal components + 8 clone mutations) and dead code — `GalleryTab.tsx` (430 LOC), `ThemeTab.tsx` (152 LOC), `PreviewGallery.tsx` (58 LOC), and `deleteInvitation()` are exported/imported nowhere (verified by grep; `DashboardLayout` only renders Overview and Guests tabs).

### 5.2 Type Safety & Validation

`tsconfig.json` is `strict: true` with `noEmit`, `isolatedModules`, path aliases — good baseline. Not enabled: `noUncheckedIndexedAccess`, `noImplicitOverride`. No `as any`/`@ts-ignore` found in `src/`. Types are honest at the boundary: nullable API fields are `| null` in DTOs and the mappers default them explicitly (`api.ts:177-215`); `WeddingEvent.type` is coerced rather than cast blindly (`api.ts:203`).

Runtime validation is effectively absent: no zod/valibot/yup anywhere. RHF validation is minimal — `handleSave` triggers only `title`, and the schema itself defines no `required` rules (form type has no resolver, `InvitationEditor.tsx:501`). The public RSVP form guards only non-empty name (`RSVPForm.tsx:139`). Slug uniqueness/formatting is left to the server (client just lowercases and dash-joins spaces, `InvitationList.tsx:181`). `ApiEnvelope.status` trust means a malformed response becomes an unhandled exception rather than a typed error.

### 5.3 Error Handling

No centralized handler, no error boundaries, no logging/telemetry (zero `console.*` in `src/`). Pattern is per-mutation UI feedback: `mutation.isError` messages in forms (`InvitationList.tsx:213-218`), inline red borders in the editor's `In` component (`InvitationEditor.tsx:100-102`). Query failures render friendly empty states (`InvitationShell.tsx:22-28`, `dashboard/[id]/page.tsx:30-36`). The `request()` wrapper throws `Error(json.message)` for envelope errors only. Gaps: empty `catch {}` in `ensureInvitation` (`InvitationEditor.tsx:516,523,528,537,542`) swallow real failures (auth expiry, network down) leaving the editor silently unbound from the backend; `authHeaders()` silently omits the token when absent, so an expired session becomes a confusing 401-ish envelope error mid-edit.

### 5.4 Dependency Management

Lean and current: 8 runtime deps, all mainstream; `next`/`react` pinned, others caret-ranged. `package-lock.json` present (158 KB). `playwright` is a declared devDependency with zero usage — dead weight. No Renovate/Dependabot config, no audit gate. `tsconfig.tsbuildinfo` (107 KB) sits in the working tree (gitignored via `*.tsbuildinfo`).

## 6. Testing

### 6.1 Testing Strategy & Coverage

**There are no tests.** No `__tests__/`, no `*.test.*`/`*.spec.*` files (glob-verified), no test runner configured, no coverage tooling. `package.json` has no `test` script. The `playwright` devDependency suggests E2E was intended but never started. Repo-level `AGENTS.md` mandates `npm run lint` and `npm run type-check` after changes — but `type-check` is not defined in `package.json` (only `lint` is), so the documented gate is half-real.

### 6.2 Test Patterns & Quality

N/A — nothing to assess.

### 6.3 Testing Gaps

Highest-value untested units, in order:
1. **Mappers** (`api.ts:177-304`) — pure functions with real edge cases (null couples, unknown event types, boolean→enum attendance). Cheap, high leverage.
2. **`request()` envelope handling** — error paths are the risk area (`api.ts:81-86`).
3. **Store round-trip** — `storeToApiPatchPayload` → `apiInvitationToStoreState` should be lossless; nothing verifies that.
4. **Slideshow navigation invariants** — wheel/click clamping at slide boundaries (`StorytellerTemplate.tsx:30-45`).
5. **E2E**: guest RSVP submit → dashboard row appears (currently would expose the fake-delete bug).

## 7. DevOps & Deployment

### 7.1 Build System

Standard Next.js toolchain: `next build` (SWC), no custom webpack/turbopack config (`next.config.ts` is 11 lines, images allowlist only). `postcss.config.mjs` wires `@tailwindcss/postcss`. `dev` runs on port 3001 (`package.json:6`) while `README.md:17` still says 3000 — minor drift.

### 7.2 CI/CD Pipeline

**None.** No `.github/`, no workflow files, no lint/type/test gates in CI, no deploy automation. The only quality gate is manual `npm run lint`.

### 7.3 Deployment Architecture

Undecided/unknown. No Dockerfile, no IaC, no platform config (no `vercel.json`). The stock `README.md` implies Vercel is the intended target, which fits — but two blockers exist: the hardcoded `http://localhost:8080` API base (`api.ts:5`) makes any deployment non-functional, and the `localhost:9000` image pattern (`next.config.ts:8`) must become the real storage host. `README.md` is unmodified create-next-app boilerplate and describes none of the actual architecture; `AGENTS.md` is partially stale (claims `useInvitation` "returns mock data" — it now fetches the real API).

### 7.4 Observability & Monitoring

None. No logging, metrics, tracing, or error reporting (no Sentry etc.). The envelope's `message` is surfaced to users but never recorded.

## 8. Security Considerations

- **JWT in localStorage** (`useAuthStore.ts:21-31`, read at `api.ts:8`): any XSS steals a 72-hour token. No refresh/rotation; no logout-all. Cookies with `HttpOnly`/`SameSite` would be the safer default for a consumer product.
- **Client-only authorization**: `AuthGuard` and the unprotected `/dashboard/editor` route (`dashboard/editor/page.tsx` renders `InvitationEditor` with no guard) are cosmetic; actual protection is the backend's Bearer checks + ownership (per `API.md:15`). Acceptable only because every write endpoint requires the token server-side — but the editor will let an anonymous user type into a form that then fails.
- **Public endpoints unauthenticated** by design (`/public/invitation/{slug}`, `/public/rsvp`): RSVP is unvalidated and unthrottled client-side; expect spam without server-side rate limiting (out of repo scope, worth flagging to backend).
- **Secrets**: none committed; `.env*` gitignored (`.gitignore:30`); no env vars are used in code at all — the API URL is hardcoded instead (`api.ts:5`), which is both a deploy blocker and a mixed-content risk (https site → http API).
- **Input sanitization**: React escaping covers injection; CSV export quotes/escapes `"` (`GuestsTab.tsx:30-33`) but does not neutralize leading `=`/`+`/`-`/`@` — a classic CSV-formula injection vector for Excel users, since guest-supplied `message` and `name` flow verbatim into the file.
- **Images**: `next/image` with a remote allowlist (`next.config.ts:4-9`) mitigates SSRF-ish arbitrary image loading; `SafeImage` adds graceful fallback (`SafeImage.tsx:45-60`).

## 9. Assessment

### 9.1 Strengths

- **Clean template seam**: `TemplateProps` + registry (`templates/types.ts`, `templates/registry.ts`) makes templates pluggable, and both templates share slide components — no duplication of the RSVP/gift logic.
- **Disciplined API boundary**: single client file, typed DTOs, explicit defensive mappers; components never touch `fetch`.
- **Strict, clean TypeScript**: no `any`-escapes found; enums modeled as unions (`"akad" | "resepsi"`); modern Next 15 `Promise<params>` patterns used correctly (`[slug]/page.tsx:3-6`, `[id]/page.tsx:50`).
- **Thoughtful UX details**: skeleton loading, live phone preview in the editor, optimistic cache update in `GuestsTab`, CSV export with BOM for Excel, `SafeImage` error placeholders, wheel/click/button/nav redundancy in the slideshow.
- **Sensible server-state vs client-state split** in the dashboard (Query for lists, Zustand only for the working document and session).

### 9.2 Areas for Improvement

1. **Public page must not read the store's theme/hero** — pass `theme_config`/`heroImage` through `useInvitation`'s data path instead (`InvitationShell.tsx:8-9,33-36`). Effort: low. Impact: high.
2. **Ship wishes on the public page**: `apiInvitationToInvitationData` hardcodes `wishes: []` (`api.ts:214`); either add a public wishes endpoint or fetch RSVPs for the public view. Effort: medium (needs backend).
3. **Remove fake flows** — `OverviewTab` mock stats, local-only guest delete (`GuestsTab.tsx:151-158`), RSVP success without `invitationId` (`RSVPForm.tsx:122-133`). Effort: low. Impact: high (trust).
4. **Env-based API URL**: `NEXT_PUBLIC_API_URL` with a fallback, replacing `api.ts:5`. Effort: low. Impact: high (deployability).
5. **Split `InvitationEditor.tsx`**: extract section components + a single `useSaveSection(section)` hook replacing the 8 cloned mutations (`:572-585`). Effort: medium. Impact: medium-high.
6. **Delete dead code**: `GalleryTab.tsx`, `ThemeTab.tsx`, `PreviewGallery.tsx`, `deleteInvitation()`; ship or remove the `playwright` dependency; add the missing `type-check` script promised by `AGENTS.md`. Effort: low.
7. **Harden `request()`**: check `res.ok`, handle non-JSON, add timeout, share envelope logic with `uploadImage`. Effort: low.
8. **Tokenize brand color** `#D4AF37` in `@theme` and dedupe `COLOR_SCHEME_MAP` (3 copies). Effort: low.

### 9.3 Risks & Technical Debt

- **Correctness**: public visitors see store-default theme/hero/music and an empty wishes wall (§9.2 items 1-2); RSVP wall can never show existing RSVPs; dashboard "delete" lies.
- **Silent failure modes**: empty catches in `ensureInvitation` mean an unauthenticated/expired editor session produces a form that never saves and never says why; `request()` turns non-JSON errors into opaque `SyntaxError`s.
- **Data races**: whole-document PATCH + multi-tab editing = lost updates; persisted store means a second user on a shared browser starts from the first user's leftovers (`wedding-invitation-store` is not cleared on logout — only `clearAuth()` runs, `DashboardLayout.tsx:66-69`).
- **Missing asset**: `/music.mp3` fallback referenced at `StorytellerTemplate.tsx:113` does not exist in `public/`.
- **Docs debt**: `README.md` is boilerplate; `AGENTS.md` misdocuments `useInvitation` and a nonexistent `type-check` script; `API.md` (good) is the only accurate doc.
- **No safety net**: zero tests/CI means every refactor above is unverified by tooling.

### 9.4 Recommendations

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Route public theme/hero/wishes from API data; stop reading `useInvitationStore` in `InvitationShell` | Low | High |
| 2 | Replace `BASE_URL` with `process.env.NEXT_PUBLIC_API_URL` (+ document in `README`) | Low | High |
| 3 | Delete dead code (`GalleryTab`, `ThemeTab`, `PreviewGallery`, `deleteInvitation`, unused `playwright`) and add `type-check` script | Low | Medium |
| 4 | Fix fake flows: real RSVP delete endpoint or remove button; gate RSVP success on actual submission; wire Overview to real queries or mark "demo" | Low-Med | High |
| 5 | Add Vitest + tests for `api.ts` mappers and `request()` error paths; add GitHub Actions (lint, type-check, test, build) | Medium | High |
| 6 | Refactor `InvitationEditor` into section components + one save hook; add AuthGuard to `/dashboard/editor` | Medium | Medium |
| 7 | Clear `wedding-invitation-store` on logout; move auth token to HttpOnly cookie (backend change) | Medium | Medium |
| 8 | Provide `public/music.mp3` or make music opt-in; CSV-formula sanitize the export | Low | Low-Med |

## Appendix

### A. File Tree (Top 3 Levels)

```
wedding-invitation/
├── API.md, README.md, AGENTS.md
├── package.json, package-lock.json, tsconfig.json, next.config.ts
├── eslint.config.mjs, postcss.config.mjs, next-env.d.ts, .gitignore
├── public/  (default CNA svgs)
└── src/
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css, favicon.ico
    │   ├── dashboard/{page.tsx, [id]/page.tsx, editor/page.tsx}
    │   ├── login/page.tsx, register/page.tsx
    │   └── [slug]/page.tsx
    ├── components/
    │   ├── auth/AuthGuard.tsx
    │   ├── dashboard/{DashboardLayout.tsx, InvitationList.tsx}
    │   │   ├── editor/{InvitationEditor.tsx, PhoneFrame.tsx, PreviewGallery.tsx*}
    │   │   └── tabs/{OverviewTab.tsx, GuestsTab.tsx, GalleryTab.tsx*, ThemeTab.tsx*}
    │   ├── engine/InvitationShell.tsx
    │   ├── slides/{HeroCover, CoupleDetail, LoveJourney, EventDetail,
    │   │          Gallery, DigitalGift, RSVPForm, Closing}.tsx
    │   └── ui/SafeImage.tsx
    ├── hooks/useInvitation.ts
    ├── lib/api.ts
    ├── providers/QueryProvider.tsx
    ├── store/{useAuthStore.ts, useInvitationStore.ts}
    └── templates/{registry.ts, types.ts, StorytellerTemplate.tsx, ModernScrollTemplate.tsx}
```
`*` = dead code (no imports anywhere in `src/`).

### B. Dependency Catalog

| Package | Version | Role |
|---|---|---|
| next | 15.5.15 | Framework/App Router, fonts, Image |
| react / react-dom | 19.2.4 | UI runtime |
| @tanstack/react-query | ^5.99.2 | Server state (invitations, RSVP lists) |
| zustand | ^5.0.12 | Client state + localStorage persistence |
| framer-motion | ^12.38.0 | Slide transitions, reveals, floating save bar |
| react-hook-form | ^7.73.1 | Editor form state + field arrays |
| lucide-react | ^1.8.0 | Icon set |
| typescript | ^5 | Type checking (`strict`) |
| tailwindcss / @tailwindcss/postcss | ^4 | Styling (CSS-first config) |
| eslint / eslint-config-next | ^9 / 16.2.4 | Linting (core-web-vitals + TS) |
| playwright | ^1.59.1 | **Unused** |
| @types/{node,react,react-dom} | ^20 / ^19 | Types |

### C. Key File Reference

| Purpose | File |
|---|---|
| Backend contract | `API.md` |
| API client + DTOs + mappers | `src/lib/api.ts` |
| Auth session store | `src/store/useAuthStore.ts` |
| Invitation working-copy store | `src/store/useInvitationStore.ts` |
| Public read hook | `src/hooks/useInvitation.ts` |
| Public page dispatch | `src/components/engine/InvitationShell.tsx` |
| Template registry / props contract | `src/templates/registry.ts`, `src/templates/types.ts` |
| Slideshow template | `src/templates/StorytellerTemplate.tsx` |
| Scrolling template | `src/templates/ModernScrollTemplate.tsx` |
| Slides (shared) | `src/components/slides/*` |
| Auth gate | `src/components/auth/AuthGuard.tsx` |
| Invitation list + create | `src/components/dashboard/InvitationList.tsx` |
| Dashboard shell + tabs | `src/components/dashboard/DashboardLayout.tsx`, `tabs/*` |
| Editor (write path) | `src/components/dashboard/editor/InvitationEditor.tsx` |
| Live preview | `src/components/dashboard/editor/PhoneFrame.tsx` |
| Image fallback | `src/components/ui/SafeImage.tsx` |
| Root layout / fonts / theme | `src/app/layout.tsx`, `src/app/globals.css` |
