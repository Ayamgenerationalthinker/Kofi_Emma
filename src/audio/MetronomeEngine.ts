import { AudioEngine } from "./AudioEngine";
import type { AccentType } from "./meter";

// The actual audio clock. Uses AudioContext-time lookahead scheduling (the
// standard "Tale of Two Clocks" technique) rather than setInterval, which
// is why the click stays stable at high BPM instead of drifting or
// stuttering under JS event-loop jitter.

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;

export interface StepDefinition {
  index: number;
  clickType: AccentType;
}

export interface ScheduledStep {
  index: number;
  time: number;
}

export type StepListener = (step: ScheduledStep) => void;

// Section 42: 40-180 BPM, wide enough for professional-tempo fast praise
// practice (140-150 BPM) with headroom above it.
export const MIN_BPM = 40;
export const MAX_BPM = 180;

export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
}

export function stepSecondsFor(bpm: number, subdivision: string): number {
  const quarter = 60 / bpm;
  switch (subdivision) {
    case "8th":
    case "eighth":
      return quarter / 2;
    case "16th":
      return quarter / 4;
    case "triplet":
      return quarter / 3;
    case "quarter":
    default:
      return quarter;
  }
}

// Section 96: an explicit state machine instead of ambiguous boolean
// combinations (isPlaying/isPaused/isStarted).
export type MetronomeStatus = "STOPPED" | "PLAYING" | "PAUSED";

export class MetronomeEngine {
  private audioEngine: AudioEngine;
  private timerId: number | null = null;
  private rafId: number | null = null;
  private nextStepTime = 0;
  private currentStepIndex = 0;
  private steps: StepDefinition[] = [];
  private stepSeconds = 0.5;
  private scheduledQueue: ScheduledStep[] = [];
  private listeners = new Set<StepListener>();
  private _status: MetronomeStatus = "STOPPED";

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  get status(): MetronomeStatus {
    return this._status;
  }

  /** Convenience boolean derived from `status`, for simple UI toggles. */
  get isRunning(): boolean {
    return this._status === "PLAYING";
  }

  onStep(listener: StepListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(steps: StepDefinition[], bpm: number, subdivision: string): Promise<void> {
    if (steps.length === 0) return;
    await this.audioEngine.resume();
    this.stopScheduling();

    this.steps = steps;
    this.stepSeconds = stepSecondsFor(clampBpm(bpm), subdivision);
    this.currentStepIndex = 0;
    this.nextStepTime = this.audioEngine.currentTime + 0.05;
    this._status = "PLAYING";

    this.timerId = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS);
    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  }

  /** Halts scheduling but remembers the current step, so resume() continues from where it left off. */
  pause(): void {
    if (this._status !== "PLAYING") return;
    this.stopScheduling();
    this._status = "PAUSED";
  }

  async resume(): Promise<void> {
    if (this._status !== "PAUSED" || this.steps.length === 0) return;
    await this.audioEngine.resume();
    this.nextStepTime = this.audioEngine.currentTime + 0.05;
    this._status = "PLAYING";
    this.timerId = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS);
    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  }

  /** Live tempo change without losing the current step position. */
  setTempo(bpm: number, subdivision: string): void {
    this.stepSeconds = stepSecondsFor(clampBpm(bpm), subdivision);
  }

  setBpm(bpm: number, subdivision = "quarter"): void {
    this.setTempo(bpm, subdivision);
  }

  stop(): void {
    this.stopScheduling();
    this._status = "STOPPED";
    this.currentStepIndex = 0;
  }

  private stopScheduling(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
    if (this.rafId !== null) window.cancelAnimationFrame(this.rafId);
    this.timerId = null;
    this.rafId = null;
    this.scheduledQueue = [];
  }

  private scheduler(): void {
    const ctx = this.audioEngine;
    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const step = this.steps[this.currentStepIndex % this.steps.length];
      this.audioEngine.playClick(this.nextStepTime, step.clickType);
      this.scheduledQueue.push({ index: step.index, time: this.nextStepTime });

      this.nextStepTime += this.stepSeconds;
      this.currentStepIndex += 1;
    }
  }

  private drainQueue = (): void => {
    if (this._status !== "PLAYING") return;
    const now = this.audioEngine.currentTime;

    while (this.scheduledQueue.length > 0 && this.scheduledQueue[0].time <= now) {
      const step = this.scheduledQueue.shift()!;
      for (const listener of this.listeners) listener(step);
    }

    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  };
}
