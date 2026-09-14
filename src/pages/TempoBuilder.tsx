import { useState, useEffect, useRef } from "react";
import { Play, Square, FastForward, RotateCcw, Volume2, VolumeX, ShieldCheck, Flame, ArrowUpRight } from "lucide-react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm } from "../audio/MetronomeEngine";
import { getMeasureStructure, getMeterDefinition, type TimeSignature, type Subdivision } from "../audio/meter";
import { recordAttempt } from "../services/performanceAnalysisService";
import { newId } from "../lib/localDb";
import { useAppContext } from "../context/AppContext";

export function TempoBuilder() {
  const { user } = useAppContext();
  const [startBpm, setStartBpm] = useState(80);
  const [targetBpm, setTargetBpm] = useState(130);
  const [stepBpm, setStepBpm] = useState(5);
  const [stepIntervalSeconds, setStepIntervalSeconds] = useState(30);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>("4/4");
  const [subdivision, setSubdivision] = useState<Subdivision>("quarter");

  const [currentBpm, setCurrentBpm] = useState(80);
  const [highestBpm, setHighestBpm] = useState(80);
  const [isActive, setIsActive] = useState(false);
  const [secondsRemainingInStep, setSecondsRemainingInStep] = useState(30);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const metronomeRef = useRef<MetronomeEngine | null>(null);
  const timerRef = useRef<number | null>(null);

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

  const totalSteps = Math.max(1, Math.floor((targetBpm - startBpm) / stepBpm) + 1);

  const startSession = async () => {
    if (!metronomeRef.current || !audioEngineRef.current) return;
    await audioEngineRef.current.resume();

    const bpm = clampBpm(startBpm);
    setCurrentBpm(bpm);
    setHighestBpm(bpm);
    setSecondsRemainingInStep(stepIntervalSeconds);
    setTotalSecondsElapsed(0);
    setCurrentStepNumber(1);
    setIsActive(true);
    setIsCompleted(false);

    const meter = getMeterDefinition(timeSignature);
    const measure = getMeasureStructure(meter, subdivision);
    const steps = measure.map((m) => ({ index: m.position, clickType: m.accentType }));

    metronomeRef.current.start(steps, bpm, subdivision);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);
      setSecondsRemainingInStep((prevSec) => {
        if (prevSec <= 1) {
          // Time to bump tempo!
          setCurrentBpm((prevBpm) => {
            const next = Math.min(targetBpm, prevBpm + stepBpm);
            setHighestBpm((h) => Math.max(h, next));
            if (metronomeRef.current) {
              metronomeRef.current.setBpm(next);
            }
            if (next >= targetBpm && prevBpm + stepBpm >= targetBpm) {
              // Reached the peak!
              setIsCompleted(true);
            }
            return next;
          });
          setCurrentStepNumber((s) => Math.min(totalSteps, s + 1));
          return stepIntervalSeconds;
        }
        return prevSec - 1;
      });
    }, 1000);
  };

  const stopSession = () => {
    if (metronomeRef.current) {
      metronomeRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);

    // Record session data if practiced for more than 10 seconds
    if (totalSecondsElapsed > 10 && user) {
      recordAttempt({
        clientAttemptId: newId(),
        exerciseId: "P1-E04", // General timing attempt
        cleanBpm: highestBpm,
        accuracy: 92,
        durationMinutes: Math.max(1, Math.round(totalSecondsElapsed / 60)),
        notes: `Tempo Builder: ${startBpm} -> ${highestBpm} BPM (${totalSecondsElapsed}s)`,
      });
    }
  };

  const toggleMute = () => {
    if (!audioEngineRef.current) return;
    if (soundMuted) {
      audioEngineRef.current.setVolume(80);
      setSoundMuted(false);
    } else {
      audioEngineRef.current.setVolume(0);
      setSoundMuted(true);
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentBpm - startBpm) / Math.max(1, targetBpm - startBpm)) * 100));
  const stepPercent = Math.round(((stepIntervalSeconds - secondsRemainingInStep) / stepIntervalSeconds) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <FastForward className="h-4 w-4" />
          Speed & Stamina Accelerator
        </div>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Tempo Builder</h1>
        <p className="mt-1 text-sm text-parchment/60">
          Build speed cleanly. Start comfortably and let the metronome gradually ramp tempo every interval.
        </p>
      </div>

      {/* Main Visualizer Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-gold-400/80">Current Tempo</span>
            <div className="flex items-baseline justify-center gap-2 md:justify-start">
              <span className="font-display text-6xl font-black text-parchment md:text-7xl">{currentBpm}</span>
              <span className="text-lg font-bold text-gold-400">BPM</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-parchment/60 md:justify-start">
              <span>Start: <strong className="text-parchment">{startBpm}</strong></span>
              <span>Target: <strong className="text-gold-400">{targetBpm}</strong></span>
              <span>Step: <strong className="text-parchment">+{stepBpm} BPM</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Step Countdown Gauge */}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-charcoal-800 bg-charcoal-950/80">
              <div
                className="absolute inset-0 rounded-full border-4 border-gold-500 transition-all duration-1000"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${stepPercent > 25 ? "100% 0%," : ""}${stepPercent > 50 ? "100% 100%," : ""}${stepPercent > 75 ? "0% 100%," : ""}0% 0%)`,
                }}
              />
              <div className="text-center">
                <span className="text-xs text-parchment/50">Next bump in</span>
                <p className="font-display text-2xl font-bold text-gold-300">{secondsRemainingInStep}s</p>
              </div>
            </div>
            <span className="text-[11px] text-parchment/40">Step {currentStepNumber} of {totalSteps}</span>
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-3">
            {!isActive ? (
              <button
                type="button"
                onClick={startSession}
                className="flex min-h-[54px] items-center justify-center gap-3 rounded-xl bg-gold-500 px-8 py-3.5 text-base font-bold text-charcoal-950 shadow-lg shadow-gold-500/20 transition-all hover:bg-gold-400 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                START TEMPO LADDER
              </button>
            ) : (
              <button
                type="button"
                onClick={stopSession}
                className="flex min-h-[54px] items-center justify-center gap-3 rounded-xl bg-danger px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-danger/20 transition-all hover:opacity-90 active:scale-95"
              >
                <Square className="h-5 w-5 fill-current" />
                STOP SESSION
              </button>
            )}

            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center justify-center gap-2 rounded-lg border border-charcoal-700 bg-charcoal-800/60 py-2 text-xs font-semibold text-parchment/70 hover:text-parchment"
            >
              {soundMuted ? <VolumeX className="h-4 w-4 text-danger" /> : <Volume2 className="h-4 w-4 text-gold-400" />}
              {soundMuted ? "Audio Muted" : "Click Active"}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-8 border-t border-charcoal-800 pt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-parchment/60">Ladder Progress</span>
            <span className="text-gold-400">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-charcoal-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isCompleted && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-3.5 text-sm font-semibold text-success">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>Target tempo achieved! You reached {targetBpm} BPM with clean consistency.</span>
          </div>
        )}
      </div>

      {/* Live Session Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-4">
          <span className="text-xs uppercase tracking-wider text-parchment/40">Peak BPM</span>
          <p className="mt-1 font-display text-2xl font-bold text-gold-300">{highestBpm}</p>
        </div>
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-4">
          <span className="text-xs uppercase tracking-wider text-parchment/40">Time Elapsed</span>
          <p className="mt-1 font-display text-2xl font-bold text-parchment">
            {Math.floor(totalSecondsElapsed / 60)}m {totalSecondsElapsed % 60}s
          </p>
        </div>
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-4">
          <span className="text-xs uppercase tracking-wider text-parchment/40">Meter</span>
          <p className="mt-1 font-display text-2xl font-bold text-parchment">{timeSignature}</p>
        </div>
        <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/60 p-4">
          <span className="text-xs uppercase tracking-wider text-parchment/40">Subdivision</span>
          <p className="mt-1 font-display text-2xl font-bold capitalize text-parchment">{subdivision}</p>
        </div>
      </div>

      {/* Configuration Controls (Disabled during active session) */}
      <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/70 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Ladder Settings</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-parchment/60">Start BPM ({startBpm})</label>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              disabled={isActive}
              value={startBpm}
              onChange={(e) => setStartBpm(Number(e.target.value))}
              className="mt-2 w-full accent-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-parchment/60">Target Max BPM ({targetBpm})</label>
            <input
              type="range"
              min={startBpm + 5}
              max="200"
              step="5"
              disabled={isActive}
              value={targetBpm}
              onChange={(e) => setTargetBpm(Number(e.target.value))}
              className="mt-2 w-full accent-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-parchment/60">BPM Step (+{stepBpm} BPM)</label>
            <select
              disabled={isActive}
              value={stepBpm}
              onChange={(e) => setStepBpm(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-charcoal-700 bg-charcoal-800 px-3 py-2 text-sm text-parchment"
            >
              <option value={2}>+2 BPM (Gentle)</option>
              <option value={4}>+4 BPM (Standard)</option>
              <option value={5}>+5 BPM (Recommended)</option>
              <option value={10}>+10 BPM (Aggressive)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-parchment/60">Interval Duration</label>
            <select
              disabled={isActive}
              value={stepIntervalSeconds}
              onChange={(e) => setStepIntervalSeconds(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-charcoal-700 bg-charcoal-800 px-3 py-2 text-sm text-parchment"
            >
              <option value={15}>15 seconds (Rapid test)</option>
              <option value={30}>30 seconds (Standard)</option>
              <option value={60}>60 seconds (Endurance)</option>
              <option value={90}>90 seconds (Pro stamina)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-charcoal-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-parchment/60">Time Signature:</span>
            {(["4/4", "3/4", "6/8", "12/8", "7/8"] as TimeSignature[]).map((ts) => (
              <button
                key={ts}
                type="button"
                disabled={isActive}
                onClick={() => setTimeSignature(ts)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                  timeSignature === ts
                    ? "bg-gold-500 text-charcoal-950"
                    : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                }`}
              >
                {ts}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-parchment/60">Subdivision:</span>
            {(["quarter", "eighth", "16th", "triplet"] as Subdivision[]).map((sub) => (
              <button
                key={sub}
                type="button"
                disabled={isActive}
                onClick={() => setSubdivision(sub)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold capitalize ${
                  subdivision === sub
                    ? "bg-gold-500 text-charcoal-950"
                    : "border border-charcoal-700 bg-charcoal-800 text-parchment/60 hover:text-parchment"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
