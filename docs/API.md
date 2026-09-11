# API Reference

Base URL in development: `http://localhost:4000/api` (the Vite dev server proxies `/api/*` here
automatically, so the client just calls `/api/...`).

All error responses share one shape:

```json
{ "error": { "code": "EXERCISE_LOCKED", "message": "...", "details": {} } }
```

`details` is only present for validation errors (Zod's `flatten()` output).

---

## Health

### `GET /api/health`
→ `200 { "status": "ok" }`

---

## Profile

### `GET /api/profile`
- `200 { "user": User }`
- `404 { error: { code: "NO_USER" } }` — expected first-run state, not a failure.

### `POST /api/profile`
First-run onboarding. Creates the single local user and their settings rows.

Body:
```json
{
  "name": "Kwame",
  "experienceLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "timezone": "Africa/Accra",
  "morningOn": true,
  "eveningOn": true,
  "morningTime": "07:00",
  "eveningTime": "19:00"
}
```
- `201 { "user": User }`
- `409 CONFLICT` if a profile already exists.

### `PUT /api/profile`
Body (all optional): `{ "name", "experienceLevel", "timezone" }` → `200 { "user": User }`

---

## Curriculum

### `GET /api/curriculum`
Every phase. Locked phases include `lockedMessage` and an empty `exercises` array — exercise
content is never sent for a locked phase.

### `GET /api/curriculum/state`
```json
{
  "currentPhaseNumber": 1,
  "currentExerciseId": "P1-E02",
  "phases": [{ "id", "number", "title", "subtitle", "status": "CURRENT|LOCKED|COMPLETE", "progress", "totalExercises", "masteredExercises" }],
  "overallProgress": 12
}
```

### `GET /api/curriculum/phases/:phaseId`
Same shape as one entry of `GET /api/curriculum`.

### `GET /api/exercises/:exerciseId`
Full exercise detail (sticking, orchestration, pattern events, technique notes, mastery criteria,
the user's own progress on it). If locked: `{ "locked": true, "prerequisites": [...] }` only —
no sticking/orchestration/BPM content is exposed for a locked exercise.

---

## Practice

### `GET /api/practice/today`
Returns (and persists, if not already generated today) the deterministic 4-part daily lesson.

### `POST /api/practice/session`
Starts (or resumes) today's `PracticeSession`. → `200 { "session": PracticeSession }`

### `PATCH /api/practice/session/:id/complete`
Body (optional): `{ "totalMinutes": 55 }` → `200 { "session": PracticeSession }`

### `GET /api/practice/history?limit=50`
→ `200 { "sessions": PracticeSession[] }` (each including its `attempts`)

### `POST /api/practice/attempt`
The core "record a practice result" endpoint. **Idempotent** on `clientAttemptId` — replaying the
same id returns the original result rather than writing twice. **Rejects a locked exercise with
403** before writing anything.

Body:
```json
{
  "clientAttemptId": "uuid-generated-by-client",
  "exerciseId": "P1-E01",
  "sessionId": "optional-session-id",
  "cleanBpm": 100,
  "maximumBpm": 105,
  "accuracy": 94,
  "durationMinutes": 10,
  "perceivedDifficulty": 3,
  "notes": "optional"
}
```
- `201`:
```json
{
  "attemptId": "...",
  "result": "FAILED|REPEAT|PASSED|MASTERED",
  "recommendation": "human-readable coaching text",
  "newProgressStatus": "REPEAT|IN_PROGRESS|MASTERED",
  "consecutiveCleanCount": 1,
  "requiredConsecutiveCleanAttempts": 2,
  "suggestedNextBpm": 103,
  "exerciseMastered": false,
  "wasDuplicate": false
}
```
- `403 EXERCISE_LOCKED` if the exercise isn't accessible yet.
- `422 VALIDATION_ERROR` if `cleanBpm > maximumBpm`, accuracy outside 0-100, etc.

---

## Progress

### `GET /api/progress`
```json
{
  "masteredExercises": 3, "lockedExercises": 30, "totalExercises": 40,
  "totalMinutesPracticed": 165, "totalSessionsCompleted": 3,
  "bestBpm": 110, "averageAccuracy": 91,
  "streak": { "currentStreak": 3, "longestStreak": 5, "thisWeekSessions": 3 },
  "hasAnyData": true
}
```

### `GET /api/progress/bpm?range=7|30|90|all`
→ `200 { "history": [{ "date", "cleanBpm", "accuracy", "exerciseName" }] }`

### `GET /api/progress/accuracy?range=7|30|90|all`
→ `200 { "history": [{ "date", "accuracy", "cleanBpm", "result", "exerciseName" }] }`

---

## Calendar

### `GET /api/calendar/today.ics`
A single `.ics` VEVENT for today's generated lesson (07:00 local, `Content-Type: text/calendar`).

### `GET /api/calendar/practice.ics`
Recurring daily VEVENTs (RRULE FREQ=DAILY) for the enabled morning/evening reminder times.

---

## Settings

### `GET /api/settings`
→ `200 { "user", "settings", "reminderSettings", "calendarSettings" }`

### `PUT /api/settings`
Body: `{ "settings": {...partial}, "reminderSettings": {...partial} }` → `200 { "settings", "reminderSettings" }`

---

## Data

### `GET /api/export`
Downloads a full JSON dump: user, progress, sessions, attempts, BPM records, settings.

### `POST /api/import`
Body: the JSON from `GET /api/export` (or a hand-built equivalent matching the same schema — Zod-
validated, never trusted blindly). Upserts progress by `(userId, exerciseId)` and skips any
attempt whose `clientAttemptId` already exists.

### `POST /api/data/reset`
Body: `{ "confirm": "RESET" }` (required — anything else returns `400 CONFIRMATION_REQUIRED`).
Deletes attempts/BPM records/sessions/daily lessons and resets all progress to `LOCKED`, then
re-unlocks whatever has no prerequisites (Phase 1's first exercise).
