# Gospel Drum Coach — The Kofi Emma Method

A local-first, disciplined practice coach for Ghanaian gospel drumming. It is not a generic
practice timer — it is a progressive curriculum engine that decides what you should practice
today, enforces mastery before letting you move on, and tracks your tempo and accuracy over time.

> Sticking/orchestration content is labeled honestly throughout the app: `Kofi Emma-inspired`,
> `Gospel linear vocabulary`, or `Training Pattern`. Nothing claims to be a verified transcription
> of a specific recording.

## Features

- **Sequential curriculum**: 4 phases, 40 exercises, enforced prerequisites (server-side, not just
  hidden in the UI).
- **Mastery engine**: accuracy, target BPM, and consecutive clean attempts all have to pass —
  speed is never rewarded over accuracy.
- **BPM progression**: a conservative algorithm that raises or lowers tempo recommendations based
  on your actual accuracy.
- **Daily practice planner**: a deterministic 55-minute, 4-part session generated from your real
  curriculum state (not random), persisted per day, with a recovery-session branch if you missed
  yesterday.
- **Guided practice session**: countdown → instructions → metronome + real-time sticking
  visualization → performance log → recommendation, all on one screen.
- **Web Audio metronome**: accurate lookahead scheduling (not `setInterval`), tap tempo, 4/4, 6/8,
  and 12/8 support, quarter/8th/16th/triplet subdivisions.
- **Progress analytics**: BPM and accuracy over time, streaks, minutes practiced.
- **Calendar export**: hand-built RFC 5545 `.ics` files — no external calendar API required.
- **Local browser notifications** with an honest disclaimer about what a browser tab can actually
  guarantee.
- **PWA**: installable, offline app shell, offline-queued practice logging with idempotent sync.
- **Local-first**: SQLite database, single local user profile, no cloud dependency, no analytics.

## Architecture

```
gospel-drum-coach/
  client/     React + TypeScript + Vite + Tailwind (PWA)
  server/     Node + Express + TypeScript API
  prisma/     Prisma schema, migrations, curriculum seed data
  scripts/    setup + curriculum validator
  docs/       API.md, ARCHITECTURE.md
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design and
[docs/API.md](docs/API.md) for the REST API reference.

## Prerequisites

- Node.js 18+ (developed and tested on Node 22)
- npm 10+

## Installation

```bash
npm install
```

This installs both the `client` and `server` workspaces.

## Environment Variables

Copy `.env.example` to `.env` at the repo root:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file, relative to `prisma/` |
| `PORT` | `4000` | API server port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | Environment mode |
| `DEFAULT_TIMEZONE` | `Africa/Accra` | Default timezone for a new profile |

## Database Setup

```bash
npm run db:generate   # generate the Prisma client
npm run db:migrate     # create/apply migrations (creates prisma/dev.db)
npm run curriculum:validate  # sanity-check the curriculum content
npm run db:seed        # seed 4 phases, 40 exercises, and a dev user
```

`npm run db:reset` drops and recreates the database, re-applies migrations, and re-seeds — useful
during development. `npm run db:studio` opens Prisma Studio to browse the data directly.

## One-command setup

```bash
npm run setup
```

Runs everything above in order (install → env file → generate → migrate → validate → seed) and
prints the URLs to start with.

## Development

```bash
npm run dev
```

Starts both servers concurrently:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **Health check**: http://localhost:4000/api/health → `{"status":"ok"}`

The Vite dev server proxies `/api/*` to the backend, so the client only ever talks to `/api`.

## Testing

```bash
npm run test            # server tests, then client tests
npm run test:watch      # server tests in watch mode
```

- **Server**: Vitest + Supertest against a real (migrated) SQLite test database — covers mastery
  logic, BPM progression, curriculum locking/unlocking, idempotent attempt submission, locked-
  exercise 403 enforcement, and ICS generation.
- **Client**: Vitest + React Testing Library — dashboard rendering, locked-phase display, metronome
  controls, sticking visualization, and the performance log form.

## Production Build

```bash
npm run build     # builds server (tsc) and client (tsc + vite build)
npm run start      # runs the built server from server/dist/index.js
```

The client build also generates the PWA service worker and manifest. To serve the built frontend
from the same origin as the API in a simple deployment, point a static file server at
`client/dist` and run `npm run start` for the API — the two are kept as independent build outputs
so each can also be deployed separately.

## PWA Installation

Once `npm run build` (or a hosted equivalent) is running, open the app in a Chromium-based browser
and use the browser's "Install app" prompt (or the install icon in the address bar). The dashboard,
curriculum, metronome, and shell are cached for offline use. Practice results logged while offline
are queued locally (IndexedDB) and synced automatically — with duplicate protection — once the
connection returns.

## Notifications

Browser notifications require the user to grant permission (Settings → Notifications → "Enable
browser notifications"). **Honest constraint**: a browser can only reliably deliver a scheduled
local notification while the app is open in a tab — it cannot guarantee delivery from a fully
closed browser. For a guaranteed reminder, use the calendar export instead.

## Calendar Export

Settings → Calendar, or the Calendar page, lets you download:

- `today.ics` — a single event for today's generated lesson plan.
- `practice.ics` — recurring daily morning/evening reminder events, based on your reminder
  settings.

Both are standard RFC 5545 files importable into Google Calendar, Apple Calendar, Outlook, etc.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `EADDRINUSE` on port 4000/5173 | Another process (often a previous `npm run dev`) is still bound to the port. Stop it, or change `PORT` in `.env`. |
| `npm run db:migrate` fails with "table already exists" | The database is out of sync with migration history. Run `npm run db:reset` (destructive — wipes local practice data). |
| Curriculum looks empty | Run `npm run db:seed`. |
| `curriculum:validate` fails | The failure message names the exact rule violated (duplicate id/slug, missing prerequisite, circular dependency, invalid BPM/accuracy range). Fix `prisma/seed.ts` and re-run. |
| Metronome has no sound | Browsers require a user gesture before audio can play — press Start once; also check the volume slider and OS volume. |
| Notifications never fire | Check the browser granted permission, and that the tab stays open — see the Notifications section above. |

## Project Structure

```
client/src/
  audio/        AudioEngine, MetronomeEngine, PatternScheduler (Web Audio scheduling)
  components/   Reusable UI: StickingVisualizer, MetronomeControls, forms, status states
  context/      AppContext (local user profile, online status)
  hooks/        useMetronome, useFetch, useWakeLock, useNotificationScheduler
  lib/          API client, offline queue (IndexedDB), types
  pages/        Dashboard, Practice, Curriculum, ExerciseDetail, Metronome, Progress, Calendar, Settings

server/src/
  routes/       Express route handlers (thin — delegate to services)
  services/     CurriculumService, MasteryService, BpmProgressionService,
                PerformanceAnalysisService, PracticePlannerService, CalendarService,
                ExportImportService, NotificationService, ProgressService
  domain/       Shared status enums and types
  lib/          Errors, date/timezone helpers, single-user lookup
```

## API Overview

See [docs/API.md](docs/API.md) for the full reference. Key endpoints:

- `GET /api/health`
- `GET/POST/PUT /api/profile`
- `GET /api/curriculum`, `GET /api/curriculum/state`, `GET /api/exercises/:id`
- `GET /api/practice/today`, `POST /api/practice/session`, `POST /api/practice/attempt`
- `GET /api/progress`, `GET /api/progress/bpm`, `GET /api/progress/accuracy`
- `GET /api/calendar/today.ics`, `GET /api/calendar/practice.ics`
- `GET/PUT /api/settings`
- `GET /api/export`, `POST /api/import`, `POST /api/data/reset`

## Data Privacy

Your practice data is stored locally on this device in a SQLite file
(`prisma/dev.db`). No analytics, no tracking scripts, no third-party services.
