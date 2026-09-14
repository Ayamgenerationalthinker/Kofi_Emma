import { useState, useEffect, useRef } from "react";
import { Play, Square, Headphones, Mic, Volume2, RotateCcw, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition } from "../audio/meter";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

interface PhraseChallenge {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  meter: string;
  bpm: number;
  sticking: string;
  notation: string;
  description: string;
}

const PHRASE_LIBRARY: PhraseChallenge[] = [
  {
    id: "call-1",
    title: "Gospel Syncopated Call (4/4)",
    difficulty: "Beginner",
    meter: "4/4",
    bpm: 90,
    sticking: "K H L H K K L H",
    notation: "Kick 1 & 3+, Snare 2 & 4 with 8th hi-hats",
    description: "Classic syncopated church bounce. Listen to the kick double on beat 3.",
  },
  {
    id: "call-2",
    title: "Ghanaian Highlife Bell Timeline",
    difficulty: "Intermediate",
    meter: "4/4",
    bpm: 110,
    sticking: "R REST R R REST R REST R",
    notation: "Standard Ghanaian 7-stroke bell ostinato on Ride",
    description: "Listen for the asymmetric rhythm: 1, (2)&, 3, (4)&. Match the bounce.",
  },
  {
    id: "call-3",
    title: "6/8 Compound African Worship",
    difficulty: "Intermediate",
    meter: "6/8",
    bpm: 85,
    sticking: "K H H L H H",
    notation: "Pulse 1 Kick, Pulse 4 Snare Backbeat",
    description: "Listen to the rolling triplet sway. Replicate the emotional snare landing on pulse 4.",
  },
  {
    id: "call-4",
    title: "Linear Gospel Chop (Hand-Foot-Foot)",
    difficulty: "Advanced",
    meter: "4/4",
    bpm: 115,
    sticking: "R L K K R L K K",
    notation: "16th-note linear cascade across snare and kick",
    description: "Focus on clean note separation without overlapping strokes.",
  },
];

export function CallAndResponse() {
  const { user } = useAppContext();
  const [selectedPhrase, setSelectedPhrase] = useState<PhraseChallenge>(PHRASE_LIBRARY[0]);
  const [stage, setStage] = useState<"IDLE" | "LISTEN" | "YOUR_TURN" | "EVALUATE">("IDLE");
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const stepTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new AudioEngine();
    const metro = new MetronomeEngine(audio);
    audioEngineRef.current = audio;
    metronomeRef.current = metro;

    return () => {
      metro.stop();
      audio.dispose();
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    };
  }, []);

  const playCall = async () => {
    if (!audioEngineRef.current || !metronomeRef.current) return;
    await audioEngineRef.current.resume();

    setStage("LISTEN");
    setSelfScore(null);

    // Play 2 bars of the phrase as the "CALL"
    const quarter = 60 / selectedPhrase.bpm;
    const barDuration = selectedPhrase.meter === "6/8" ? (quarter / 3) * 6 : quarter * 4;
    const totalCallDurationMs = barDuration * 2 * 1000;

    const steps = [{ index: 0, clickType: "PRIMARY" as const }, { index: 1, clickType: "SOFT" as const }, { index: 2, clickType: "SECONDARY" as const }, { index: 3, clickType: "SOFT" as const }];
    metronomeRef.current.start(steps, selectedPhrase.bpm, "quarter");

    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    stepTimeoutRef.current = window.setTimeout(() => {
      // Transition to YOUR TURN (RESPONSE)
      setStage("YOUR_TURN");
      // Keep click playing for response duration
      stepTimeoutRef.current = window.setTimeout(() => {
        if (metronomeRef.current) metronomeRef.current.stop();
        setStage("EVALUATE");
      }, totalCallDurationMs);
    }, totalCallDurationMs);
  };

  const handleScoreResponse = (score: number) => {
    setSelfScore(score);
    setCompletedCount((c) => c + 1);

    if (user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P1-E04",
        cleanBpm: selectedPhrase.bpm,
        accuracy: score,
        durationMinutes: 1,
        notes: `Call & Response: ${selectedPhrase.title} (Self-rated: ${score}%)`,
      });
    }
  };

  const resetChallenge = () => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    setStage("IDLE");
    setSelfScore(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Headphones className="h-4 w-4" />
          Ear Training & Instant Memory
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Call & Response</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Listen to the rhythmic phrase (The Call), internalize its pulse, and immediately reproduce it on your kit (The Response).
        </p>
      </div>

      {/* Main Call & Response Interactive Stage */}
      <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Current Challenge</span>
            <h2 className="text-2xl font-black text-parchment">{selectedPhrase.title}</h2>
            <p className="mt-1 text-xs text-parchment/60">{selectedPhrase.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-md bg-charcoal-800 px-3 py-1.5 text-xs font-bold text-gold-300">
              {selectedPhrase.meter} @ {selectedPhrase.bpm} BPM
            </span>
          </div>
        </div>

        {/* Dynamic Stage Banner */}
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-charcoal-800 bg-charcoal-950/80 p-8 text-center">
          {stage === "IDLE" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-400">
                <Volume2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-parchment">Ready for the Call?</h3>
                <p className="mt-1 text-xs text-parchment/60">The coach will play 2 bars. Listen closely to the sticking and pocket.</p>
              </div>
              <button
                type="button"
                onClick={playCall}
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-3 font-bold text-charcoal-950 hover:bg-gold-400 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                PLAY CALL PHRASE
              </button>
            </div>
          )}

          {stage === "LISTEN" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/20 text-gold-400 animate-pulse">
                <Headphones className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-400">Step 1: Listen Closely</span>
                <h3 className="mt-1 text-2xl font-black text-parchment">THE COACH IS PLAYING...</h3>
                <p className="mt-2 font-mono text-sm text-gold-300">{selectedPhrase.sticking}</p>
              </div>
            </div>
          )}

          {stage === "YOUR_TURN" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-4 ring-amber-400/40 animate-bounce">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Step 2: Response</span>
                <h3 className="mt-1 text-2xl font-black text-amber-300">YOUR TURN! PLAY THE PHRASE!</h3>
                <p className="mt-1 text-xs text-parchment/70">Reproduce the groove with the same dynamics and tempo.</p>
              </div>
            </div>
          )}

          {stage === "EVALUATE" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-parchment">How was your response?</h3>
                <p className="mt-1 text-xs text-parchment/60">Self-evaluate your timing accuracy, limb separation, and pocket:</p>
              </div>

              {selfScore === null ? (
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleScoreResponse(70)}
                    className="rounded-lg border border-charcoal-700 bg-charcoal-800 px-4 py-2 text-xs font-semibold text-parchment/80 hover:border-charcoal-600"
                  >
                    Stumbled (70%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScoreResponse(85)}
                    className="rounded-lg border border-gold-600/40 bg-gold-500/10 px-4 py-2 text-xs font-bold text-gold-300 hover:bg-gold-500/20"
                  >
                    Good Pocket (85%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScoreResponse(98)}
                    className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
                  >
                    Locked Clean (98%)
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-bold text-gold-400">Recorded: {selfScore}% Precision Score</p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={playCall}
                      className="rounded-lg bg-gold-500 px-5 py-2 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={resetChallenge}
                      className="rounded-lg border border-charcoal-700 px-4 py-2 text-xs text-parchment/60 hover:text-parchment"
                    >
                      Next Phrase
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phrase Library Selection */}
      <div className="space-y-3 rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Challenge Library</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PHRASE_LIBRARY.map((phrase) => {
            const isSelected = selectedPhrase.id === phrase.id;
            return (
              <button
                key={phrase.id}
                type="button"
                onClick={() => {
                  setSelectedPhrase(phrase);
                  resetChallenge();
                }}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-gold-500 bg-gold-500/10 shadow-md"
                    : "border-charcoal-700 bg-charcoal-800/40 hover:border-charcoal-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gold-400">{phrase.difficulty}</span>
                    <span className="text-parchment/40">{phrase.meter} &middot; {phrase.bpm} BPM</span>
                  </div>
                  <h4 className="mt-1.5 text-base font-bold text-parchment">{phrase.title}</h4>
                  <p className="mt-1 font-mono text-xs text-parchment/60">{phrase.sticking}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
