# Gospel Drum Coach — The Kofi Emma Method

A 100% client-side, local-first PWA practice coach for Ghanaian gospel drumming. **There is no
backend and no database server** — the entire app is a static bundle, and every piece of practice
data (curriculum progress, attempts, sessions, settings) lives in your browser's `localStorage`.
Install it on your phone and it runs entirely out of local storage, with no server to reach for
anything.

> Sticking/orchestration content is labeled honestly throughout the app: `Kofi Emma-inspired`,
> `Gospel linear vocabulary`, or `Training Pattern`. Nothing claims to be a verified transcription
> of a specific recording.

## Features

- **Sequential curriculum**: 4 phases, 40 exercises, enforced prerequisites.
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
- **Calendar export**: hand-built RFC 5545 `.ics` files, generated and downloaded entirely in the
  browser — no external calendar API required.
- **Local browser notifications** with an honest disclaimer about what a browser tab can actually
  guarantee.
- **PWA**: installable on your phone's home screen, works fully offline, no network ever required
  after the first load.
- **100% local-first**: `localStorage`-backed, single local user profile, zero cloud dependency,
  zero analytics, zero external services.

## Architecture

```
gospel-drum-coach/
  src/
    data/curriculum.ts   Static curriculum content — 4 phases, 40 exercises (bundled, read-only)
    lib/localDb.ts        The entire persistence layer — a tiny JSON "database" over localStorage
    services/             Curriculum locking, mastery, BPM progression, daily planner, calendar,
                           progress analytics, export/import — all synchronous, all local
    audio/                Web Audio metronome engine
    components/ pages/     React UI
  scripts/                 setup + curriculum validator
  docs/                    ARCHITECTURE.md, DATA_MODEL.md
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design and
[docs/DATA_MODEL.md](docs/DATA_MODEL.md) for the `localStorage` schema and service reference.

## Prerequisites

- Node.js 18+ (developed and tested on Node 22) — **only needed to build the app**, not to run it.
- npm 10+

## Installation

```bash
npm install
```

## One-command setup

```bash
npm run setup
```

Installs dependencies and validates the bundled curriculum content. There is no database to
configure and no environment variables to set — the app has none.

## Development

```bash
npm run dev
```

Opens at **http://localhost:5173**. That's the whole stack — one Vite dev server, no backend
process to run alongside it.

## Testing

```bash
npm run test          # run once
npm run test:watch    # watch mode
```

Vitest + React Testing Library, run against the real bundled curriculum (no fixtures needed —
`src/data/curriculum.ts` is imported directly). Covers: mastery logic, BPM progression, curriculum
locking/unlocking against the full 40-exercise graph, idempotent attempt submission, ICS
generation, dashboard rendering, locked-phase display, metronome controls, sticking visualization,
and the performance log form.

## Production Build

```bash
npm run build      # tsc + vite build -> dist/
npm run preview     # serve the production build locally to sanity-check it
```

`dist/` is a plain static site: HTML, CSS, JS, and the PWA manifest/service worker. There is no
server-side build output — deploy `dist/` as-is.

## Hosting (free static hosts)

Any static host works. A few common ones:

**Netlify / Vercel / Cloudflare Pages** — connect the repo, set:
- Build command: `npm run build`
- Output directory: `dist`

**GitHub Pages** — build locally (or via a GitHub Action) and publish the `dist/` folder to the
`gh-pages` branch, or use `actions/deploy-pages` with the same build command/output above. If
hosting under a subpath (`username.github.io/repo-name`), set Vite's `base` option in
`vite.config.ts` to `/repo-name/` before building.

No environment variables, no database provisioning, no backend process — the deploy is just
"upload these static files."

## Installing on your phone

Open the deployed URL in Chrome (Android) or Safari (iOS) and use "Add to Home Screen" / the
browser's install prompt. Once installed:

- The app works **fully offline** — nothing it does ever requires a network request.
- All your practice data lives in that browser's `localStorage` on your phone. It does not sync to
  any server or other device.
- **Back up your data**: Settings → Data → Export downloads a JSON file. Do this periodically, and
  especially before clearing your browser's site data or switching phones — there is no cloud
  copy.

## Notifications

Browser notifications require the user to grant permission (Settings → Notifications → "Enable
browser notifications"). **Honest constraint**: a browser can only reliably deliver a scheduled
local notification while the app is open in a tab — it cannot guarantee delivery from a fully
closed browser, and this app has no server to send a push notification instead. For a guaranteed
reminder, use the calendar export.

## Calendar Export

The Calendar page generates and downloads, entirely client-side:

- `today.ics` — a single event for today's generated lesson plan.
- `practice.ics` — recurring daily morning/evening reminder events, based on your reminder
  settings.

Both are standard RFC 5545 files importable into Google Calendar, Apple Calendar, Outlook, etc.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Progress disappeared | You (or your browser) cleared site data for this origin, or you're in a new private/incognito window. `localStorage` is per-browser-profile, per-origin — there is no server copy to restore from unless you'd previously exported a backup (Settings → Data → Export). |
| "Storage blocked" banner | Your browser is blocking persistent storage (common in private/incognito mode, or with strict tracking-protection settings). The app still works for the session but won't save after the tab closes. |
| Curriculum looks locked past what you expect | That's the intended design — see the Curriculum page for exactly which prerequisites remain. |
| `curriculum:validate` fails | The failure message names the exact rule violated (duplicate id/slug, missing prerequisite, circular dependency, invalid BPM/accuracy range). Fix `src/data/curriculum.ts` and re-run. |
| Metronome has no sound | Browsers require a user gesture before audio can play — press Start once; also check the volume slider and OS volume. |
| Notifications never fire | Check the browser granted permission, and that the tab stays open — see the Notifications section above. |
| Data doesn't show up on another device | Expected — there is no server, so nothing syncs across devices. Export on one device, import on the other. |

## Project Structure

```
src/
  audio/        AudioEngine, MetronomeEngine, PatternScheduler (Web Audio scheduling)
  components/   Reusable UI: StickingVisualizer, MetronomeControls, forms
  context/      AppContext (local user profile, reactive over localStorage)
  data/         curriculum.ts — the static 4-phase, 40-exercise content
  hooks/        useMetronome, useLocalDb, useWakeLock, useNotificationScheduler
  lib/          localDb (the persistence layer), dates, errors, notifications, shared types
  pages/        Dashboard, Practice, Curriculum, ExerciseDetail, Metronome, Progress, Calendar, Settings
  services/     curriculumService, masteryService, bpmProgressionService,
                performanceAnalysisService, practicePlannerService, progressService,
                calendarService, profileService, settingsService, exportImportService, dataService
```

## Data Privacy

Your practice data is stored locally on this device, in your browser's `localStorage`. Nothing is
ever sent to a server — there isn't one. No analytics, no tracking scripts, no third-party
services of any kind.
