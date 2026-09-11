// Section 47/123: the Kofi Emma Shed Session video library. This is
// static, read-only reference data — bundled at build time, identical for
// every user. Per-user state (watched, favorited, notes, study checklist
// answers) is never stored here; it lives in LocalStorage instead, keyed
// by `youtubeId` (see `src/services/videoStudyService.ts` and
// `VideoStudyRecord` in `src/lib/storage/types.ts`).
//
// Provenance (read before adding more videos):
// - `Cd25CPj4Ii4` was supplied directly in this project's original build
//   spec, title included verbatim from that spec text.
// - The 11 videos below were supplied by the user as youtu.be URLs. Their
//   YouTube ids were extracted directly from those URLs. Their titles were
//   retrieved by fetching each video's live YouTube page during this
//   session (via WebFetch) — a real network fetch, not a guess — and every
//   one of them contains "Kofi Emma" or "KofiEmmaDrummer" directly in its
//   own title text, which corroborates the user's claim that these are
//   from the same channel. That said, YouTube's fetched page did not
//   expose a separately-labeled channel/uploader field for confirmation,
//   so `titleSource: "fetched"` records exactly what was and wasn't
//   independently confirmed — it is not a claim of official API
//   verification. Category/focus/tags below are inferred only from each
//   video's own title text, not from watching the video.
//
// To add more videos later: append a new `KofiEmmaVideo` object below. No
// UI changes are required — VideoCard/VideoEmbed and the Shed Session page
// all read from this array.

export type VideoCategory = "Highlife" | "Praise" | "Worship" | "Chops" | "Grooves" | "Transitions" | "Speed" | "Performance" | "Study";

export interface KofiEmmaVideo {
  id: string;
  youtubeId: string;
  title: string;
  category: VideoCategory;
  description: string;
  focus: string;
  /** Curriculum level (0-3) this is most useful to study at, or null if not level-specific. */
  level: number | null;
  tags: string[];
  source: string;
  /** How this video's title was established — an honesty trail, not UI copy. */
  titleSource: "spec-provided" | "fetched";
}

export const KOFI_EMMA_VIDEOS: KofiEmmaVideo[] = [
  {
    id: "kofi-emma-hot-praise-groove",
    youtubeId: "Cd25CPj4Ii4",
    title: "An African Hot Praise Groove That Will Get You Dancing Forever..!!!",
    category: "Praise",
    description: "A fast praise groove performance. Study the pocket, the kick placement, and how the fills connect back to the groove.",
    focus: "African highlife/praise groove study",
    level: 2,
    tags: ["highlife", "praise", "groove", "gospel"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "spec-provided",
  },
  {
    id: "kofi-emma-japan-performance",
    youtubeId: "Rt_wN-mKM_0",
    title: "AMAZING PERFORMANCE FROM JAPAN🇯🇵…ENJOY FAM!!!",
    category: "Performance",
    description: "A live performance filmed in Japan. Watch for pocket, dynamics, and how the groove holds up in a different room.",
    focus: "Live performance study",
    level: null,
    tags: ["performance", "gospel"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-tgma-2026-piesie-esther",
    youtubeId: "_spxwVq1AJ0",
    title: "Drum cam : TGMA 2026 with Piesie Esther!!!KofiemmaDrummer..ENJOY FAM!!",
    category: "Performance",
    description: "A drum-cam performance alongside gospel artist Piesie Esther at TGMA (Ghana Music Awards). A close-up angle on technique and feel.",
    focus: "Drum-cam performance study",
    level: null,
    tags: ["performance", "drum-cam", "gospel"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-daughters-of-glorious-jesus",
    youtubeId: "oC1GF0NH0mo",
    title: "DAUGHTERS OF GLORIOUS JESUS//KOFIEMMADRUMMER..ENJOY FAM!!!",
    category: "Worship",
    description: "A performance with the Daughters of Glorious Jesus gospel choir. Study the worship pocket and dynamic restraint behind vocals.",
    focus: "Worship accompaniment study",
    level: null,
    tags: ["worship", "gospel", "choir"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-jam-piesie-esther",
    youtubeId: "sE7YY710hHg",
    title: "AWESOME JAM WITH PIESIE ESTHER //KOFIEMMADRUMMER!!!",
    category: "Performance",
    description: "A live jam session with gospel artist Piesie Esther. Study the interplay between drums and vocals in a jam setting.",
    focus: "Live jam study",
    level: null,
    tags: ["performance", "jam", "gospel"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-crazy-african-gospel-jam",
    youtubeId: "DnyHzTzXLX8",
    title: "CRAZY AFRICAN GOSPEL JAM‼️KOFI EMMA ON DRUMS||ENJOY FAM!!!",
    category: "Praise",
    description: "A high-energy gospel jam. Study how tempo and intensity build across the performance.",
    focus: "Fast gospel jam study",
    level: 2,
    tags: ["gospel", "praise", "jam"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-sweet-agbadza-jam",
    youtubeId: "RmT5TXTnuEA",
    title: "Band Cam: SWEET AGBADZA JAM‼️KOFI EMMA ON DRUMS!!!ENJOY FAM.!!!",
    category: "Grooves",
    description: "A band-cam performance built on Agbadza, a traditional Ewe (Ghanaian) rhythm. Study how a traditional feel is adapted to the kit.",
    focus: "Traditional Ghanaian rhythm (Agbadza) study",
    level: null,
    tags: ["groove", "traditional", "agbadza", "band-cam"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-hot-praise-jam-band-cam",
    youtubeId: "EFCX6hNj7UQ",
    title: "Band Cam: YOU WILL LOVE THIS HOT‼️ PRAISE JAM!!! Kofi Emma on drums!!!ENJOY❗️",
    category: "Praise",
    description: "A band-cam praise jam. Study the pocket and fill placement from the full-band camera angle.",
    focus: "Fast praise jam study",
    level: 2,
    tags: ["praise", "jam", "band-cam"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-reggae-daughters-of-glorious-jesus",
    youtubeId: "peiA9nYmCYg",
    title: "Hot REGGAE PERFORMANCE With DAUGHTERS OF GLORIOUS JESUS 🔥🔥 and CECCY TWUM in Kumasi",
    category: "Performance",
    description: "A reggae-feel performance in Kumasi with the Daughters of Glorious Jesus and Ceccy Twum. Study how the groove shifts outside a straight gospel feel.",
    focus: "Reggae-feel performance study",
    level: null,
    tags: ["reggae", "performance", "worship"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-ohemaa-mercy-bethel-praiz",
    youtubeId: "TwGpS2dc3Is",
    title: "Awesome performance with Ohemaa Mercy At Bethel Praiz🎶🎶 || Kofi Emma on drums || OSPOK on Bass",
    category: "Praise",
    description: "A praise performance with gospel artist Ohemaa Mercy. Study the drum-and-bass interplay with bassist OSPOK.",
    focus: "Praise performance with bass interplay",
    level: null,
    tags: ["praise", "performance", "gospel"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-funeral-drum-solo",
    youtubeId: "JRF-CasFL8Y",
    title: "Sweet drumsolo at a funeral.!!!Kofi Emma drummer!!! 😄😄🥁🎶💵",
    category: "Chops",
    description: "A drum solo performed at a funeral celebration. Study phrase construction and dynamic control in a solo context.",
    focus: "Solo phrasing study",
    level: 3,
    tags: ["solo", "chops", "performance"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
  {
    id: "kofi-emma-solid-jama-solo-ideas",
    youtubeId: "KjCoXS_jSEc",
    title: "Solid JAMA for the day!!! (Watch Kofi Emma display his solo Ideas)!!!",
    category: "Chops",
    description: "A jam session focused on solo ideas. Study phrase construction and how ideas develop across the solo.",
    focus: "Solo vocabulary study",
    level: 3,
    tags: ["solo", "chops", "jam"],
    source: "KOFI EMMA DRUMMER OFFICIAL PAGE",
    titleSource: "fetched",
  },
];

export function getVideo(youtubeId: string): KofiEmmaVideo | undefined {
  return KOFI_EMMA_VIDEOS.find((v) => v.youtubeId === youtubeId);
}

export const VIDEO_CATEGORIES: VideoCategory[] = ["Highlife", "Praise", "Worship", "Chops", "Grooves", "Transitions", "Speed", "Performance", "Study"];

export const KOFI_EMMA_CHANNEL_URL = "https://www.youtube.com/@kofiemmadrummerofficialpage/videos";
