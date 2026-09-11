import { AudioEngine, type ClickType } from "./AudioEngine";

// Section 18/48/50: the actual audio clock. Uses AudioContext-time lookahead
// scheduling (the standard "Tale of Two Clocks" technique) rather than
// setInterval, which is why the click stays stable at high BPM instead of
// drifting or stuttering under JS event-loop jitter.

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;

export interface StepDefinition {
  index: number;
  clickType: ClickType;
}

export interface ScheduledStep {
  index: number;
  time: number;
}

export type StepListener = (step: ScheduledStep) => void;

export const MIN_BPM = 40;
export const MAX_BPM = 160;

export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
}

export function stepSecondsFor(bpm: number, subdivision: string): number {
  const quarter = 60 / bpm;
  switch (subdivision) {
    case "8th":
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
  private _isRunning = false;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  onStep(listener: StepListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(steps: StepDefinition[], bpm: number, subdivision: string): Promise<void> {
    if (steps.length === 0) return;
    await this.audioEngine.resume();
    this.stop();

    this.steps = steps;
    this.stepSeconds = stepSecondsFor(clampBpm(bpm), subdivision);
    this.currentStepIndex = 0;
    this.nextStepTime = this.audioEngine.currentTime + 0.05;
    this._isRunning = true;

    this.timerId = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS);
    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  }

  /** Live tempo change without losing the current step position (section 50). */
  setTempo(bpm: number, subdivision: string): void {
    this.stepSeconds = stepSecondsFor(clampBpm(bpm), subdivision);
  }

  stop(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
    if (this.rafId !== null) window.cancelAnimationFrame(this.rafId);
    this.timerId = null;
    this.rafId = null;
    this._isRunning = false;
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
    if (!this._isRunning) return;
    const now = this.audioEngine.currentTime;

    while (this.scheduledQueue.length > 0 && this.scheduledQueue[0].time <= now) {
      const step = this.scheduledQueue.shift()!;
      for (const listener of this.listeners) listener(step);
    }

    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  };
}
