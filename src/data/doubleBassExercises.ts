export interface DoubleBassExercise {
  id: string;
  level: 1 | 2 | 3 | 4;
  levelTitle: string;
  name: string;
  slug: string;
  category: "SETUP" | "ALTERNATING" | "BURSTS" | "FILLS" | "ENDURANCE";
  timeSignature: "4/4" | "6/8" | "12/8";
  subdivision: "Quarter" | "8th" | "16th" | "triplet" | "sextuplet";
  stickingPattern: string; // e.g. "K(R) K(L) K(R) K(L)"
  targetBpm: number;
  minBpm: number;
  maxBpm: number;
  purpose: string;
  techniqueGuide: string;
  commonMistakes: string[];
  musicalContext: string;
  drumeoGuideline: string;
}

export const DOUBLE_BASS_LEVELS = [
  {
    level: 1,
    title: "Level 1 — Fundamentals & Pedal Setup",
    description: "Ergonomics, spring tension balance, throne height, heel-up/down mechanics, and steady quarter/eighth notes.",
  },
  {
    level: 2,
    title: "Level 2 — Steady 16ths & Double Strokes",
    description: "Continuous 16th-note endurance, slide/heel-toe double strokes, and left-foot independence.",
  },
  {
    level: 3,
    title: "Level 3 — Pyramids & Speed Bursts",
    description: "Dynamic control, metric subdivision pyramids (quarter -> 8th -> 16th -> 32nd), and 4-bar stamina tracks.",
  },
  {
    level: 4,
    title: "Level 4 — Fills & Musical Application",
    description: "Linear gospel chops combinations (RLKK, RLRRLLKK), 6/8 Afro-gospel kick patterns, and fills.",
  },
] as const;

export const DOUBLE_BASS_EXERCISES: DoubleBassExercise[] = [
  // =========================================================================
  // LEVEL 1: Single-Foot Control, Setup & Alternating Basics
  // =========================================================================
  {
    id: "db-101",
    level: 1,
    levelTitle: "Level 1 — Fundamentals & Pedal Setup",
    name: "Throne Height & Beater Alignment",
    slug: "throne-height-and-beater-alignment",
    category: "SETUP",
    timeSignature: "4/4",
    subdivision: "Quarter",
    stickingPattern: "K K K K",
    targetBpm: 60,
    minBpm: 40,
    maxBpm: 100,
    purpose: "Establish ergonomic throne height (hip slightly higher than knee) and symmetric left/right pedal spring tension.",
    techniqueGuide: "Sit balanced on your throne without resting your upper body weight on your feet. Both feet should rest naturally on pedal footboards.",
    commonMistakes: [
      "Throne too low causing hip flexor fatigue and restricted blood flow",
      "Asymmetric spring tension making the slave pedal feel sluggish",
    ],
    musicalContext: "Essential baseline posture for relaxed playing across 2-hour church services.",
    drumeoGuideline: "Proper posture prevents back strain and unlocks natural ankle rebound.",
  },
  {
    id: "db-102",
    level: 1,
    levelTitle: "Level 1 — Fundamentals & Pedal Setup",
    name: "Alternating 8th Notes (R L R L)",
    slug: "alternating-8th-notes-rlrl",
    category: "ALTERNATING",
    timeSignature: "4/4",
    subdivision: "8th",
    stickingPattern: "K(R) K(L) K(R) K(L)",
    targetBpm: 75,
    minBpm: 50,
    maxBpm: 120,
    purpose: "Develop consistent volume, timing, and strike velocity between right and left kick pedals.",
    techniqueGuide: "Use controlled leg motion at slow tempos. Keep the non-striking beater 2 inches off the head to avoid accidental muffle.",
    commonMistakes: [
      "Weak left foot beater strikes resulting in uneven kick audio",
      "Rushing the left foot stroke due to lack of muscle memory",
    ],
    musicalContext: "Fundamental double bass foundation for marching grooves and gospel drive.",
    drumeoGuideline: "Practice to a click and verify equal volume between right and left kicks.",
  },
  {
    id: "db-103",
    level: 1,
    levelTitle: "Level 1 — Fundamentals & Pedal Setup",
    name: "Left Foot Lead 8th Notes (L R L R)",
    slug: "left-foot-lead-8th-notes",
    category: "ALTERNATING",
    timeSignature: "4/4",
    subdivision: "8th",
    stickingPattern: "K(L) K(R) K(L) K(R)",
    targetBpm: 70,
    minBpm: 45,
    maxBpm: 110,
    purpose: "Eliminate left foot dominance disparity by starting the pulse on the non-dominant foot.",
    techniqueGuide: "Count out loud '1 & 2 & 3 & 4 &' emphasizing the downbeats with the left foot.",
    commonMistakes: [
      "Letting the right foot take over the downbeat pulse",
      "Tensing the shoulders while concentrating on the left foot",
    ],
    musicalContext: "Crucial for ambidextrous footwork and smooth transitions during fills.",
    drumeoGuideline: "Building left foot confidence is the #1 shortcut to doubling your pedal speed.",
  },

  // =========================================================================
  // LEVEL 2: Continuous 16ths, Heel-Toe & Slide Double Strokes
  // =========================================================================
  {
    id: "db-201",
    level: 2,
    levelTitle: "Level 2 — Steady 16ths & Double Strokes",
    name: "Continuous 16th-Note Flow",
    slug: "continuous-16th-note-flow",
    category: "ENDURANCE",
    timeSignature: "4/4",
    subdivision: "16th",
    stickingPattern: "K(R) K(L) K(R) K(L) K(R) K(L) K(R) K(L)",
    targetBpm: 90,
    minBpm: 60,
    maxBpm: 140,
    purpose: "Build muscular endurance and steady timing over 1 to 2 minute continuous runs.",
    techniqueGuide: "Transition from full leg movement to ankle motion as tempo increases past 90 BPM.",
    commonMistakes: [
      "Burying the beater into the bass drum head, suffocating tone",
      "Uneven note spacing (galloping) instead of true straight 16ths",
    ],
    musicalContext: "Used in high-energy gospel praise breaks, rock choruses, and drum solos.",
    drumeoGuideline: "Focus on relaxed breathing. If your shins burn excessively, slow down by 10 BPM.",
  },
  {
    id: "db-202",
    level: 2,
    levelTitle: "Level 2 — Steady 16ths & Double Strokes",
    name: "Double Stroke Foot Rolls (RR LL RR LL)",
    slug: "double-stroke-foot-rolls-rrll",
    category: "ALTERNATING",
    timeSignature: "4/4",
    subdivision: "16th",
    stickingPattern: "K(R) K(R) K(L) K(L) K(R) K(R) K(L) K(L)",
    targetBpm: 80,
    minBpm: 50,
    maxBpm: 130,
    purpose: "Apply rudimental double strokes to the feet using the slide or swivel technique.",
    techniqueGuide: "Strike note 1 with the ball of foot mid-board, slide forward 1 inch for note 2 using rebound.",
    commonMistakes: [
      "Second stroke much softer than first stroke",
      "Stiff ankle preventing natural beater rebound",
    ],
    musicalContext: "Unlocks lightning-fast bursts without requiring hyper-fast single-stroke leg motions.",
    drumeoGuideline: "The slide technique allows effortless 2-note bursts with minimal energy expenditure.",
  },

  // =========================================================================
  // LEVEL 3: Pyramids, Dynamic Control & Speed Bursts
  // =========================================================================
  {
    id: "db-301",
    level: 3,
    levelTitle: "Level 3 — Pyramids & Speed Bursts",
    name: "Subdivision Pyramid (8ths to 16ths to Triplets)",
    slug: "subdivision-pyramid-8th-16th-triplet",
    category: "BURSTS",
    timeSignature: "4/4",
    subdivision: "triplet",
    stickingPattern: "K(R) K(L) K(R) K(L) K(R) K(L)",
    targetBpm: 85,
    minBpm: 55,
    maxBpm: 135,
    purpose: "Shift effortlessly between duple (16ths) and triple (triplets/sextuplets) meter under your feet.",
    techniqueGuide: "Play 1 bar of 8th notes, 1 bar of 16th notes, and 1 bar of 8th-note triplets seamlessly.",
    commonMistakes: [
      "Dragging tempo when shifting into triplets",
      "Rushing back into straight 16ths",
    ],
    musicalContext: "Crucial for Ghanaian 6/8 and 12/8 gospel rhythms shifting into modern 4/4 beats.",
    drumeoGuideline: "Subdivision mastery gives you total command over groove pocket and tempo.",
  },
  {
    id: "db-302",
    level: 3,
    levelTitle: "Level 3 — Pyramids & Speed Bursts",
    name: "4-Note Speed Bursts (RLRL in 32nds)",
    slug: "4-note-speed-bursts-32nds",
    category: "BURSTS",
    timeSignature: "4/4",
    subdivision: "16th",
    stickingPattern: "K(R) K(L) K(R) K(L) - - - -",
    targetBpm: 95,
    minBpm: 60,
    maxBpm: 150,
    purpose: "Execute sudden high-velocity 4-note kick bursts inside a steady hands groove.",
    techniqueGuide: "Keep the hi-hat/ride cymbal hand perfectly steady while feet explode with a 4-note burst on beat 4.",
    commonMistakes: [
      "Hands speeding up during the foot burst",
      "Landing late on the following downbeat crash",
    ],
    musicalContext: "Used right before powerful crash accents in modern gospel worship and praise jams.",
    drumeoGuideline: "Burst training builds fast-twitch muscle fibers without tiring you out.",
  },

  // =========================================================================
  // LEVEL 4: Fills, Linear Combinations & Full Kit Application
  // =========================================================================
  {
    id: "db-401",
    level: 4,
    levelTitle: "Level 4 — Fills & Musical Application",
    name: "Linear RLKK 4-Way Combination",
    slug: "linear-rlkk-4-way-combination",
    category: "FILLS",
    timeSignature: "4/4",
    subdivision: "16th",
    stickingPattern: "R L K(R) K(L) R L K(R) K(L)",
    targetBpm: 100,
    minBpm: 60,
    maxBpm: 160,
    purpose: "Master the classic Right-Left-Kick-Kick linear phrase used across gospel, fusion, and metal.",
    techniqueGuide: "Ensure zero overlap between hands and feet. Each note must occupy its exact 16th-note slot.",
    commonMistakes: [
      "Flamming the hand stroke and kick stroke together instead of playing true linear notes",
      "Right foot entering before the left hand completes its stroke",
    ],
    musicalContext: "The backbone of gospel chops, rock drum fills, and fusion breaks.",
    drumeoGuideline: "Practice this on a practice pad and double pedal before moving it across the full drum kit.",
  },
  {
    id: "db-402",
    level: 4,
    levelTitle: "Level 4 — Fills & Musical Application",
    name: "Sextuplet Gospel Fill: R L K(R) K(L) R L",
    slug: "sextuplet-gospel-fill-double-kick",
    category: "FILLS",
    timeSignature: "4/4",
    subdivision: "sextuplet",
    stickingPattern: "R L K(R) K(L) R L",
    targetBpm: 85,
    minBpm: 50,
    maxBpm: 140,
    purpose: "Combine hands and double bass in 6-note rolling phrases for fast gospel turnarounds.",
    techniqueGuide: "Orchestrate: R on High Tom, L on Snare, K K on double bass, R on Floor Tom, L on Snare.",
    commonMistakes: [
      "Tripping over the kick doubles inside the sextuplet grid",
      "Losing track of where beat 1 lands on the crash cymbal",
    ],
    musicalContext: "A quintessential modern church gospel fill used before chorus drops and song endings.",
    drumeoGuideline: "Always resolve the fill cleanly with a Kick + Crash on beat 1 of the next measure.",
  },
];

export function getDoubleBassExerciseById(id: string): DoubleBassExercise | undefined {
  return DOUBLE_BASS_EXERCISES.find((e) => e.id === id);
}

export function getDoubleBassExercisesByLevel(level: 1 | 2 | 3 | 4): DoubleBassExercise[] {
  return DOUBLE_BASS_EXERCISES.filter((e) => e.level === level);
}
