# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskZen is a full-stack Pomodoro + AI study assistant web app. It's a monorepo with a **Next.js 14 frontend** (`frontend/`) and an **Express + Prisma backend** (`backend/`), both written in TypeScript.

## Development Commands

### Frontend (`frontend/`)
```bash
npm run dev     # Next.js dev server at http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

### Backend (`backend/`)
```bash
npm run dev        # ts-node-dev watching src/index.ts, port 4000
npm run build      # tsc to dist/
npm run start      # Run compiled dist/index.js

# Prisma (PostgreSQL)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Sync schema to DB without migrations (dev)
npm run db:migrate   # Run migrations (production)
npm run db:studio    # Prisma Studio GUI
```

## Environment Variables

**Backend** (`backend/.env`):
| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `fallback-dev-secret` | Change in production |
| `SESSION_SECRET` | `taskzen-dev-session-secret` | |
| `GOOGLE_CLIENT_ID` | — | OAuth credentials |
| `GOOGLE_CLIENT_SECRET` | — | |
| `GOOGLE_CALLBACK_URL` | — | |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |
| `NODE_ENV` | — | Affects JWT cookie `secure` flag |

**Frontend** (`frontend/.env.local`):
| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend base URL |
| `GEMINI_API_KEY` | — | Google AI Studio key for AI assistant |

## Architecture

### Backend (`backend/src/`)

- **`index.ts`** — Express app entry: CORS → JSON → session → passport middleware chain, mounts all routers
- **`routes/auth.ts`** — Email/password + Google OAuth routes; all auth responses set an httpOnly JWT cookie
- **`routes/landing.ts`** — Public stats and testimonials (no auth required)
- **`middleware/auth.ts`** — `requireAuth` (JWT required, 401 if missing) and `optionalAuth` (parses JWT if present)
- **`lib/jwt.ts`** — Token sign (1d or 30d with remember-me) and verify
- **`lib/passport.ts`** — Google OAuth strategy; links by googleId → email → creates new user
- **`lib/prisma.ts`** — PrismaClient singleton

**Authentication flow:** Signup/login → bcrypt hash/compare → JWT issued as cookie. Google OAuth → Passport callback → JWT issued → redirect to `/dashboard`. `/api/auth/me` is called on every frontend load by `AuthContext`.

### Frontend (`frontend/`)

- **`app/providers.tsx`** — Wraps the tree with `ThemeProvider` (next-themes) and `AuthProvider`
- **`context/AuthContext.tsx`** — Single source of truth for auth state; calls `/api/auth/me` on mount, exposes `authLogin`, `authSignup`, `authLogout`. Clears localStorage (`taskzen_*`, `focusai_*`, `timerSettings` keys) on logout
- **`lib/auth.ts`** — `apiFetch()` wrapper: 8s timeout, `credentials: include`; all API calls go through here
- **`app/api/ai/route.ts`** — Next.js route handler proxying to Google Gemini 2.0 Flash; converts message history to Gemini chat format; requires `GEMINI_API_KEY`
- **`app/dashboard/page.tsx`** — Tab-based SPA shell (`?tab=xyz`); keyboard shortcuts Space/R/F; reads localStorage for todos, profile, timer settings
- **`hooks/useTimer.ts`** — All Pomodoro logic: modes (focus / short-break / long-break), session counting, sound playback, break reminders

**State management:** React Context for auth; localStorage for non-critical user data (todos, profile, timer settings); no global state library.

### Database Schema (Prisma / PostgreSQL)

Key models and relations:
- **User** → has many Tasks, Notes, StudySessions, one UserProfile, one TimerSettings, one Testimonial (optional)
- **Task** — fields: title, description, category, priority, status, dueDate/dueTime
- **Note** — fields: title, content, category
- **StudySession** — records completed timer sessions (mode: `focus | short-break | long-break`, duration, subject)
- **TimerSettings** — per-user Pomodoro config (focus/break durations, auto-start, sound)
- **UserProfile** — extended profile (institution, fieldOfStudy, yearLevel, dailyGoal, etc.)

All user-owned models use `onDelete: Cascade`. User→Testimonial is `onDelete: SetNull` (testimonials survive user deletion).

### UI Patterns

- **Component library:** `components/ui/` — Radix UI primitives wrapped with Tailwind (Button, Card, Dialog, Tabs, Badge, Progress, ScrollArea, etc.)
- **Styling:** Tailwind CSS with a custom `linen` color palette (50–950 scale), dark mode via `class` strategy (next-themes)
- **Animations:** Framer Motion for page transitions, modals, and interactive elements
- **Charts:** Recharts for productivity stats
- **Icons:** Lucide React

### Path Aliases

- Frontend: `@/*` → `frontend/` root (configured in `tsconfig.json` and `next.config.mjs`)

## Key Architectural Decisions

1. **JWT in httpOnly cookies** — tokens are never accessible from JS; `credentials: include` is required on all fetch calls
2. **localStorage for todos/notes/profile** — these are client-side only; the DB stores timer sessions and settings but not todos/notes (those live in localStorage under `taskzen_todos`, `taskzen_notes`, `taskzen_profile`)
3. **No test suite** — there are no test files or test runner configured; verify changes manually or via the linter
4. **No migration history yet** — `db:push` is used for dev; run `db:migrate` before introducing schema changes in production

## Agent skills

### Issue tracker

Issues live in GitHub Issues at github.com/kheven5/TaskZen. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
