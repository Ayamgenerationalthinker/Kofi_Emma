# Shed Tracks — Asset & Production Guide

This document is the source of truth for how Shed Tracks content is modeled, what a real
production track needs before it can ship, and how to add one. It exists because
`src/data/shedTracks.ts` and `src/audio/demoTrackSource.ts` both point here by name — read this
before touching either file.

## 1. Purpose of Shed Tracks

Shed Tracks are full-band backing tracks a drummer practices along with, in a genre and BPM they
choose, with the ability to loop a specific section and (where stems exist) mute the drums and
play the part themselves. The product framing is **"remove the drums and become the drummer,"**
not a music player — see `docs/SHED_TRACKS_ASSETS.md` §7 and the Loop Player / Stem Mixer
implementation for how that plays out in the UI.

This is distinct from the Shed *Session* video library (`src/data/kofiEmmaVideos.ts`,
`src/pages/Shed.tsx`), which is real, already-licensed-for-embedding YouTube content. Shed Tracks
is a separate, not-yet-populated content system for backing-track audio.

## 2. Supported genres

Defined as `TrackGenre` in `src/data/shedTracks.ts`. Exactly these eight, no others without a
deliberate type change:

- Gospel
- Praise
- Worship
- Highlife
- Reggae
- Afrobeat
- Afro-Gospel
- Contemporary

## 3. Track metadata model

Every track is a `ShedTrack` (`src/data/shedTracks.ts`):

```ts
interface ShedTrack {
  id: string;                                    // stable, kebab-case, never reused
  title: string;
  genre: TrackGenre;
  bpm: number;                                    // the track's native, recorded tempo
  key: string | null;                             // e.g. "Bb major"; null if not yet known
  durationSeconds: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  source: string;                                 // provenance — see §9
  sections: TrackSection[];                       // Intro/Verse/Chorus/Bridge/Outro with start/end seconds
  loopableRegionNames: TrackSection["name"][];     // which of `sections` are offered as loop targets
  audioUrl: string | null;                        // null = no production file yet, see §4
  stems: Partial<Record<StemName, string>> | null; // null = no stem files yet, see §5
  isArchitectureDemo?: boolean;                    // true only for the one synthetic dev fixture, see §11
}
```

`getTrack(id)` and `SHED_TRACKS` (the full list) are the only read APIs; UI code never reaches into
a track object shaped differently than this.

## 4. Audio file requirements

When a real `audioUrl` is added to a track, the file must be:

- A licensed or originally-produced recording — see §9. Never a URL to a third-party stream, a
  YouTube audio extraction, or any file whose rights this project doesn't hold or have a license
  for.
- A web-playable format: `.mp3` (universal compatibility) or `.m4a`/AAC. No proprietary or
  DRM-wrapped containers.
- Loudness-normalized to a consistent target (approx. -14 LUFS integrated) so switching between
  tracks doesn't jar the user with volume jumps.
- Encoded at a bitrate that keeps files reasonably small for a PWA that must work offline once
  cached (128-192kbps CBR/VBR mp3 is a reasonable target) — this is a mobile-first practice tool,
  not an audiophile streaming product.
- Placed under a `public/audio/shed-tracks/` directory (create it when the first real file is
  added) and referenced by a root-relative path, e.g. `/audio/shed-tracks/gospel-groove-01.mp3`.
  Never a `data:` URI, never an absolute filesystem path.
- Accompanied by updating `sections`/`durationSeconds`/`bpm` in the track's `ShedTrack` entry to
  match the actual file — these fields describe the real recording, not aspirational values.

## 5. Stem requirements

Stems are optional per track (`stems: null` is a valid, expected state for a track that has a
full mix but no isolated parts). When stems do exist for a track:

- Every stem file must be time-aligned to sample-accurate sync with the full mix and with every
  other stem for that track — the Stem Mixer plays them simultaneously and any drift is audible
  immediately.
- Same format/loudness/hosting conventions as §4, under
  `public/audio/shed-tracks/<track-id>/stems/<stem-name>.mp3`.
- A track does not need all six stems to ship — a partial stem set (e.g., just Drums isolated so
  it can be muted, with everything else on one "the rest" stem) is acceptable and should be
  modeled as only the keys that exist in the `stems` record.
- The `stems` record's keys must be a subset of `StemName` (§6) — no ad-hoc stem names.

## 6. Supported stems

Defined as `StemName` in `src/data/shedTracks.ts`. Exactly these six:

- Drums
- Bass
- Keys
- Guitar
- Vocals
- Percussion

## 7. Loopable sections

`sections: TrackSection[]` describes the track's structure as named, timestamped regions:

```ts
interface TrackSection {
  name: "Intro" | "Verse" | "Chorus" | "Bridge" | "Outro";
  startSeconds: number;
  endSeconds: number;
}
```

`loopableRegionNames` is a subset of the section names actually offered to the user as loop
targets in the Loop Player — not every section is a useful practice loop (an 8-second Intro
rarely is), so this list is curated per track rather than defaulting to "all sections."

## 8. BPM requirements

- `bpm` on a `ShedTrack` is the track's **native recorded tempo** — the actual tempo the audio was
  performed and recorded at. It is never a placeholder or rounded guess.
- The Loop Player's BPM controls (increase/decrease/tap tempo) adjust *playback* tempo relative to
  this native value; they do not change what `bpm` means on the data model. See the Loop Player
  implementation for how tempo change is achieved without reloading the track.
- Tracks should span a realistic range for the curriculum's difficulty ladder (roughly 70-160 BPM)
  so Shed Tracks remains useful across Level 0 through Level 3, rather than clustering at one
  tempo.

## 9. Licensing / copyright rules

**Non-negotiable, matching this repo's standing instructions:**

- No copyrighted commercial recording is ever added to this repository or referenced by URL —
  not a real song, not a "just for testing" snippet, not a link to someone else's hosted audio.
- A track's `source` field must always truthfully state where the audio came from: e.g.
  `"Original composition, recorded for this project"`, `"Licensed from <named library>, license
  on file"`, or, for anything not yet real, `"Not yet sourced"` (the placeholder tracks currently
  in `shedTracks.ts` all say this).
- Acceptable sources for real production audio, in order of preference:
  1. **Original compositions** written and recorded specifically for this app (by the team, a
     hired session player, or a properly-licensed collaborator), with rights fully owned or
     explicitly licensed for this use.
  2. **Explicitly licensed library tracks** from a production-music library whose license
     permits this exact use (an app feature, not just background music in a video) — the license
     terms and proof of purchase/agreement must be kept on file and referenced in `source`.
  3. Never: extracted/ripped audio from YouTube, streaming services, or any recording whose
     rights this project doesn't hold — regardless of how the video-library provenance rules in
     `CLAUDE.md` §"Data provenance" were applied to the *Shed Session video library*, which is a
     fundamentally different, embed-only use case and does not extend to Shed Tracks audio files.
- If in doubt about whether a candidate asset is clear to use, treat it as not clear and do not
  add it. A missing track (`audioUrl: null`) is always the correct fallback over a legally
  ambiguous one.

## 10. Production asset workflow

To take a track from placeholder to production:

1. Source or produce the audio per §9, and (if applicable) its stems per §5.
2. Master/export per the format and loudness requirements in §4-5.
3. Add the files under `public/audio/shed-tracks/` per the path conventions above.
4. Update the track's entry in `SHED_TRACKS` (`src/data/shedTracks.ts`): set `audioUrl`, `stems`
   (if any), and correct `bpm`/`key`/`durationSeconds`/`sections` to match the real file exactly.
5. Do not remove `isArchitectureDemo` from the demo track (§11) or repurpose its id — it stays a
   distinct, permanently-synthetic entry.
6. Run `npm run curriculum:validate` (unaffected — it validates the curriculum, not Shed Tracks,
   but is part of the standard verification pass) plus `npm run test`, `npx tsc --noEmit`, and
   `npm run lint` before committing.
7. Manually verify playback, looping, BPM change, and (if stems exist) mute/solo behavior against
   the real file — automated tests use the synthetic fixture (§11) and cannot catch
   file-specific issues like an unencoded corrupt export or a stem that's out of sync.

## 11. Local development demo audio

`src/audio/demoTrackSource.ts` generates a short (8-second, 100 BPM) pulsing tone **entirely in
the browser via the Web Audio API** — no binary file, no network request, no URL of any kind. It
exists solely to prove the Loop Player and Stem Mixer mechanics (play/pause/loop/BPM/mute/solo)
actually work end-to-end before any real audio exists.

**This is a development and test fixture, not production music, and must never be presented to a
real user as a finished Shed Track.** Concretely:

- It backs exactly one `ShedTrack` entry, `id: "architecture-demo"`, with `isArchitectureDemo:
  true` and a title that says outright it's a synthesized non-track.
- Its per-"stem" differentiation is six different fixed pitches (`DEMO_STEM_FREQUENCIES`), not
  real instrument parts — muting "Bass" in the demo mutes a low pulsing tone, not a bass
  performance.
- Any UI surfacing this track should visually distinguish it (e.g. a "Demo" badge) so it's
  obviously not one of the genre tracks.
- It is never a template to "fill in" other tracks with — every non-demo `ShedTrack` must reach
  production audio via §10, or stay `audioUrl: null` until it can.

## 12. How future legitimate audio assets should be added

Follow §10 exactly, track by track. Do not batch-invent multiple tracks' worth of metadata ahead
of having real audio for them — the eight genre placeholder entries currently in `shedTracks.ts`
exist to give the browsing UI real structure to render (§13 below is about that UI), not as a
queue implying audio is coming imminently for all of them. Add `audioUrl`/`stems` only when the
actual files described in §4-5 exist and have been verified per §10 step 7.

## 13. Track browsing UI expectations

The Shed Track experience (the page/route that lists and launches tracks) must render correctly
for the current all-placeholder state: every track shows its real metadata (genre, BPM,
difficulty, duration, description, sections) even with `audioUrl: null`, and attempting to play a
track with no audio should surface a clear "production audio not added yet" state rather than a
silent failure or a broken player. Only the architecture-demo track should actually play audio
until real files are added per this document.
