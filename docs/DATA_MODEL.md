# Data Model

There is no database and no API. Everything the app persists lives in a
single browser `localStorage` key: `gospel-drum-coach:db:v1`, holding one
JSON document shaped like `LocalDbShape` (`src/lib/localDb.ts`):

```ts
interface LocalDbShape {
  schemaVersion: number;
  user: UserRecord | null;
  progress: Record<string /* exerciseId */, ProgressRecord>;
  attempts: AttemptRecord[];
  sessions: SessionRecord[];
  dailyLessons: Record<string /* YYYY-MM-DD */, DailyLessonRecord>;
  bpmRecords: BpmRecordEntry[];
  settings: UserSettingsRecord;
  reminderSettings: ReminderSettingsRecord;
}
```

The curriculum itself (4 phases, 40 exercises, sticking patterns,
orchestration, mastery criteria) is **not** stored here — it's static data
bundled into the app at build time (`src/data/curriculum.ts`). Only
per-user state (what's been mastered, what was attempted, when) lives in
`localStorage`.

## Reading and writing

- `getDb()` returns the current in-memory store (synchronously — no
  fetch, no loading state).
- `mutate(fn)` runs `fn` against the store, persists the result to
  `localStorage`, and notifies every subscribed component.
- Components subscribe with the `useLocalDbVersion()` hook
  (`src/hooks/useLocalDb.ts`), then call the plain service functions
  (`getCurriculumState()`, `getProgressSummary()`, etc.) directly in their
  render body to read fresh data. There is deliberately no selector-based
  API here — the store mutates nested objects in place for simplicity, so
  reference-equality bail-outs would be unreliable; recomputing on every
  render is cheap at this app's scale (a few hundred records at most for a
  personal practice log).

## Services

All business logic lives in `src/services/*.ts`, unchanged in spirit from
what would sit behind a REST API — they just read and write the local
store synchronously instead of doing so over HTTP:

| Service | Responsibility |
| --- | --- |
| `curriculumService` | Locking/unlocking, mastery status, curriculum state |
| `masteryService` | Pure: accuracy + BPM + consecutive-clean-attempts evaluation |
| `bpmProgressionService` | Pure: tempo recommendation and BPM ladder |
| `performanceAnalysisService` | `recordAttempt()` — the practice → measure → analyze → adjust loop |
| `practicePlannerService` | Deterministic daily lesson generation, session start/complete |
| `progressService` | Streaks, BPM/accuracy history |
| `calendarService` | RFC 5545 `.ics` generation + browser download |
| `profileService` | Local user profile create/update |
| `settingsService` | Practice defaults and reminder settings |
| `exportImportService` | JSON export/import of the whole store, Zod-validated |
| `dataService` | Destructive progress reset |

## Multi-device / backup

Because everything lives in one browser's `localStorage`, progress does
**not** sync across devices and is lost if the browser's site data is
cleared. Settings → Data → **Export data** downloads the full store as
JSON; **Import data** merges a previously exported file back in
(idempotent — re-importing the same file twice never duplicates attempts,
matched by their `clientAttemptId`).
