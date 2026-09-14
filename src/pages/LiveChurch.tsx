import { useState, useEffect, useRef } from "react";
import { Play, Square, Church, ArrowRight, Volume2, VolumeX, ShieldCheck, Flame, FastForward, CheckCircle2, AlertCircle } from "lucide-react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition, type TimeSignature } from "../audio/meter";
import { useAppContext } from "../context/AppContext";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";

interface ServiceStage {
  id: string;
  name: string;
  meter: TimeSignature;
  bpm: number;
  durationSeconds: number;
  mdCue: string;
  musicalFocus: string;
  drumAction: string;
  intensityLevel: number; // 1 to 5
}

const SERVICE_SCENARIO: ServiceStage[] = [
  {
    id: "stage-1",
    name: "1. Praise Start (Opening Anthems)",
    meter: "4/4",
    bpm: 120,
    durationSeconds: 25,
    mdCue: "4-stick count-in! Launch the praise service with solid authority.",
    musicalFocus: "Set the tempo rock-solid. Keep the kick on 1 & 3 and crisp snare rimshot on 2 & 4.",
    drumAction: "Solid 4/4 Praise Foundation on Hi-Hat & Kick",
    intensityLevel: 3,
  },
  {
    id: "stage-2",
    name: "2. The Build (Congregation Rejoicing)",
    meter: "4/4",
    bpm: 130,
    durationSeconds: 25,
    mdCue: "Drive the momentum! Move to Ride cymbal bell.",
    musicalFocus: "Gradual energy rise. Add double kick syncopation and open the hi-hat slightly.",
    drumAction: "Ride Cymbal Bell + Syncopated Kick Doubles",
    intensityLevel: 4,
  },
  {
    id: "stage-3",
    name: "3. High Energy Climax (Praise Peak)",
    meter: "4/4",
    bpm: 140,
    durationSeconds: 20,
    mdCue: "Full praise celebration! 4-bar turnaround fill into peak!",
    musicalFocus: "Maximum drive! Keep the snare cutting and execute linear bursts on phrase ends.",
    drumAction: "Full Open Wash + Fast Gospel Linear Fills",
    intensityLevel: 5,
  },
  {
    id: "stage-4",
    name: "4. The Clean Drop (Vocal Spontaneous)",
    meter: "4/4",
    bpm: 120,
    durationSeconds: 20,
    mdCue: "Drop! Drop! Lead singer is speaking spontaneously.",
    musicalFocus: "Instantly drop volume. Switch to cross-stick on snare with feathered kick.",
    drumAction: "Cross-stick + Soft Closed Hi-Hat (Quiet Pocket)",
    intensityLevel: 2,
  },
  {
    id: "stage-5",
    name: "5. Worship Transition (Deep Reverence)",
    meter: "4/4",
    bpm: 78,
    durationSeconds: 30,
    mdCue: "Shift to slow worship. Key of F minor.",
    musicalFocus: "Lay back on the beat. Let keyboard pads breathe. Soft cymbal swells on 1.",
    drumAction: "Slow Gospel Worship Groove + Mallet Swells",
    intensityLevel: 1,
  },
  {
    id: "stage-6",
    name: "6. 6/8 African Gospel Shift",
    meter: "6/8",
    bpm: 90,
    durationSeconds: 25,
    mdCue: "Transition to 6/8 compound meter! Worship leader is chanting.",
    musicalFocus: "Count 'ONE-two-three TWO-two-three'. Deep snare placement on beat 4.",
    drumAction: "African 6/8 Compound Worship Sway",
    intensityLevel: 3,
  },
  {
    id: "stage-7",
    name: "7. Return to 4/4 Anthem",
    meter: "4/4",
    bpm: 110,
    durationSeconds: 20,
    mdCue: "Back to 4/4! Preparing for service altar call.",
    musicalFocus: "Clean metric transition back into straight 4/4 without hesitation.",
    drumAction: "Straight 4/4 Medium Gospel Pocket",
    intensityLevel: 3,
  },
  {
    id: "stage-8",
    name: "8. Clean Ending (Big Hit & Choke)",
    meter: "4/4",
    bpm: 110,
    durationSeconds: 15,
    mdCue: "Watch the MD hands for the cutoff on 1... STOP!",
    musicalFocus: "Hit crash + kick together and immediately choke the cymbals. Absolute silence.",
    drumAction: "Final Crash Accent & Instant Cymbal Choke",
    intensityLevel: 4,
  },
];

export function LiveChurch() {
  const { user } = useAppContext();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [stageSecondsRemaining, setStageSecondsRemaining] = useState(SERVICE_SCENARIO[0].durationSeconds);
  const [totalServiceSeconds, setTotalServiceSeconds] = useState(0);
  const [isServiceCompleted, setIsServiceCompleted] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  const activeStage = SERVICE_SCENARIO[currentStageIndex];

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

  const playStageMetronome = (stage: ServiceStage) => {
    if (!metronomeRef.current) return;
    const meter = getMeterDefinition(stage.meter);
    const measure = getMeasureStructure(meter, stage.meter === "4/4" ? "quarter" : "triplet");
    const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));
    metronomeRef.current.start(steps, stage.bpm, stage.meter === "4/4" ? "quarter" : "triplet");
  };

  const startService = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    setCurrentStageIndex(0);
    setStageSecondsRemaining(SERVICE_SCENARIO[0].durationSeconds);
    setTotalServiceSeconds(0);
    setIsActive(true);
    setIsServiceCompleted(false);

    playStageMetronome(SERVICE_SCENARIO[0]);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTotalServiceSeconds((prev) => prev + 1);

      setStageSecondsRemaining((prevSec) => {
        if (prevSec <= 1) {
          // Advance to next stage!
          setCurrentStageIndex((prevIdx) => {
            const nextIdx = prevIdx + 1;
            if (nextIdx >= SERVICE_SCENARIO.length) {
              // Service complete!
              stopService(true);
              return prevIdx;
            }
            const nextStage = SERVICE_SCENARIO[nextIdx];
            playStageMetronome(nextStage);
            return nextIdx;
          });
          const nextIdx = Math.min(SERVICE_SCENARIO.length - 1, currentStageIndex + 1);
          return SERVICE_SCENARIO[nextIdx].durationSeconds;
        }
        return prevSec - 1;
      });
    }, 1000);
  };

  const stopService = (completed = false) => {
    if (metronomeRef.current) metronomeRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    if (completed) {
      setIsServiceCompleted(true);
    }

    if (totalServiceSeconds > 20 && user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P8-E07", // Live Church MD Cues
        cleanBpm: 120,
        accuracy: completed ? 96 : 90,
        durationMinutes: Math.max(1, Math.round(totalServiceSeconds / 60)),
        notes: `Live Church Simulator: ${currentStageIndex + 1}/${SERVICE_SCENARIO.length} stages completed (${totalServiceSeconds}s)`,
      });
    }
  };

  const totalScenarioDuration = SERVICE_SCENARIO.reduce((sum, s) => sum + s.durationSeconds, 0);
  const globalProgress = Math.min(100, Math.round((totalServiceSeconds / totalScenarioDuration) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Church className="h-4 w-4" />
          Signature Real-World Simulator
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Live Church Simulator</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Step into a live Ghanaian gospel service. Respond in real time to dynamic shifts, Music Director cues, vocal drops, and compound transitions.
        </p>
      </div>

      {/* Main Stage Console */}
      <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
              Stage {currentStageIndex + 1} of {SERVICE_SCENARIO.length}
            </span>
            <h2 className="text-2xl font-black text-parchment md:text-3xl">{activeStage.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-md bg-gold-500/20 px-2.5 py-1 font-bold text-gold-300">
                {activeStage.meter} Meter
              </span>
              <span className="rounded-md bg-charcoal-800 px-2.5 py-1 font-bold text-parchment">
                {activeStage.bpm} BPM
              </span>
              <span className="text-parchment/60">
                Stage Time: <strong className="text-parchment">{stageSecondsRemaining}s</strong> remaining
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isActive ? (
              <button
                type="button"
                onClick={startService}
                className="flex min-h-[54px] items-center justify-center gap-3 rounded-xl bg-gold-500 px-8 py-3.5 text-base font-bold text-charcoal-950 shadow-lg shadow-gold-500/20 hover:bg-gold-400 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                START LIVE SERVICE
              </button>
            ) : (
              <button
                type="button"
                onClick={() => stopService(false)}
                className="flex min-h-[54px] items-center justify-center gap-3 rounded-xl bg-danger px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95"
              >
                <Square className="h-5 w-5 fill-current" />
                END SERVICE
              </button>
            )}
          </div>
        </div>

        {/* Live MD Cue Banner */}
        <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Music Director Cue:
              </span>
              <p className="mt-1 text-base font-bold text-parchment md:text-lg">"{activeStage.mdCue}"</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-parchment/80">
                <div>
                  <span className="text-parchment/50">Required Action:</span>{" "}
                  <strong className="text-gold-300">{activeStage.drumAction}</strong>
                </div>
                <div>
                  <span className="text-parchment/50">Intensity:</span>{" "}
                  <strong className="text-amber-300">{"★".repeat(activeStage.intensityLevel)}{"☆".repeat(5 - activeStage.intensityLevel)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Musical Coaching Focus */}
        <div className="mt-4 rounded-xl border border-charcoal-800 bg-charcoal-950/70 p-4 text-xs text-parchment/80">
          <strong className="text-gold-400">Musicality Guidance:</strong> {activeStage.musicalFocus}
        </div>

        {/* Global Service Progress Bar */}
        <div className="mt-6 border-t border-charcoal-800 pt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-parchment/60">Overall Service Flow</span>
            <span className="text-gold-400">{globalProgress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-charcoal-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 via-amber-400 to-gold-400 transition-all duration-500"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {isServiceCompleted && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold">Service Successfully Completed!</p>
              <p className="text-xs text-success/80">You navigated all 8 live church transitions with professional musicality.</p>
            </div>
          </div>
        )}
      </div>

      {/* Service Roadmap Steps */}
      <div className="space-y-3 rounded-2xl border border-charcoal-800 bg-charcoal-900/60 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Service Scenario Flow</h3>
        <div className="grid gap-2.5">
          {SERVICE_SCENARIO.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex && isActive;
            const isPast = idx < currentStageIndex && isActive;

            return (
              <div
                key={stage.id}
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 text-xs transition-all sm:flex-row sm:items-center ${
                  isCurrent
                    ? "border-gold-500 bg-gold-500/15 ring-2 ring-gold-500"
                    : isPast
                    ? "border-success/40 bg-success/5 opacity-70"
                    : "border-charcoal-800 bg-charcoal-900/40 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full font-bold ${
                    isCurrent ? "bg-gold-500 text-charcoal-950" : isPast ? "bg-success text-white" : "bg-charcoal-800 text-parchment/50"
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-parchment">{stage.name}</span>
                    <p className="text-[11px] text-parchment/60">{stage.drumAction}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <span className="font-semibold text-gold-400">{stage.meter}</span>
                  <span className="font-semibold text-parchment">{stage.bpm} BPM</span>
                  <span className="text-parchment/40">{stage.durationSeconds}s</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
