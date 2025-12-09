## Purpose

This file gives actionable, repo-specific guidance for an AI coding assistant working on this Vite + React + TypeScript project.

## Quick commands
- Install: `npm i`
- Dev server: `npm run dev` (Vite on host `::`, port `8080`)
- Build: `npm run build` or `npm run build:dev`
- Preview production build: `npm run preview`
- Lint: `npm run lint` (ESLint)

## Project overview (big picture)
- Single-page React app bootstrapped with Vite + TypeScript. Entry: `src/main.tsx` -> `src/App.tsx`.
- Client-side routing via `react-router-dom` with pages in `src/pages/` (e.g., `Index`, `FindJobs`, `Dashboard`, `JobDetail`).
- State/async data: `@tanstack/react-query` used for data caching and API calls.

## Integrations & data flow
- Supabase is the primary backend. Client is created in `src/integrations/supabase/client.ts` and re-exported via `src/lib/supabase.ts`.
- Environment variables used by Supabase must be Vite-prefixed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Typical import patterns:
  - `import { supabase } from "@/integrations/supabase/client";`
  - or `import { supabase } from "@/lib/supabase";`
- Session persistence: Supabase client is configured with `persistSession: true` and a `storageKey` of `open_to_work_auth`.

## Key files & directories
- `src/pages/` — top-level page components used in routes.
- `src/components/ui/` — design-system / shadcn-style UI components. Prefer reusing these instead of ad-hoc markup.
- `src/components/admin/` and `src/components/sections/` — grouped features (admin, landing sections).
- `src/integrations/supabase/` — single source of truth for Supabase client configuration.
- `supabase/migrations/` — SQL migrations; consult these when changing DB schema.
- `vite.config.ts` — Vite config: path alias `@` -> `src`, plugin `lovable-tagger` used in development.

## Conventions and patterns to follow
- Path alias: use `@/` when importing project modules (configured in `vite.config.ts`). Examples: `@/components/...`, `@/pages/...`.
- UI primitives follow the `components/ui/*` convention — these are thin wrappers around Radix/Tailwind components.
- Routing: declare page routes in `src/App.tsx`. Add new pages under `src/pages` and register the route there.
- Types: `src/lib/supabase.ts` exports common domain types (e.g., `UserRole`, `WorkAuthorization`) — reuse these rather than duplicating.

## Environment & dev notes
- Vite dev server binds to `::` and uses port `8080` (useful when testing on LAN or containers).
- Vite plugin `lovable-tagger` runs only in development. Avoid altering it unless you understand the dev-only tagging behavior.
- Use `VITE_` prefix for any environment variables consumed by client-side code.

## Common tasks examples
- Add a new page:
  1. Create `src/pages/MyPage.tsx` (export default component).
  2. Add a route in `src/App.tsx`: `<Route path="/mypage" element={<MyPage />} />`.
- Use Supabase in a page/component:
  ```ts
  import { supabase } from "@/lib/supabase";
  const { data, error } = await supabase.from('jobs').select('*');
  ```

## Linting / testing / CI
- Linting: `npm run lint` (ESLint). There are no project tests by default — if you add tests, document the runner here.

## Gotchas & immediate checks
- If you need to change runtime env values, edit your `.env` file or set OS env vars using `VITE_` prefix; restarting Vite required.
- Database migrations are stored in `supabase/migrations/` — run them with your Supabase CLI/dev workflow, not via internal scripts.
- When debugging auth/session issues, check `storageKey` (`open_to_work_auth`) and the Supabase client options in `src/integrations/supabase/client.ts`.

## When uncertain, inspect these files first
- `src/App.tsx` — routing and top-level providers
- `src/integrations/supabase/client.ts` — backend integration details
- `vite.config.ts` — path alias, dev server, and dev-only plugins
- `src/components/ui/` — design system primitives
- `supabase/migrations/` — schema changes

If anything here is incomplete or you'd like more examples (tests, CI, or a contributor guide), tell me which area to expand.
