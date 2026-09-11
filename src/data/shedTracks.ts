// Shed Tracks data model. NONE of these entries have real production audio
// — this app has never been given any licensed loop/stem audio files, and
// per explicit instruction this code must never invent a fake audio URL or
// pretend a placeholder is a finished track.
//
// Every track below has `audioUrl: null` and `stems: null` — the player
// and mixer architecture is fully built and exercised against ONE
// synthesized-in-the-browser demo track (see `audio/demoTrackSource.ts`,
// which generates tone data with the Web Audio API at runtime — not a
// shipped binary asset, so there is no possibility of it being mistaken
// for a real recording). Real content requires production files; see
// docs/SHED_TRACKS_ASSETS.md for exactly what's expected and where.

export type TrackGenre = "Gospel" | "Praise" | "Worship" | "Highlife" | "Reggae" | "Afrobeat" | "Afro-Gospel" | "Contemporary";

export type StemName = "Drums" | "Bass" | "Keys" | "Guitar" | "Vocals" | "Percussion";

export interface TrackSection {
  name: "Intro" | "Verse" | "Chorus" | "Bridge" | "Outro";
  startSeconds: number;
  endSeconds: number;
}

export interface ShedTrack {
  id: string;
  title: string;
  genre: TrackGenre;
  bpm: number;
  key: string | null;
  durationSeconds: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  source: string;
  sections: TrackSection[];
  /** Named loopable regions a user can repeat — a subset of `sections` by name, kept separate since not every section is a useful practice loop. */
  loopableRegionNames: TrackSection["name"][];
  /** Null = no production audio file exists yet. Never a fabricated path. */
  audioUrl: string | null;
  /** Null = no production stem files exist yet. Never fabricated paths. */
  stems: Partial<Record<StemName, string>> | null;
  /** True only for the one built-in synthesized track used to exercise the player/mixer architecture — never a real Shed Track. */
  isArchitectureDemo?: boolean;
}

const GENRES: TrackGenre[] = ["Gospel", "Praise", "Worship", "Highlife", "Reggae", "Afrobeat", "Afro-Gospel", "Contemporary"];

const STANDARD_SECTIONS: TrackSection[] = [
  { name: "Intro", startSeconds: 0, endSeconds: 8 },
  { name: "Verse", startSeconds: 8, endSeconds: 24 },
  { name: "Chorus", startSeconds: 24, endSeconds: 40 },
  { name: "Bridge", startSeconds: 40, endSeconds: 48 },
  { name: "Outro", startSeconds: 48, endSeconds: 56 },
];

/**
 * One placeholder entry per genre so the Shed Tracks browser has real
 * structure to render — each is explicit that it needs production audio
 * (`audioUrl: null`), not a track that happens to be silent.
 */
const GENRE_PLACEHOLDER_TRACKS: ShedTrack[] = GENRES.map((genre, i) => ({
  id: `track-${genre.toLowerCase().replace(/\s+/g, "-")}-01`,
  title: `${genre} Groove — Track Pending`,
  genre,
  bpm: 96 + i * 4,
  key: null,
  durationSeconds: 56,
  difficulty: 3,
  description: `A ${genre.toLowerCase()} practice track. Production audio has not been added to this deployment yet.`,
  source: "Not yet sourced",
  sections: STANDARD_SECTIONS,
  loopableRegionNames: ["Verse", "Chorus"],
  audioUrl: null,
  stems: null,
}));

const ARCHITECTURE_DEMO_TRACK: ShedTrack = {
  id: "architecture-demo",
  title: "Player Architecture Demo (Synthesized — Not a Real Track)",
  genre: "Contemporary",
  bpm: 100,
  key: null,
  durationSeconds: 8,
  difficulty: 1,
  description:
    "A short synthesized tone generated in the browser (no audio file, no network request) used only to prove the loop player and stem mixer actually play, loop, and respond to BPM/mute/solo. Not a Shed Track.",
  source: "Generated in-browser via Web Audio (src/audio/demoTrackSource.ts)",
  sections: [
    { name: "Intro", startSeconds: 0, endSeconds: 2 },
    { name: "Verse", startSeconds: 2, endSeconds: 4 },
    { name: "Chorus", startSeconds: 4, endSeconds: 6 },
    { name: "Outro", startSeconds: 6, endSeconds: 8 },
  ],
  loopableRegionNames: ["Verse", "Chorus"],
  audioUrl: null,
  stems: null,
  isArchitectureDemo: true,
};

export const SHED_TRACKS: ShedTrack[] = [ARCHITECTURE_DEMO_TRACK, ...GENRE_PLACEHOLDER_TRACKS];

export const TRACK_GENRES = GENRES;

export function getTrack(id: string): ShedTrack | undefined {
  return SHED_TRACKS.find((t) => t.id === id);
}

export const STEM_NAMES: StemName[] = ["Drums", "Bass", "Keys", "Guitar", "Vocals", "Percussion"];
