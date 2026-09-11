# CLAUDE.md

Guidance for Claude Code (or any future contributor) working in this repository.

## What this is

**Abele Drums Coach** — a client-side-first PWA drum practice coach for Ghanaian
gospel drumming. No custom backend server, ever — the app is a Vite + React PWA. Persistence is
LocalStorage by default (fully offline-capable, zero configuration), with an **optional** managed
Backend-as-a-Service layer (Supabase: Auth + Postgres) for user accounts and cross-device sync —
see "Cloud sync architecture" below. See `README.md` for setup/run commands and
`docs/ARCHITECTURE.md` / `docs/DATA_MODEL.md` for the system design.

## Cloud sync architecture (Supabase, optional) — permanent requirement

This is a **permanent architecture decision, not a one-off feature**: if you add more
account-related data to this app in the future, it goes through this same pattern. Do not
introduce a custom Express/Node backend, a custom auth server, or custom password storage — ever.
Full setup instructions: `docs/SUPABASE_SETUP.md`. Schema: `supabase/schema.sql`.

- **The app must always work fully in guest mode with zero Supabase configuration.** Every
  Supabase-touching function (`src/services/authService.ts`, `src/services/syncService.ts`)
  checks `isSupabaseConfigured` (`src/lib/supabase/client.ts`) and degrades to either a no-op or a
  clear `AppError("CLOUD_SYNC_UNAVAILABLE", ...)` — never a crash — when it's false. As of the
  session this was built in, **no Supabase project exists and no env vars are set anywhere** — do
  not claim cloud sync is "configured" without verifying `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` are actually present.
- **The UI never calls the Supabase client directly.** It goes through `authService.ts` (sign
  up/in/out, password reset, session state) or `syncService.ts` (push/pull/merge). Keep it that
  way — it's what makes the guest-mode fallback and the merge rules enforceable in one place.
- **Hybrid data split**: LocalStorage keeps everything it already kept (temporary/offline state,
  metronome/UI preferences, cached content, the in-progress session, offline video state).
  Supabase mirrors the account-durable subset — `profiles`, `exercise_progress`,
  `practice_sessions` (append-only, one row per attempt), `video_progress`, `user_achievements` —
  see `src/lib/storage/types.ts` for the LocalStorage shapes these map to 1:1.
- **Row Level Security is mandatory on every table** (`auth.uid() = user_id`), and only the public
  anon key is ever shipped to the client — never a service-role key, never a custom token table.
- **Guest-to-account migration has no separate code path.** `syncService.syncNow()` pulls cloud
  state, merges it with LocalStorage via the documented rules in
  `src/services/syncMergeRules.ts` (completed exercises never un-complete; clean/best-accuracy/
  attempts take the max of both sides; attempts are append-only and de-duplicated by
  `clientAttemptId`; video `watched` is OR'd/sticky; `favorite`/notes follow the latest
  `updatedAt`), writes the merge back to both sides, and is called on every sign-in — including a
  guest's very first sign-up, which is exactly what "migration" means here.
- **Sync-on-sign-in is centralized in `AuthContext.tsx`**, not scattered per auth method. It calls
  `syncService.syncNow()` once per session (guarded by a `syncedUserIdRef`, reset on `SIGNED_OUT`)
  whenever `onAuthStateChange` fires `SIGNED_IN`, and also once on initial mount if a session is
  already restored. This is what makes Google OAuth's redirect-return flow sync correctly — it has
  no interactive form to call `syncNow()` from directly, unlike the email sign-up/sign-in path in
  `AccountSheet.tsx`, which still calls it explicitly too (for immediate "Syncing..." UI feedback;
  the duplicate call this can cause is harmless since merges are idempotent).
- **Google OAuth is wired into the UI** (`AccountSheet.tsx` "Continue with Google" button, calling
  `authService.signInWithGoogle()`), but only functions once the Supabase project has the Google
  provider enabled — see `docs/SUPABASE_SETUP.md` step 3. Until then the button will error, which
  is expected and not a bug.
- **Supabase project**: as of the 2026-09-11 platform-upgrade session, the project URL
  `https://wqwfyqgrhyrjdjzigiop.supabase.co` was provided, but no working anon/publishable key
  was supplied in that message, so `.env.local` has NOT been created and `isSupabaseConfigured` is
  still `false` in this checkout. Do not assume this project is wired up without checking for
  `.env.local` and verifying `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` yourself.

## Visual identity & assets

The product identity is **Abele Drums Coach**, standalone — "Abele" is a nickname tied to the real
drummer Kofi Emma, but the app is not named after him (see the video-provenance section below for
where Kofi Emma content legitimately still belongs).

- **Palette** — the exact named colors from the 2026-09-11 visual-direction spec live in
  `tailwind.config.js` under the existing `charcoal`/`gold`/`parchment` scale (kept as-is rather
  than renamed, since ~28 files already reference those keys) plus three new standalone tokens:
  `sand` (#A9A398, muted sand), `success` (#6FAF7B, muted green), `danger` (#C96B63, muted red).
  Mapping: `charcoal-950`=Obsidian #0B0D0F, `charcoal-900`=Charcoal #14171A, `charcoal-800`=Dark
  Slate #1B1F23, `gold-500`=Abele Gold #D9A441, `gold-400`=Amber Highlight #F2C45C,
  `parchment`=Warm Ivory #F5F1E8. `charcoal-700`/`charcoal-600` and `gold-600` are utility shades
  not named in the spec, kept as reasonable intermediate steps. `success`/`danger` are not yet used
  anywhere in the UI — they exist so future skill/progress work doesn't invent ad-hoc greens/reds.
- **App icon** — `public/icons/icon.svg` and `public/favicon.svg` (identical file): a 512×512
  square icon, crossed drumsticks over a drumhead, supplied directly by the user (not generated).
  Referenced from `vite.config.ts`'s PWA manifest and `index.html`.
- **Wordmark lockup** — `public/brand/wordmark-lockup.svg`: a horizontal icon + "ABELE / DRUMS
  COACH" wordmark, also user-supplied. Copied into the project but **not yet wired into any UI** —
  it's available for a future header/splash/marketing surface, not forced in everywhere per the
  spec's "do not blindly use both everywhere" instruction.

## Data provenance — Kofi Emma video library

`src/data/kofiEmmaVideos.ts` contains the Shed Session video library. Its content has two
distinct provenance batches; read the file's own header comment before adding more videos.

- **`Cd25CPj4Ii4`** — supplied directly in this project's original build spec, title given
  verbatim in that spec text.
- **The 11 IDs below** — supplied by the user on 2026-09-11 as `youtu.be` URLs (one URL,
  `KjCoXS_jSEc`, was supplied twice in the user's list and was added only once). Their YouTube
  ids were extracted directly from the user-supplied URLs — not invented or guessed. Their
  titles were retrieved by fetching each video's live YouTube page during that session (a real
  network fetch via WebFetch, not a guess), and every one of the 11 titles independently
  contains "Kofi Emma" or "KofiEmmaDrummer" in its own text, corroborating the user's claim that
  these are from the same channel. YouTube's fetched page did not expose a separately-labeled
  channel/uploader field, so this is **not** a claim of official API-level channel verification
  — see each entry's `titleSource: "fetched"` field for that honesty trail.

  ```
  Rt_wN-mKM_0   _spxwVq1AJ0   oC1GF0NH0mo   sE7YY710hHg   DnyHzTzXLX8
  RmT5TXTnuEA   EFCX6hNj7UQ   peiA9nYmCYg   TwGpS2dc3Is   JRF-CasFL8Y
  KjCoXS_jSEc
  ```

Total library size as of this update: **12 unique videos**. To add more, append a new
`KofiEmmaVideo` object to `KOFI_EMMA_VIDEOS` in that file — no other UI changes are required
(`VideoCard`/`VideoEmbed`/the Shed page all read from that array), and add the new id(s) to the
`titleSource` / provenance discipline above so future readers can tell fetched-but-unconfirmed
titles apart from spec-provided ones.

## Persistence discipline

Per-user state (watched/favorite/notes for a video, curriculum progress, practice history,
settings) lives in `src/lib/storage/` (LocalStorage), never in the static `src/data/*` files.
The static data files are bundled at build time and are identical for every install — do not add
per-user fields to them.

## Curriculum naming

The curriculum is internally still modeled as 4 "phases" (`src/data/curriculum.ts`,
`CurriculumPhase.id` values `phase-1`..`phase-4`) but is displayed throughout the UI as **Level
0–3** (`CurriculumPhase.number` is 0-indexed). This is a deliberate pragmatic choice — the
underlying phase content and ids were carried forward from this project's earlier 4-phase
structure rather than renamed at the code level, to avoid a large mechanical refactor with no
user-visible benefit. Do not assume `phase.number === 1` means "the first phase" anywhere in
`curriculumService.ts` — the first level is `number === 0`.

## Deferred from the 2026-09-11 platform-upgrade spec

A 62-section spec ("full product architecture, UX, Supabase, practice engine, learning engine,
calendar, notifications, loops & stems") was applied partially, by explicit user agreement, not
exhaustively — attempting all of it in one pass was rejected as an "uncontrolled rewrite" per the
spec's own Section 58. Implemented this pass: brand/palette/icon assets (see "Visual identity &
assets" above), Google OAuth UI + centralized sync-on-sign-in (see "Cloud sync architecture"
above). **Explicitly deferred, with a scope decision already made for each so it isn't re-litigated
accidentally:**

- **Shed Tracks / loop player / stem mixer** (spec sections 26-29) — not built at all yet. When
  built, it must be a **user-upload model**: users upload their own loop/stem audio files (there is
  no curated or licensed audio library, and none should be fabricated or invented). This changes
  the architecture from "static bundled track library" to "per-user uploaded content," which likely
  needs Supabase Storage (not just Postgres rows) plus a new `track_progress`-style table keyed to
  user-uploaded file references — none of this exists yet.
- **Adaptive learning / skill-progress engine** (spec sections 13, 21-23, 43's skill bars,
  `skill_progress`/`user_achievements` tables) — not built. There is currently zero local tracking
  of skills (timing/independence/groove/etc.) or achievements anywhere in the app (`user_achievements`
  exists as an unused table in `supabase/schema.sql` from an earlier session). Building this requires
  a real scoring engine mapping exercises/attempts to skill categories and achievement-unlock rules
  — genuine new product logic, not plumbing, so it wasn't improvised here.
- **`practice_schedule` table / calendar-notification polish** (spec sections 16-18) — the existing
  `calendarService.ts` (ICS export) and `notifications.ts` (browser Notification API) already cover
  the core of this from an earlier session; the spec's richer scheduling UX (day-of-week picker,
  contextual per-level reminder copy, "Add to Calendar" as a first-class flow) was not built this
  pass.
- **Infinite theory/learning content generation** (spec sections 19-20, 47-50) — not built; the
  existing static `src/data/curriculum.ts` and `src/data/handbook/` remain the only content source.
  Any future AI-assisted generation must follow the spec's validation discipline (structured
  concept → prerequisite → exercise chain, reject anything unverified) rather than freeform output.
- **Performance/accessibility audit passes** (spec sections 36-39) — not done this pass beyond what
  already existed (lazy YouTube embeds already implemented for the Shed video library).

If asked to continue this platform-upgrade work, start with whichever of the above the user names
next rather than assuming priority order from the original spec.

## UX spec scope note

A large ("master UX implementation") spec was applied partially, not exhaustively. Implemented:
the 5-screen onboarding wizard (`Onboarding.tsx`), Home as a "practice launchpad" (greeting +
TODAY'S SHED hero + TODAY'S FOCUS + secondary stats, `Dashboard.tsx`), the exit-confirmation sheet
and "Shed Complete / Your Win" completion framing (`Practice.tsx`), and the low-pressure "keep your
progress safe" account prompt (never forced at onboarding). **Not** implemented: the dedicated
pause action sheet (RESUME/RESTART/CHANGE BPM/END SHED — Practice.tsx only has exit, not pause),
adaptive/shrinking session length for short-time users, a "Playground/Free Play" mode, and a
skill-radar (Timing/Independence/Groove/Speed/Chops) progress view. If asked to continue this UX
work, start with those four gaps.

## Commands

```
npm install
npm run dev      # http://localhost:5173
npm run build
npm run test
npm run lint
npm run curriculum:validate
```
