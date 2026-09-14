import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Square,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { getRudimentById } from "../data/rudiments";
import { RudimentAudioEngine, type RudimentPlayMode } from "../audio/RudimentAudioEngine";
import { AudioEngine } from "../audio/AudioEngine";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";
import { EmptyState } from "../components/StatusStates";

export function RudimentDetail() {
  const { rudimentId } = useParams<{ rudimentId: string }>();
  const rudiment = rudimentId ? getRudimentById(rudimentId) : undefined;

  if (!rudiment) {
    return (
      <div className="space-y-4">
        <Link to="/rudiments" className="inline-flex items-center gap-1 text-xs text-parchment/60 hover:text-gold-400">
          <ArrowLeft className="h-4 w-4" /> Back to 40 Rudiments School
        </Link>
        <EmptyState message="The requested PAS rudiment could not be found." />
      </div>
    );
  }

  return <RudimentPracticeStudio rudiment={rudiment} />;
}

function RudimentPracticeStudio({ rudiment }: { rudiment: NonNullable<ReturnType<typeof getRudimentById>> }) {
  const { user } = useAppContext();
  const [bpm, setBpm] = useState(rudiment.defaultBpm);
  const [useLeftLead, setUseLeftLead] = useState(false);
  const [mode, setMode] = useState<RudimentPlayMode>("LISTEN");
  const [countInBars, setCountInBars] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStrokeIndex, setActiveStrokeIndex] = useState(-1);
  const [countInBeat, setCountInBeat] = useState<number | null>(null);

  // Practice Timer
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const rudimentEngineRef = useRef<RudimentAudioEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new AudioEngine();
    const engine = new RudimentAudioEngine(audio);
    audioEngineRef.current = audio;
    rudimentEngineRef.current = engine;

    engine.onStep((step) => {
      if (step.isCountIn) {
        setActiveStrokeIndex(-1);
        setCountInBeat(step.countInBeat ?? null);
      } else {
        setCountInBeat(null);
        setActiveStrokeIndex(step.strokeIndex);
      }
    });

    return () => {
      engine.stop();
      engine.dispose();
      audio.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startPlayback = async () => {
    if (!rudimentEngineRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    setActiveStrokeIndex(-1);
    setCountInBeat(null);
    setIsPlaying(true);
    setSessionCompleted(false);

    await rudimentEngineRef.current.start(rudiment, bpm, mode, countInBars, useLeftLead);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setPracticeSeconds((s) => s + 1);
    }, 1000);
  };

  const stopPlayback = () => {
    if (rudimentEngineRef.current) {
      rudimentEngineRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setActiveStrokeIndex(-1);
    setCountInBeat(null);
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(rudiment.minBpm, Math.min(rudiment.maxBpm, newBpm));
    setBpm(clamped);
    if (rudimentEngineRef.current) {
      rudimentEngineRef.current.setBpm(clamped);
    }
  };

  const handleModeChange = (newMode: RudimentPlayMode) => {
    setMode(newMode);
    if (rudimentEngineRef.current) {
      rudimentEngineRef.current.setMode(newMode);
    }
  };

  const handleLogPractice = () => {
    if (!user) return;
    recordAttempt({
      clientAttemptId: newId(),
      exerciseId: "P1-E04",
      cleanBpm: bpm,
      accuracy: 94,
      durationMinutes: Math.max(1, Math.round(practiceSeconds / 60)),
      notes: `PAS #${rudiment.number} ${rudiment.name} (${mode} mode @ ${bpm} BPM, ${practiceSeconds}s)`,
    });
    setSessionCompleted(true);
  };

  const activeStrokes = useLeftLead && rudiment.alternateStrokes ? rudiment.alternateStrokes : rudiment.strokes;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/rudiments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-parchment/60 hover:text-gold-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to 40 Rudiments
        </Link>
        <span className="rounded-full border border-gold-600/40 bg-gold-500/10 px-3 py-0.5 text-xs font-mono font-bold text-gold-300">
          PAS #{rudiment.number} &middot; {rudiment.categoryLabel}
        </span>
      </div>

      {/* Main Studio Card */}
      <section className="relative overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-charcoal-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline">
          <div>
            <h1 className="text-2xl font-black text-parchment md:text-3xl">{rudiment.name}</h1>
            <p className="mt-1 text-xs text-parchment/60">
              Subdivision: <strong className="text-gold-300">{rudiment.subdivision}</strong> &middot; Meter: <strong className="text-gold-300">{rudiment.timeSignature}</strong>
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl border border-charcoal-700 bg-charcoal-950/80 p-1">
            <button
              type="button"
              onClick={() => handleModeChange("LISTEN")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                mode === "LISTEN" ? "bg-gold-500 text-charcoal-950" : "text-parchment/60 hover:text-parchment",
              ].join(" ")}
            >
              Mode A: Listen
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("METRONOME_AND_RUDIMENT")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                mode === "METRONOME_AND_RUDIMENT" ? "bg-gold-500 text-charcoal-950" : "text-parchment/60 hover:text-parchment",
              ].join(" ")}
            >
              Mode B: Metro + Demo
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("PRACTICE")}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                mode === "PRACTICE" ? "bg-gold-500 text-charcoal-950" : "text-parchment/60 hover:text-parchment",
              ].join(" ")}
            >
              Mode C: Practice (Mute)
            </button>
          </div>
        </div>

        {/* Count-In Banner if active */}
        {countInBeat !== null && (
          <div className="mt-6 flex items-center justify-center rounded-2xl border border-gold-500 bg-gold-500/20 py-4 text-center animate-pulse">
            <span className="font-display text-4xl font-black text-gold-300">
              COUNT-IN: {countInBeat}
            </span>
          </div>
        )}

        {/* Interactive Sticking Notation Grid */}
        <div className="mt-6 rounded-2xl border border-charcoal-800 bg-charcoal-950/90 p-6">
          <div className="flex items-center justify-between text-xs text-parchment/50">
            <span>Sticking Pattern ({useLeftLead ? "Left Lead" : "Right Lead"})</span>
            {rudiment.alternateStrokes && (
              <button
                type="button"
                onClick={() => setUseLeftLead(!useLeftLead)}
                className="font-bold text-gold-400 hover:text-gold-300 underline"
              >
                Switch to {useLeftLead ? "Right" : "Left"} Lead
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {activeStrokes.map((stroke, idx) => {
              const isActive = activeStrokeIndex === idx;
              const isAccent = stroke.accent;
              const isGrace = stroke.grace;
              const isDiddle = stroke.diddle;

              return (
                <div
                  key={idx}
                  className={[
                    "flex flex-col items-center justify-center rounded-xl border transition-all duration-100",
                    isGrace ? "h-12 w-9 sm:h-14 sm:w-11" : "h-16 w-12 sm:h-20 sm:w-16",
                    isActive
                      ? "scale-110 border-gold-400 bg-gold-500/30 shadow-lg shadow-gold-500/30 text-gold-300"
                      : isAccent
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                      : "border-charcoal-700 bg-charcoal-900/70 text-parchment",
                  ].join(" ")}
                >
                  {isAccent && <span className="text-[10px] font-bold text-amber-400">&gt;</span>}
                  <span className={[
                    "font-display font-black",
                    isGrace ? "text-sm sm:text-base" : "text-xl sm:text-2xl",
                  ].join(" ")}>
                    {stroke.hand}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-parchment/40">
                    {isGrace ? "grace" : isDiddle ? "diddle" : isAccent ? "accent" : "tap"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Tempo & Transport Controls */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* BPM Adjustment */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-parchment/60">Practice Tempo</span>
              <span className="font-mono text-lg font-black text-gold-400">{bpm} BPM</span>
            </div>

            <input
              type="range"
              min={rudiment.minBpm}
              max={rudiment.maxBpm}
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-charcoal-800 accent-gold-500"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleBpmChange(bpm + delta)}
                  className="rounded-lg border border-charcoal-700 bg-charcoal-800 px-2.5 py-1 text-xs font-bold text-parchment/80 hover:border-gold-500/40"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}

              {[60, 80, 100, 120].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleBpmChange(preset)}
                  className={[
                    "rounded-lg px-2.5 py-1 text-xs font-bold",
                    bpm === preset ? "bg-gold-500 text-charcoal-950" : "bg-charcoal-800/60 text-parchment/50 hover:text-parchment",
                  ].join(" ")}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Count-In & Transport Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-900/60 px-3 py-2 text-xs">
              <span className="text-parchment/50">Count-In:</span>
              {[0, 1, 2].map((bars) => (
                <button
                  key={bars}
                  type="button"
                  onClick={() => setCountInBars(bars)}
                  className={[
                    "rounded px-2 py-0.5 font-bold",
                    countInBars === bars ? "bg-gold-500 text-charcoal-950" : "text-parchment/60 hover:text-parchment",
                  ].join(" ")}
                >
                  {bars === 0 ? "Off" : `${bars} Bar`}
                </button>
              ))}
            </div>

            {isPlaying ? (
              <button
                type="button"
                onClick={stopPlayback}
                className="flex min-h-[50px] items-center gap-2 rounded-2xl bg-amber-500 px-8 py-3 text-sm font-black text-charcoal-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400"
              >
                <Square className="h-5 w-5 fill-current" />
                STOP
              </button>
            ) : (
              <button
                type="button"
                onClick={startPlayback}
                className="flex min-h-[50px] items-center gap-2 rounded-2xl bg-gold-500 px-8 py-3 text-sm font-black text-charcoal-950 shadow-lg shadow-gold-500/20 hover:bg-gold-400"
              >
                <Play className="h-5 w-5 fill-current" />
                START {mode === "PRACTICE" ? "PRACTICE" : "DEMO"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Educational Deep Dive Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Evenness & Spacing */}
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400">Evenness & Sound Quality</h3>
          <p className="mt-2 text-sm text-parchment leading-relaxed">{rudiment.evennessTip}</p>
        </div>

        {/* Drum Kit Application */}
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400">Drum Set Application</h3>
          <p className="mt-2 text-sm text-parchment leading-relaxed">{rudiment.kitApplication}</p>
        </div>
      </div>

      {/* Challenge & Practice Logger */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-6 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400">Mastery Target</span>
          <h4 className="mt-1 text-base font-bold text-parchment">{rudiment.challengeTarget}</h4>
          <p className="mt-0.5 text-xs text-parchment/60">
            Session timer: <strong className="text-parchment">{Math.floor(practiceSeconds / 60)}m {practiceSeconds % 60}s</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogPractice}
          disabled={sessionCompleted}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-2.5 text-xs font-bold text-charcoal-950 shadow hover:bg-gold-400 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          {sessionCompleted ? "SESSION RECORDED" : "LOG PRACTICE SESSION"}
        </button>
      </section>

      {/* Verified External Video Resource */}
      <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase text-parchment/40">Verified External Resource</span>
            <h4 className="text-sm font-bold text-parchment">Drumeo 40 Rudiments Video Guide & Demonstration</h4>
            <p className="mt-0.5 text-xs text-parchment/60">
              Source: Drumeo &middot; External video hosted by YouTube (Internet connection required).
            </p>
          </div>
          <a
            href="https://www.youtube.com/watch?v=wX-y8a6VjFw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-800 px-4 py-2 text-xs font-bold text-gold-400 hover:border-gold-500/50 hover:bg-charcoal-700 shrink-0"
          >
            WATCH ON YOUTUBE <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
