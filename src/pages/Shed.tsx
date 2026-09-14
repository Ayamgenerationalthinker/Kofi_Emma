import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Guitar,
  Search,
  WifiOff,
  Flame,
  Play,
  Square,
  Sparkles,
  Shuffle,
  Clock,
  Video,
  Sliders,
  CheckCircle2,
  FastForward,
  Footprints,
  Drum,
  Layers,
  Headphones,
  Church,
  ChevronRight,
} from "lucide-react";
import { KOFI_EMMA_VIDEOS, VIDEO_CATEGORIES, KOFI_EMMA_CHANNEL_URL, type KofiEmmaVideo } from "../data/kofiEmmaVideos";
import { getVideoStudy } from "../services/videoStudyService";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { VideoCard } from "../components/shed/VideoCard";
import { VideoStudySheet } from "../components/shed/VideoStudySheet";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition, type TimeSignature, type Subdivision } from "../audio/meter";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

type FilterValue = "All" | "Favorites" | (typeof VIDEO_CATEGORIES)[number];
type ShedStyle = "Gospel" | "Praise" | "Worship" | "Highlife" | "Afro-Gospel";

interface RandomChallenge {
  title: string;
  meter: TimeSignature;
  style: ShedStyle;
  bpm: number;
  instructions: string;
}

const RANDOM_CHALLENGES: RandomChallenge[] = [
  {
    title: "4/4 Gospel Pocket Challenge",
    meter: "4/4",
    style: "Gospel",
    bpm: 125,
    instructions: "Play 8 bars of solid pocket. Execute a 16th-note linear fill on bar 8 and land clean on beat 1.",
  },
  {
    title: "6/8 Worship Sway & Build",
    meter: "6/8",
    style: "Worship",
    bpm: 95,
    instructions: "Play 4 bars of subtle 6/8 ghost notes, then swell into full open crash hits on bar 5.",
  },
  {
    title: "Highlife Syncopation Drive",
    meter: "4/4",
    style: "Highlife",
    bpm: 115,
    instructions: "Maintain Ghanaian bell timeline on ride bell while cross-sticking clave accents on snare.",
  },
  {
    title: "12/8 Polyrhythmic Lock",
    meter: "12/8",
    style: "Afro-Gospel",
    bpm: 85,
    instructions: "Play 4 compound beats on the kick against 3-beat triplet accents on the hi-hat.",
  },
  {
    title: "Up-Tempo Praise Stamina",
    meter: "4/4",
    style: "Praise",
    bpm: 140,
    instructions: "Hold an unbroken 4-on-the-floor kick with open hi-hat wash for 2 minutes straight.",
  },
];

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

export function Shed() {
  const { user } = useAppContext();
  useLocalDbVersion();
  const online = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<"LAB" | "VIDEOS">("LAB");

  // Shed Lab State
  const [selectedStyle, setSelectedStyle] = useState<ShedStyle>("Gospel");
  const [selectedMeter, setSelectedMeter] = useState<TimeSignature>("4/4");
  const [selectedSubdivision, setSelectedSubdivision] = useState<Subdivision>("quarter");
  const [bpm, setBpm] = useState(110);
  const [sessionMinutes, setSessionMinutes] = useState(10);
  const [silentBarsEnabled, setSilentBarsEnabled] = useState(false);
  const [isShedding, setIsShedding] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState<RandomChallenge | null>(null);

  // Audio & Metronome
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);
  const barCountRef = useRef(0);

  // Video State
  const [filter, setFilter] = useState<FilterValue>("All");
  const [query, setQuery] = useState("");
  const [openVideo, setOpenVideo] = useState<KofiEmmaVideo | null>(null);

  useEffect(() => {
    const audio = new AudioEngine();
    const metro = new MetronomeEngine(audio);
    audioEngineRef.current = audio;
    metronomeRef.current = metro;

    return () => {
      metro.stop();
      audio.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const featured = KOFI_EMMA_VIDEOS[0];

  const filtered = useMemo(() => {
    let list = KOFI_EMMA_VIDEOS;
    if (filter === "Favorites") {
      list = list.filter((v) => getVideoStudy(v.youtubeId).favorite);
    } else if (filter !== "All") {
      list = list.filter((v) => v.category === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.focus.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filter, query]);

  const generateRandomChallenge = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_CHALLENGES.length);
    const challenge = RANDOM_CHALLENGES[randomIndex];
    setActiveChallenge(challenge);
    setSelectedMeter(challenge.meter);
    setSelectedStyle(challenge.style);
    setBpm(challenge.bpm);
  };

  const startShedSession = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    const clamped = clampBpm(bpm);
    const meter = getMeterDefinition(selectedMeter);
    const measure = getMeasureStructure(meter, selectedSubdivision);
    const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));

    barCountRef.current = 0;
    setElapsedSeconds(0);
    setIsShedding(true);

    if (silentBarsEnabled) {
      let currentBar = 1;
      metronomeRef.current.onStep((step) => {
        if (step.index === 0) {
          currentBar = (currentBar % 4) + 1;
          if (currentBar === 4 && audioEngineRef.current) {
            audioEngineRef.current.setVolume(0);
          } else if (audioEngineRef.current) {
            audioEngineRef.current.setVolume(80);
          }
        }
      });
    }

    metronomeRef.current.start(steps, clamped, selectedSubdivision);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= sessionMinutes * 60) {
          stopShedSession();
        }
        return next;
      });
    }, 1000);
  };

  const stopShedSession = () => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsShedding(false);
    if (audioEngineRef.current) audioEngineRef.current.setVolume(80);

    if (elapsedSeconds > 15 && user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P1-E04",
        cleanBpm: bpm,
        accuracy: 92,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        notes: `Shed Session: ${selectedStyle} (${selectedMeter} @ ${bpm} BPM, ${elapsedSeconds}s)`,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
            <Flame className="h-4 w-4" />
            Musician's Suite
          </div>
          <h1 className="mt-1 text-2xl font-black md:text-3xl text-parchment">The Shed Laboratory</h1>
          <p className="mt-1 text-sm text-parchment/60">Freeform practice, interactive trainers, and gospel backing tracks.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl border border-charcoal-700 bg-charcoal-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("LAB")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "LAB" ? "bg-gold-500 text-charcoal-950 shadow" : "text-parchment/60 hover:text-parchment"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Shed Labs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("VIDEOS")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "VIDEOS" ? "bg-gold-500 text-charcoal-950 shadow" : "text-parchment/60 hover:text-parchment"
            }`}
          >
            <Video className="h-4 w-4" />
            Video Study
          </button>
        </div>
      </div>

      {activeTab === "LAB" ? (
        /* ================= SHED LABORATORY ================= */
        <div className="space-y-8">
          {/* Main Lab Console */}
          <div className="rounded-3xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                  {selectedStyle} &middot; {selectedMeter} Meter
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="font-display text-5xl font-black text-parchment md:text-6xl">{bpm}</span>
                  <span className="text-lg font-bold text-gold-400">BPM</span>
                </div>
                <p className="mt-1 text-xs text-parchment/60">
                  Session: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s / {sessionMinutes}m
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {!isShedding ? (
                  <button
                    type="button"
                    onClick={startShedSession}
                    className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gold-500 px-8 py-3.5 text-base font-black text-charcoal-950 shadow-lg shadow-gold-500/20 hover:bg-gold-400 active:scale-95"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    START FREE SHED
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopShedSession}
                    className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-amber-500 px-8 py-3.5 text-base font-black text-charcoal-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 active:scale-95"
                  >
                    <Square className="h-5 w-5 fill-current" />
                    END SHED
                  </button>
                )}

                <button
                  type="button"
                  onClick={generateRandomChallenge}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-charcoal-700 bg-charcoal-800/80 px-4 py-3 text-xs font-bold text-parchment hover:border-gold-500/40"
                >
                  <Shuffle className="h-4 w-4 text-gold-400" />
                  Random Drill
                </button>
              </div>
            </div>

            {/* Active Random Challenge Alert */}
            {activeChallenge && (
              <div className="mt-6 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 shrink-0 text-gold-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase text-gold-400">Drill: {activeChallenge.title}</span>
                    <p className="mt-0.5 text-sm font-semibold text-parchment">{activeChallenge.instructions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Silent Bars Inner Clock Mode */}
            <div className="mt-6 flex items-center justify-between border-t border-charcoal-800 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="silent-bars"
                  checked={silentBarsEnabled}
                  onChange={(e) => setSilentBarsEnabled(e.target.checked)}
                  disabled={isShedding}
                  className="h-4 w-4 rounded accent-gold-500"
                />
                <label htmlFor="silent-bars" className="font-semibold text-parchment/80 cursor-pointer">
                  Inner Clock Test (Mute bar 4 of every 4 bars)
                </label>
              </div>
              <span className="text-parchment/40 hidden sm:inline">Tests internal timing stability</span>
            </div>
          </div>

          {/* Configuration Matrix */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Style Selector */}
            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-parchment/50">1. Musical Style</span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["Gospel", "Praise", "Worship", "Highlife", "Afro-Gospel"] as ShedStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    disabled={isShedding}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      selectedStyle === style
                        ? "bg-gold-500 text-charcoal-950"
                        : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Meter Selector */}
            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-parchment/50">2. Time Signature</span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["4/4", "3/4", "6/8", "12/8", "7/8"] as TimeSignature[]).map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    disabled={isShedding}
                    onClick={() => setSelectedMeter(ts)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      selectedMeter === ts
                        ? "bg-gold-500 text-charcoal-950"
                        : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                    }`}
                  >
                    {ts}
                  </button>
                ))}
              </div>
            </div>

            {/* Tempo Slider */}
            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4">
              <div className="flex justify-between text-xs font-bold uppercase text-parchment/50">
                <span>3. Tempo</span>
                <span className="text-gold-400 font-mono text-sm">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                disabled={isShedding}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="mt-3 w-full accent-gold-500 cursor-pointer"
              />
            </div>

            {/* Session Duration */}
            <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-parchment/50">4. Duration</span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[5, 10, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={isShedding}
                    onClick={() => setSessionMinutes(mins)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      sessionMinutes === mins
                        ? "bg-gold-500 text-charcoal-950"
                        : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= 4 STRUCTURED PEDAGOGICAL LABS ================= */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Specialized Training Laboratories
              </h2>
              <p className="mt-0.5 text-xs text-parchment/60">Targeted tools categorized by musical discipline.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* PILLAR 1: BUILD SPEED */}
              <div className="rounded-3xl border border-charcoal-700 bg-charcoal-900/60 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <FastForward className="h-4 w-4" /> 1. Build Speed & Stamina
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/tempo-builder"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Tempo Builder</h3>
                      <p className="text-xs text-parchment/50">Automated speed ramps and BPM endurance ladders.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/double-bass"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Double Bass School</h3>
                      <p className="text-xs text-parchment/50">Pedal setup, slide double strokes, and speed bursts.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* PILLAR 2: BUILD VOCABULARY */}
              <div className="rounded-3xl border border-charcoal-700 bg-charcoal-900/60 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gold-400 uppercase tracking-wider">
                  <Drum className="h-4 w-4" /> 2. Build Vocabulary & Chops
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/rudiments"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">40 PAS Rudiments</h3>
                      <p className="text-xs text-parchment/50">Rolls, paradiddles, flams, and drags with audio demo.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/fills"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Fill Trainer</h3>
                      <p className="text-xs text-parchment/50">Groove &rarr; Fill &rarr; Return to Groove loop mastery.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* PILLAR 3: BUILD MUSICALITY */}
              <div className="rounded-3xl border border-charcoal-700 bg-charcoal-900/60 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Layers className="h-4 w-4" /> 3. Build Musicality & Flow
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/transitions"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Transition Trainer</h3>
                      <p className="text-xs text-parchment/50">Seamless 4/4 to 6/8 and worship-to-praise energy flow.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/call-and-response"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Call & Response</h3>
                      <p className="text-xs text-parchment/50">Ear-training playback: hear phrases and reproduce them.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* PILLAR 4: BUILD PERFORMANCE */}
              <div className="rounded-3xl border border-charcoal-700 bg-charcoal-900/60 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Church className="h-4 w-4" /> 4. Build Performance & Church Service
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/live-church"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Live Church Simulator</h3>
                      <p className="text-xs text-parchment/50">Service flow, worship drops, and live Music Director cues.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/shed-tracks"
                    className="flex items-center justify-between rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-3.5 hover:border-gold-500/40 transition group"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-parchment group-hover:text-gold-300">Shed Tracks & Stem Mixer</h3>
                      <p className="text-xs text-parchment/50">Full-band backing tracks with drums-mute stem isolation.</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-parchment/40 group-hover:text-gold-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= VIDEO MASTERCLASSES ================= */
        <div className="space-y-6">
          {!online && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
              <WifiOff className="h-4 w-4 shrink-0" />
              Video streaming requires an Internet connection. All procedural drum tools and curriculum work 100% offline.
            </div>
          )}

          <Link
            to="/shed-tracks"
            className="flex items-center gap-3 rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-4 hover:border-gold-500/50 transition"
          >
            <Guitar className="h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-parchment">Shed Tracks & Stem Mixer</h2>
              <p className="text-xs text-parchment/50">Full-band backing tracks. Mute the drums, loop a section, play along.</p>
            </div>
          </Link>

          <section>
            <h2 className="mb-2 text-xs uppercase tracking-widest text-gold-400">Featured Video Study</h2>
            <div className="sm:max-w-xs">
              <VideoCard video={featured} study={getVideoStudy(featured.youtubeId)} onOpen={() => setOpenVideo(featured)} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment/40" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, style, tag..."
                  aria-label="Search videos"
                  className="w-full rounded-xl border border-charcoal-700 bg-charcoal-900/70 py-2 pl-9 pr-3 text-sm placeholder:text-parchment/40 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter videos">
                {(["All", "Favorites", ...VIDEO_CATEGORIES] as FilterValue[]).map((cat) => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={filter === cat}
                    onClick={() => setFilter(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      filter === cat ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-800 text-parchment/70 hover:text-parchment"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((video) => (
                <VideoCard key={video.youtubeId} video={video} study={getVideoStudy(video.youtubeId)} onOpen={() => setOpenVideo(video)} />
              ))}
            </div>
          </section>
        </div>
      )}

      {openVideo && <VideoStudySheet video={openVideo} open={!!openVideo} onClose={() => setOpenVideo(null)} />}
    </div>
  );
}
