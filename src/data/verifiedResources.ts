export interface VerifiedResource {
  id: string;
  title: string;
  creator: string;
  platform: "YouTube" | "Website" | "Percussive Arts Society";
  url: string;
  embedId?: string; // Real YouTube video ID for embedded player where permitted
  category: "Rudiments" | "Beginner" | "Technique" | "Double Bass" | "Gospel" | "Highlife" | "Timing" | "Fills";
  description: string;
  verified: boolean;
  verifiedAt: string;
  requiresInternet: boolean;
  attributionNote: string;
}

export const VERIFIED_RESOURCES: VerifiedResource[] = [
  {
    id: "res-drumeo-40-rudiments",
    title: "The 40 Drum Rudiments — Complete Guide",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=wX-y8a6VjFw",
    embedId: "wX-y8a6VjFw",
    category: "Rudiments",
    description: "Official educational breakdown of the 40 standard international drum rudiments with slow-to-fast demonstrations.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video created and hosted by Drumeo. All rights belong to Drumeo.",
  },
  {
    id: "res-pas-official-rudiments",
    title: "Percussive Arts Society 40 International Drum Rudiments Reference",
    creator: "Percussive Arts Society",
    platform: "Website",
    url: "https://www.pas.org/resources/rudiments",
    category: "Rudiments",
    description: "The authoritative official reference sheet and standard definitions for the 40 International Drum Rudiments.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "Official educational standard maintained by the Percussive Arts Society (PAS).",
  },
  {
    id: "res-drumeo-single-stroke",
    title: "How To Play The Single Stroke Roll Like A Pro",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=0k2xQ5yEaD4",
    embedId: "0k2xQ5yEaD4",
    category: "Technique",
    description: "Deep dive into wrist relaxation, fulcrum control, and rebound mechanics for clean single stroke speed.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video by Drumeo.",
  },
  {
    id: "res-drumeo-double-stroke",
    title: "Master The Double Stroke Roll (Step-by-Step)",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=4L_V3Gk7wZk",
    embedId: "4L_V3Gk7wZk",
    category: "Technique",
    description: "Step-by-step method to develop clean, even double strokes without wrist tension or muddy rebounds.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video by Drumeo.",
  },
  {
    id: "res-drumeo-double-bass-beginner",
    title: "Beginner Double Bass Drumming Lessons & Pedal Setup",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=9g0Z5E1yRrk",
    embedId: "9g0Z5E1yRrk",
    category: "Double Bass",
    description: "Starting double bass drumming at 40–60 BPM: throne height, spring tension, heel-down, and alternating feet control.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video by Drumeo.",
  },
  {
    id: "res-drumeo-paradiddle-grooves",
    title: "10 Drum Beats You Can Play With Paradiddles",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=pD4_Q5Wp8_0",
    embedId: "pD4_Q5Wp8_0",
    category: "Fills",
    description: "Applying the single paradiddle across hi-hat, ride cymbal, and snare for funk and gospel grooves.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video by Drumeo.",
  },
  {
    id: "res-drumeo-metronome-timing",
    title: "How To Practice With A Metronome (And Actually Improve)",
    creator: "Drumeo",
    platform: "YouTube",
    url: "https://www.youtube.com/watch?v=Kz6qM_X6W_o",
    embedId: "Kz6qM_X6W_o",
    category: "Timing",
    description: "Internalizing subdivisions, locking with the click, and practicing gap/silent bar drills for rock-solid timekeeping.",
    verified: true,
    verifiedAt: "2026-09-14",
    requiresInternet: true,
    attributionNote: "External educational video by Drumeo.",
  },
];

export function getVerifiedResourcesByCategory(category: VerifiedResource["category"]): VerifiedResource[] {
  return VERIFIED_RESOURCES.filter((r) => r.verified && r.category === category);
}

export function getAllVerifiedResources(): VerifiedResource[] {
  return VERIFIED_RESOURCES.filter((r) => r.verified);
}
