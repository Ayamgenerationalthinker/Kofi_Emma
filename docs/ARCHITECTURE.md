# Architecture

## Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Browser (PWA)                             │
│                                                                        │
│  ┌────────────┐  ┌────────────────┐  ┌──────────────────────────┐    │
│  │   Pages     │  │  Audio Engine   │  │  Offline Queue (IndexedDB) │    │
│  │  Dashboard  │  │  AudioContext   │  │  pending practice attempts │    │
│  │  Practice   │  │  lookahead      │  │  synced on reconnect,      │    │
│  │  Curriculum │  │  scheduler      │  │  idempotent by attemptId   │    │
│  │  Metronome  │  └────────────────┘  └──────────────────────────┘    │
│  │  Progress   │        │                          │                  │
│  │  Calendar   │        │ Web Audio API             │ fetch /api/*     │
│  │  Settings   │        ▼                                             │
│  └────────────┘  StickingVisualizer (rAF-synced to AudioContext time) │
│         │                                                              │
│         └──────────────────────── fetch("/api/*") ─────────────────────┘
└──────────────────────────────────┬───────────────────────────────────┘
                                    │ HTTP (Vite dev proxy in dev)
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Express API (server/)                        │
│  routes/*  →  thin handlers, Zod validation, asyncHandler             │
│      │                                                                 │
│      ▼                                                                 │
│  services/                                                            │
│    CurriculumService        canAccessExercise / canUnlockPhase /      │
│                              recomputeUnlocks / getCurriculumState     │
│    MasteryService           evaluateMastery (pure function)           │
│    BpmProgressionService    suggestNextBpm / buildBpmLadder (pure)    │
│    PerformanceAnalysisService  recordAttempt — the practice→measure→  │
│                              analyze→adjust→master→unlock loop        │
│    PracticePlannerService   generateTodayLesson (deterministic,       │
│                              persisted per calendar day)               │
│    CalendarService          hand-built RFC 5545 ICS generation        │
│    ExportImportService      Zod-validated export/import               │
│    ProgressService          streaks, BPM/accuracy history              │
│      │                                                                 │
│      ▼                                                                 │
│  Prisma Client  →  SQLite (prisma/dev.db)                             │
└──────────────────────────────────────────────────────────────────────┘
```

## Curriculum Engine

The curriculum is a directed acyclic graph: `ExercisePrerequisite` rows point from an exercise to
the exercise(s) it requires. `CurriculumService.recomputeUnlocks` walks every exercise for a user
and flips `LOCKED → AVAILABLE` once (a) the exercise's own phase is unlocked (every exercise in the
previous phase is `MASTERED`) and (b) every explicit prerequisite is `MASTERED`. This is the single
place unlocking happens — attempting to master or unlock anything else is rejected.

Locking is enforced **server-side**: `assertCanAccessExercise` is called before any write in
`PerformanceAnalysisService.recordAttempt`, so a direct API call against a locked exercise gets a
`403 EXERCISE_LOCKED` regardless of what the UI shows.

`prisma/seed.ts` defines the curriculum content as data (`ExerciseDef[]`) rather than hand-written
SQL, and derives:

- `orchestrationJson` — a limb→voice mapping (defaults to a generic snare/kick/hi-hat mapping,
  overridden per-exercise where the spec calls for a musical orchestration across the kit).
- `patternEventsJson` — a `MetronomePattern` (`{ timeSignature, subdivision, events[] }`) consumed
  directly by the client's metronome and sticking visualizer.
- The prerequisite graph — a linear chain within each phase, plus the first exercise of phase
  *N+1* requiring the last exercise of phase *N*.

`scripts/curriculum-validate.ts` imports that same data (not the database) and checks for
duplicate ids/slugs, missing prerequisite targets, circular dependencies (DFS with a
white/gray/black coloring), invalid phase references, and out-of-range BPM/accuracy values —
runnable before ever touching the database.

## Mastery & BPM Progression

`MasteryService.evaluateMastery` is a pure function: given an attempt's accuracy/BPM and the
exercise's criteria (`minimumAccuracy`, `targetBpm`, `requiredConsecutiveCleanAttempts`), it
returns whether the attempt was "clean," the new consecutive-clean streak, and whether mastery is
achieved. `BpmProgressionService.suggestNextBpm` is a second pure function mapping accuracy bands
to a tempo delta (+5 / +3 / 0 / -5 / -10), clamped to the exercise's BPM range. Both are unit
tested in isolation (`server/src/services/*.test.ts`) precisely because they are pure — no
database, no mocking required.

`PerformanceAnalysisService.recordAttempt` composes the two: it is idempotent on the client-
supplied `clientAttemptId` (a duplicate submission returns the original result rather than
double-writing), writes the attempt/progress/BPM-record update inside a single Prisma transaction,
and — only on `MASTERED` — calls `recomputeUnlocks` to cascade any newly-available exercises.

## Daily Practice Planner

`PracticePlannerService.generateTodayLesson` is deterministic: given the user's current curriculum
state (prioritizing `REPEAT` > `IN_PROGRESS` > `AVAILABLE`), it builds the four fixed-duration
parts (Technique 10min / Independence 15min / Application 20min / Speed 10min) from real
accessible exercises, and persists the result as a `DailyLesson` row keyed by `(userId, date)` —
so refreshing the page returns the same lesson rather than regenerating it. If yesterday's
`PracticeSession` exists but was never `COMPLETED`, the lesson is flagged
`wasRecoverySession: true` and Part 1's instructions are prefixed accordingly; the curriculum
state itself is never rolled back for a missed day.

## Audio Engine

`AudioEngine` wraps a single `AudioContext`, synthesizing clicks with oscillators (no shipped audio
files). `MetronomeEngine` implements the standard "lookahead scheduling" technique: a
`setInterval` every 25ms looks ahead 120ms into `AudioContext` time and schedules any due steps —
this is what keeps the click sample-accurate and jitter-free at high BPM, unlike scheduling audio
directly from `setInterval`. A parallel `requestAnimationFrame` loop drains the same scheduled-step
queue against `audioContext.currentTime` to drive the `StickingVisualizer`'s highlighted step,
keeping the visual and the audio in sync without coupling the engine itself to React.

`PatternScheduler` is the pure mapping layer between an exercise's `MetronomeEvent[]` (or, for the
standalone Metronome page, a generated plain click-track for a given time signature/subdivision)
and the engine's generic `StepDefinition[]`.

## Offline & PWA

`vite-plugin-pwa` generates the manifest and service worker: the app shell, curriculum, and static
assets are precached; `/api/curriculum*` and `/api/profile|progress|practice/today` use a
network-first strategy with a short cache TTL so stale data self-heals as soon as connectivity
returns, rather than being cached indefinitely.

Practice attempts submitted while offline are written to an IndexedDB store
(`gospel-drum-coach-offline`, via the `idb` library) keyed by the same `clientAttemptId` used for
server-side idempotency. `AppContext` listens for the browser's `online` event and flushes the
queue; a 4xx response (e.g., the exercise was locked in the meantime) drops the queued record
rather than retrying forever, while network errors stay queued for the next attempt.

## Timezone Handling

Every "what day is it" calculation goes through `server/src/lib/dates.ts`, which uses
`Intl.DateTimeFormat` with an explicit `timeZone` rather than the server's local time. The default
is `Africa/Accra`, but it is stored per-user and used consistently for the daily planner, the
missed-session check, and calendar generation — so a user in a different timezone is not silently
mishandled.
