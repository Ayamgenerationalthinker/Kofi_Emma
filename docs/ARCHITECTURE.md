# Architecture

## Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Browser (installable PWA)                         │
│                                                                          │
│  ┌─────────────┐   ┌────────────────┐   ┌──────────────────────────┐  │
│  │   Pages      │   │  Audio Engine   │   │  src/data/curriculum.ts  │  │
│  │  Dashboard   │   │  AudioContext   │   │  4 phases, 40 exercises  │  │
│  │  Practice    │   │  lookahead      │   │  bundled at build time,  │  │
│  │  Curriculum  │   │  scheduler      │   │  read-only at runtime    │  │
│  │  Metronome   │   └────────────────┘   └──────────────────────────┘  │
│  │  Progress    │         │                          │                 │
│  │  Calendar    │         │ Web Audio API             │                 │
│  │  Settings    │         ▼                                            │
│  └─────────────┘  StickingVisualizer (rAF-synced to AudioContext time) │
│         │                                                               │
│         ▼                                                               │
│  src/services/*.ts  (curriculum locking, mastery, BPM progression,     │
│                       daily planner, calendar ICS, export/import)      │
│         │                                                               │
│         ▼                                                               │
│  src/lib/localDb.ts  — a tiny embedded JSON "database"                 │
│         │                                                               │
│         ▼                                                               │
│  window.localStorage  (single key: gospel-drum-coach:db:v1)            │
└────────────────────────────────────────────────────────────────────────┘
```

**There is no server.** This is a static single-page app: `npm run build`
produces plain HTML/CSS/JS that any static host (Netlify, Vercel, GitHub
Pages, Cloudflare Pages, or literally a phone's local file storage via the
installed PWA) can serve. Every piece of state that used to require a
backend — curriculum locking, mastery evaluation, BPM progression, the
daily planner, calendar generation — runs entirely in the browser.

## Curriculum content vs. user data

Two very different kinds of data live in this app, and they're kept
strictly separate:

1. **Curriculum content** (`src/data/curriculum.ts`) — the 4 phases, 40
   exercises, sticking patterns, orchestration, and mastery criteria. This
   is static, bundled at build time, identical for every user, and never
   changes at runtime. Think of it as "code," not "data."
2. **User data** (`src/lib/localDb.ts`, persisted to `localStorage`) —
   profile, per-exercise progress, practice attempts, sessions, daily
   lessons, BPM history, and settings. This is the only thing that differs
   between installs and the only thing that's ever written.

See [DATA_MODEL.md](DATA_MODEL.md) for the full `localStorage` schema.

## Curriculum Engine

The curriculum is a directed acyclic graph: each `CurriculumExercise` in
`src/data/curriculum.ts` carries a `prerequisiteIds` array (computed once,
at module load, from a linear per-phase chain plus a cross-phase link from
each phase's first exercise to the previous phase's last). `recomputeUnlocks()`
in `curriculumService.ts` walks every exercise and flips
`LOCKED → AVAILABLE` once (a) the exercise's own phase is unlocked (every
exercise in the previous phase is `MASTERED`) and (b) every explicit
prerequisite is `MASTERED`.

Because everything runs in the same trust boundary as the UI (there's no
network hop to bypass), "server-side enforcement" doesn't apply the same
way it would with a backend — but the discipline is kept anyway:
`assertCanAccessExercise()` is still the single gate every mutation goes
through in `performanceAnalysisService.recordAttempt()`, so a bug in one
screen's rendering logic can never let progress skip ahead; only that one
function can ever flip a lock.

`scripts/curriculum-validate.ts` imports `src/data/curriculum.ts` directly
(via `tsx`, no browser needed) and checks for duplicate ids/slugs, missing
prerequisite targets, circular dependencies (DFS with white/gray/black
coloring), invalid phase references, and out-of-range BPM/accuracy values.

## Mastery & BPM Progression

`masteryService.evaluateMastery` and `bpmProgressionService.suggestNextBpm`
are pure functions — no store access at all — which is exactly what makes
them trivial to unit test and safe to reuse unchanged regardless of where
the data ends up living. `performanceAnalysisService.recordAttempt()`
composes them: it's idempotent on the caller-supplied `clientAttemptId` (a
duplicate submission returns the original result rather than double-
writing), and only on `MASTERED` does it call `recomputeUnlocks()` to
cascade any newly-available exercises.

## Daily Practice Planner

`practicePlannerService` splits the "ensure it exists" and "read it" concerns
deliberately:

- `generateTodayLesson(timezone)` **mutates** — it builds and persists
  today's `DailyLessonRecord` the first time it's called for a given day,
  and is safe to call repeatedly (idempotent per calendar day). It's only
  ever called from a `useEffect`, never during render.
- `readTodayLesson(timezone)` is a **pure read** — safe to call directly in
  a component's render body every time the store's version counter changes.

This split exists because of how the reactive store works (see below): a
render-phase function must never mutate the store it's reading from.

## The Reactive Store

`src/lib/localDb.ts` is a minimal embedded JSON database: a module-level
`cache` object, mutated in place by `mutate(fn)`, persisted to
`localStorage` on every write, and paired with a monotonically incrementing
`version` counter. `useLocalDbVersion()` (`src/hooks/useLocalDb.ts`)
subscribes a component to that counter via React's `useSyncExternalStore` —
deliberately *not* a selector-based API, since the store mutates nested
objects in place rather than rebuilding the object graph on every write, so
reference-equality bail-outs on a selector's return value would be
unreliable. Instead, any component that calls `useLocalDbVersion()`
re-renders on every store change and just recomputes derived data fresh
(via the plain service functions) in its render body — cheap enough at this
app's scale (a personal practice log, at most a few hundred records) to
not need memoization.

## Audio Engine

Unchanged by the removal of the backend — it never talked to one.
`AudioEngine` wraps a single `AudioContext`, synthesizing clicks with
oscillators (no shipped audio files). `MetronomeEngine` implements
lookahead scheduling: a `setInterval` every 25ms looks ahead 120ms into
`AudioContext` time and schedules any due steps, which is what keeps the
click sample-accurate at high BPM. A parallel `requestAnimationFrame` loop
drains the same scheduled-step queue to drive the `StickingVisualizer`'s
highlighted step in sync with the audio, without coupling the engine to
React.

## PWA & Offline

Since the app never talks to a network in the first place, "offline
support" here is simpler than the usual PWA problem: `vite-plugin-pwa`
precaches the built app shell (HTML/CSS/JS, which includes the entire
curriculum) with a cache-first strategy, and there is no API traffic to
reason about caching for. Once installed, the app works fully offline
indefinitely — practice data was always local, never fetched.

## Timezone Handling

Every "what day is it" calculation goes through `src/lib/dates.ts`, which
uses `Intl.DateTimeFormat` with an explicit `timeZone` rather than
`Date`'s implicit local time. The timezone is auto-detected at onboarding
(`Intl.DateTimeFormat().resolvedOptions().timeZone`) and stored on the user
profile, so it's used consistently for the daily planner, the
missed-session check, and calendar generation.
