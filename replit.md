# EcoQuest

EcoQuest is a full-stack gamified carbon footprint tracker that lets users log activities, complete daily eco-challenges, earn points, and climb the leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/ecoquest run dev` — run the React frontend (port 20365, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm test` — run all unit tests (Vitest, 44 tests across api-server + ecoquest)
- `pnpm run test:watch` — run tests in watch mode
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — Express session secret
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` — Clerk auth (Replit-managed)
- Required env: `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key for frontend

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter
- Auth: Clerk (Replit-managed)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `lib/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/db/src/schema/` — Drizzle schema files (users, activities, challenges, recommendations)
- `lib/api-client-react/` — auto-generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/ecoquest/src/pages/` — React page components
- `artifacts/ecoquest/src/components/` — Shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec drives Orval codegen for type-safe React Query hooks
- JIT user provisioning: users are created on first authenticated API call via `/api/users/me`
- Clerk auth proxy: frontend proxies Clerk requests through `/api/__clerk` to avoid CORS
- Static recommendations: seeded in DB at setup time (no AI integration)
- Daily challenges assigned per user: 5 random challenges assigned on first daily request

## Product

- **Landing page**: marketing page with feature highlights and Clerk sign-in/sign-up
- **Dashboard**: weekly emissions chart, category breakdown, recent activities, badges
- **Calculator**: interactive carbon footprint estimator with category sliders
- **Challenges**: daily eco-challenges with points, streaks, and completion tracking
- **Recommendations**: personalized eco tips sorted by carbon savings potential
- **Leaderboard**: global ranking by green points with streak info
- **Profile**: personal emission history, activity log, badges earned
- **Learn**: sustainability articles and learning resources
- **Onboarding**: questionnaire to capture baseline metrics on first login

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing any `lib/*` package before checking `artifacts/*`
- Seeding: `challenge_templates` (15 rows) and `recommendations` (10 rows) are pre-seeded via SQL
- `@clerk/themes` must be installed in `artifacts/ecoquest` for the Clerk appearance customization

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk proxy and auth routing patterns
