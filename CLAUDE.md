# CLAUDE.md

Guidance for Claude Code (or any future contributor) working in this repository.

## What this is

**Kofi Emma (Abele Drums Coach)** — a 100% client-side, local-first PWA drum practice coach for
Ghanaian gospel drumming. No backend, no database server, no environment variables. Everything
persists to the browser's `localStorage`. See `README.md` for setup/run commands and
`docs/ARCHITECTURE.md` / `docs/DATA_MODEL.md` for the system design.

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

## Commands

```
npm install
npm run dev      # http://localhost:5173
npm run build
npm run test
npm run lint
npm run curriculum:validate
```
