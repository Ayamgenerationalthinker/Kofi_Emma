// Section 26/27: the theory Handbook. Structured, searchable content —
// beginner-friendly language that becomes progressively more technical.
// Not exhaustive essays; genuine, accurate, non-placeholder explanations
// organized so a drummer can find what they need without wading through a
// wall of text on the practice screen.

export type HandbookCategory = "Technique" | "Rhythm" | "Style" | "Advanced";

export interface HandbookSection {
  heading: string;
  body: string;
}

export interface HandbookTopic {
  id: string;
  title: string;
  level: number | null;
  category: HandbookCategory;
  summary: string;
  sections: HandbookSection[];
  tags: string[];
}

export const HANDBOOK_TOPICS: HandbookTopic[] = [
  {
    id: "grip-and-technique",
    title: "Grip & Technique",
    level: 0,
    category: "Technique",
    summary: "Matched and traditional grip, relaxed hands, and how the stick actually rebounds.",
    sections: [
      {
        heading: "Matched grip",
        body: "Both hands hold the stick the same way — thumb and first finger forming a fulcrum roughly a third of the way from the butt end, remaining fingers curled loosely underneath. The grip should be firm enough to control the stick and loose enough to let it bounce.",
      },
      {
        heading: "Traditional grip",
        body: "The left hand (for a right-handed setup) holds the stick between the thumb web and ring finger, resting across the middle finger, and rotates the forearm to strike. Rooted in rudimental drumming; optional for a kit-focused player, but worth knowing.",
      },
      {
        heading: "Rebound",
        body: "A drum head bounces a stick back up almost as much as it went down. Fighting that rebound wastes energy and slows you down; the whole point of finger control and the Moeller technique below is learning to work with it instead.",
      },
      {
        heading: "A safety note",
        body: "Stop if you experience pain. Fatigue and technical discomfort should not be confused with injury — if something hurts sharply or persistently, rest and reassess your grip and tension rather than playing through it.",
      },
    ],
    tags: ["grip", "technique", "rebound", "matched grip", "traditional grip"],
  },
  {
    id: "moeller-and-finger-control",
    title: "Moeller Technique & Finger Control",
    level: 0,
    category: "Technique",
    summary: "The whipping arm motion and finger-driven rebound control that power speed without tension.",
    sections: [
      {
        heading: "Wrist stroke vs. finger control",
        body: "A wrist stroke generates power from a wrist hinge; finger control generates speed and evenness by letting the fingers catch and release the stick's rebound. Most fast, relaxed playing blends both — wrist for accents, fingers for the notes in between.",
      },
      {
        heading: "The Moeller motion",
        body: "A downward whip of the forearm generates an accent, and the rebound left in the stick powers one or two unaccented follow-up taps with no new muscular effort. It's the technique behind playing an accent-tap-tap pattern fast without tensing up.",
      },
      {
        heading: "Why this matters for speed",
        body: "Tension is the single biggest speed limiter. A relaxed grip with active finger control will out-perform a tense, wrist-only stroke every time once tempo climbs past a moderate pace.",
      },
    ],
    tags: ["moeller", "finger control", "wrist stroke", "technique", "speed"],
  },
  {
    id: "rudiments-overview",
    title: "Rudiments",
    level: 1,
    category: "Technique",
    summary: "What a rudiment is, and how the 40 PAS International Drum Rudiments are organized.",
    sections: [
      {
        heading: "What a rudiment is",
        body: "A rudiment is a standardized sticking pattern — a building block. Learning rudiments means learning a shared vocabulary that transfers directly into fills, grooves, and solo phrasing rather than staying a purely academic exercise.",
      },
      {
        heading: "The four families",
        body: "The 40 PAS rudiments split into Roll rudiments (single/double/multiple-bounce and the numbered rolls), Diddle rudiments (paradiddles and their variants), Flam rudiments (grace-note accent pairs), and Drag rudiments (two-grace-note ruffs, including the ratamacues).",
      },
      {
        heading: "Isolation before application",
        body: "Practice a new rudiment slowly, hands alone, until it's even at a low tempo — then orchestrate it across the kit and only then push tempo. Speed learned on top of uneven technique just plays the unevenness faster.",
      },
    ],
    tags: ["rudiments", "paradiddle", "roll", "flam", "drag"],
  },
  {
    id: "subdivision-and-syncopation",
    title: "Subdivision & Syncopation",
    level: 0,
    category: "Rhythm",
    summary: "How a beat splits into smaller units, and what it means to accent between them.",
    sections: [
      {
        heading: "Subdivision",
        body: "Subdivision is how a beat is divided: quarter notes (one per beat), eighth notes (two), sixteenth notes (four), or triplets (three). Internalizing the subdivision grid — being able to feel where the 'e', '&', and 'a' sit inside a beat — is what makes complex patterns readable instead of guessed at.",
      },
      {
        heading: "Syncopation",
        body: "Syncopation is emphasis placed off the strong, expected beat — on an off-beat or a weak subdivision. It's what gives highlife and gospel grooves their forward-leaning, danceable feel instead of sitting flat on every downbeat.",
      },
    ],
    tags: ["subdivision", "syncopation", "16th notes", "timing"],
  },
  {
    id: "highlife-theory",
    title: "Ghanaian Highlife",
    level: 1,
    category: "Style",
    summary: "The 4/4 pulse, bell role, and interlocking parts that define a highlife pocket.",
    sections: [
      {
        heading: "The pulse and the bell",
        body: "Highlife grooves are typically felt in 4/4, anchored by a steady cowbell or hi-hat pulse that almost never wavers — everything else syncopates around that fixed reference point. This is a training pattern and common conceptual approach, not a claim that one bell pattern represents all Ghanaian highlife.",
      },
      {
        heading: "Interlocking and the pocket",
        body: "Kick, snare, and hi-hat parts are typically composed to interlock — each landing in the gaps the others leave — rather than stacking on the same subdivisions. The 'pocket' is the feeling of everything landing exactly where it should relative to that interlocking pulse.",
      },
      {
        heading: "From rudiment to fill",
        body: "A highlife fill is usually a rudiment (a six-stroke roll, a paradiddle-diddle) played evenly and then orchestrated across snare and toms — the technical vocabulary and the musical vocabulary are the same thing, just applied.",
      },
      {
        heading: "Practicing against the pulse",
        body: "Loop a steady quarter- or eighth-note pulse (the metronome's plain click, or a highlife preset) and layer syncopated hand/kick patterns on top of it, the same way you'd practice against a real cowbell part.",
      },
    ],
    tags: ["highlife", "ghana", "pocket", "interlocking", "bell"],
  },
  {
    id: "praise-and-gospel-chops",
    title: "Fast Praise & Gospel Chops",
    level: 2,
    category: "Style",
    summary: "Linear playing, hi-hat barking, and the vocabulary that powers up-tempo gospel praise.",
    sections: [
      {
        heading: "Linear playing",
        body: "Linear playing means the events are separated rather than stacked simultaneously — in R L K K R L, each of the six events lands on its own moment; no two limbs ever strike at the same instant. The goal is not merely speed; it's even spacing between every event, at any tempo.",
      },
      {
        heading: "Ostinato",
        body: "An ostinato is a repeating pattern held by one limb (often the kick or hi-hat foot) while the other limbs play something independent on top. Building an ostinato as its own automatic layer — practiced alone before combining — is what makes real four-limb independence possible.",
      },
      {
        heading: "Hi-hat barking",
        body: "A quick foot-controlled open-close of the hi-hat pedal — a 'bark' — layered under a steady hand pattern, adding a percussive accent without the hands doing anything extra. It's a foot articulation technique, distinct from the hi-hat foot's usual timekeeping role.",
      },
      {
        heading: "Ghost notes",
        body: "Ghost notes are quiet, often-unaccented notes played between the main groove notes — present in the pattern but felt more than heard. They add texture and forward motion without cluttering the groove.",
      },
    ],
    tags: ["linear", "ostinato", "hi-hat barking", "ghost notes", "gospel", "praise"],
  },
  {
    id: "compound-meter-6-8-12-8",
    title: "6/8 & 12/8 Compound Meter",
    level: 2,
    category: "Rhythm",
    summary: "West African compound-meter feel — grouping in threes instead of straight even counts.",
    sections: [
      {
        heading: "6/8",
        body: "6/8 groups six eighth notes into two groups of three (ONE-two-three FOUR-five-six) rather than feeling like six even clicks. This two-group compound feel is central to West African rhythm and to gospel material built on it.",
      },
      {
        heading: "12/8",
        body: "12/8 extends the same compound feel across four groups of three, and tends to sit at a more spacious, relaxed tempo than 6/8 — common in slower gospel worship material.",
      },
      {
        heading: "Common mistake",
        body: "Playing 6/8 or 12/8 as if it were straight 4/4 — evenly, without the internal three-grouping — is the single most common way this meter loses its feel. Practice counting the groups out loud until the grouping is automatic.",
      },
    ],
    tags: ["6/8", "12/8", "compound meter", "west african"],
  },
  {
    id: "odd-meter-7-8",
    title: "7/8 & Odd Meter",
    level: 3,
    category: "Advanced",
    summary: "Grouping seven eighth notes unevenly, and why more than one grouping is 'correct.'",
    sections: [
      {
        heading: "Grouping 7/8",
        body: "7/8 can be grouped as 2+2+3 (ONE-two | ONE-two | ONE-two-three), 2+3+2, or 3+2+2 — no single grouping is universally correct; different tunes and traditions favor different groupings, and the choice changes where the meter feels like it 'lands.'",
      },
      {
        heading: "Practicing odd meter",
        body: "Start by speaking or clapping the grouping out loud before playing it — the cognitive grouping has to be secure before the hands can execute it reliably at tempo.",
      },
    ],
    tags: ["7/8", "odd meter", "grouping"],
  },
  {
    id: "metric-modulation",
    title: "Metric Modulation",
    level: 3,
    category: "Advanced",
    summary: "Reinterpreting a subdivision as a new pulse — a professional phrasing concept, explained conceptually.",
    sections: [
      {
        heading: "The core idea",
        body: "A rhythmic subdivision within the current tempo can be reinterpreted as the new main pulse — for example, treating an eighth-note triplet as the new quarter note shifts the felt tempo without the metronome's number technically changing. This app teaches the concept in plain language; it does not attempt to automatically detect or perform metric modulation for you.",
      },
      {
        heading: "Why it matters",
        body: "It's a tool for smooth, musical tempo transitions inside a performance — moving from a groove into a double-time or half-time feel without an abrupt jump.",
      },
    ],
    tags: ["metric modulation", "advanced", "tempo"],
  },
  {
    id: "speed-and-endurance",
    title: "Speed, 32nd Notes & Endurance",
    level: 3,
    category: "Advanced",
    summary: "Building raw hand speed and the stamina to hold a fast groove for a full performance.",
    sections: [
      {
        heading: "32nd-note bursts",
        body: "Short, fast single-stroke bursts inserted into a slower groove are how professional gospel fills get their excitement — but the burst has to stay perfectly even in both timing and volume, or it reads as sloppy rather than exciting.",
      },
      {
        heading: "Endurance",
        body: "Endurance is built the same way accuracy is: gradually, with attention to relaxed technique. A tense, fast burst that only lasts four bars is less useful than a relaxed groove that holds up for the length of a real set.",
      },
      {
        heading: "A safety note",
        body: "Fatigue and technical discomfort are normal parts of building endurance. Sharp or persistent pain is not — stop and rest if that happens, rather than pushing through it.",
      },
    ],
    tags: ["speed", "32nd notes", "endurance", "burst"],
  },
  {
    id: "dynamics-and-pocket",
    title: "Dynamics & the Pocket",
    level: 2,
    category: "Technique",
    summary: "Shaping volume intentionally, and what 'the pocket' actually means.",
    sections: [
      {
        heading: "Dynamic control",
        body: "Dynamics — the intentional variation of volume from quiet to loud — is what turns a technically correct pattern into a musical phrase. Plan a dynamic arc (where does a phrase start quiet, where does it peak) rather than playing everything at one volume.",
      },
      {
        heading: "The pocket",
        body: "'The pocket' describes the feeling of a groove sitting exactly where it should, neither rushing nor dragging, with every limb locked to the same internal pulse. It's a feel, not a technique in isolation — it's the payoff of solid timing, relaxed technique, and real listening.",
      },
    ],
    tags: ["dynamics", "pocket", "musicality"],
  },
];

export function getHandbookTopic(id: string): HandbookTopic | undefined {
  return HANDBOOK_TOPICS.find((t) => t.id === id);
}

export const HANDBOOK_CATEGORIES: HandbookCategory[] = ["Technique", "Rhythm", "Style", "Advanced"];
