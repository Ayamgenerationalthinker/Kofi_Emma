import { AudioEngine } from "./AudioEngine";
import type { RudimentDefinition, RudimentStroke } from "../data/rudiments";
import { clampBpm, stepSecondsFor } from "./MetronomeEngine";

export type RudimentPlayMode = "LISTEN" | "METRONOME_AND_RUDIMENT" | "PRACTICE";

export interface RudimentAudioStep {
  strokeIndex: number;
  time: number;
  isCountIn: boolean;
  countInBeat?: number;
}

export type RudimentStepCallback = (step: RudimentAudioStep) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.12;
const FLAM_OFFSET_SEC = 0.028; // 28ms grace note offset for flams
const DRAG_OFFSET_SEC = 0.022; // 22ms per drag diddle grace note

export class RudimentAudioEngine {
  private audioEngine: AudioEngine;
  private timerId: number | null = null;
  private rafId: number | null = null;
  private isPlaying = false;

  private rudiment: RudimentDefinition | null = null;
  private strokes: RudimentStroke[] = [];
  private bpm = 80;
  private mode: RudimentPlayMode = "LISTEN";
  private countInBars = 1;

  private stepSeconds = 0.25;
  private nextEventTime = 0;
  private currentStrokeIndex = 0;
  private isCountInProgress = false;
  private currentCountInBeat = 0;
  private totalCountInBeats = 4;

  private scheduledQueue: RudimentAudioStep[] = [];
  private stepListeners = new Set<RudimentStepCallback>();

  constructor(audioEngine?: AudioEngine) {
    this.audioEngine = audioEngine || new AudioEngine();
  }

  get running(): boolean {
    return this.isPlaying;
  }

  get currentMode(): RudimentPlayMode {
    return this.mode;
  }

  onStep(callback: RudimentStepCallback): () => void {
    this.stepListeners.add(callback);
    return () => this.stepListeners.delete(callback);
  }

  async start(
    rudiment: RudimentDefinition,
    bpm: number,
    mode: RudimentPlayMode = "LISTEN",
    countInBars = 1,
    useAlternateSticking = false
  ): Promise<void> {
    await this.audioEngine.resume();
    this.stop();

    this.rudiment = rudiment;
    this.bpm = clampBpm(bpm);
    this.mode = mode;
    this.countInBars = countInBars;
    this.strokes = useAlternateSticking && rudiment.alternateStrokes ? rudiment.alternateStrokes : rudiment.strokes;

    this.stepSeconds = stepSecondsFor(this.bpm, rudiment.subdivision);
    const beatsPerBar = rudiment.timeSignature === "6/8" ? 6 : rudiment.timeSignature === "3/4" ? 3 : 4;
    this.totalCountInBeats = countInBars * beatsPerBar;
    this.isCountInProgress = countInBars > 0;
    this.currentCountInBeat = 0;
    this.currentStrokeIndex = 0;

    this.nextEventTime = this.audioEngine.currentTime + 0.05;
    this.isPlaying = true;

    this.timerId = window.setInterval(() => this.scheduler(), LOOKAHEAD_MS);
    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  }

  setBpm(bpm: number): void {
    this.bpm = clampBpm(bpm);
    if (this.rudiment) {
      this.stepSeconds = stepSecondsFor(this.bpm, this.rudiment.subdivision);
    }
  }

  setMode(mode: RudimentPlayMode): void {
    this.mode = mode;
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.scheduledQueue = [];
    this.currentStrokeIndex = 0;
    this.isCountInProgress = false;
  }

  dispose(): void {
    this.stop();
    this.stepListeners.clear();
  }

  private scheduler(): void {
    if (!this.isPlaying || !this.rudiment) return;

    while (this.nextEventTime < this.audioEngine.currentTime + SCHEDULE_AHEAD_SEC) {
      if (this.isCountInProgress) {
        this.scheduleCountInBeat(this.nextEventTime);
        const beatDuration = 60 / this.bpm;
        this.nextEventTime += beatDuration;
        this.currentCountInBeat += 1;

        if (this.currentCountInBeat >= this.totalCountInBeats) {
          this.isCountInProgress = false;
          this.currentStrokeIndex = 0;
        }
      } else {
        this.scheduleRudimentStroke(this.nextEventTime, this.currentStrokeIndex);
        this.nextEventTime += this.stepSeconds;
        this.currentStrokeIndex = (this.currentStrokeIndex + 1) % this.strokes.length;
      }
    }
  }

  private scheduleCountInBeat(time: number): void {
    const beatsPerBar = this.rudiment?.timeSignature === "6/8" ? 6 : this.rudiment?.timeSignature === "3/4" ? 3 : 4;
    const beatInBar = (this.currentCountInBeat % beatsPerBar) + 1;
    const isDownbeat = beatInBar === 1;

    // Metronome count-in sound
    this.audioEngine.playClick(time, isDownbeat ? "PRIMARY" : "SECONDARY");

    this.scheduledQueue.push({
      strokeIndex: -1,
      time,
      isCountIn: true,
      countInBeat: beatInBar,
    });
  }

  private scheduleRudimentStroke(time: number, index: number): void {
    const stroke = this.strokes[index];
    if (!stroke || stroke.rest) return;

    const playDemo = this.mode === "LISTEN" || this.mode === "METRONOME_AND_RUDIMENT";
    const playMetronome = this.mode === "METRONOME_AND_RUDIMENT" || this.mode === "PRACTICE";

    // Play Metronome click if enabled
    if (playMetronome && index % 4 === 0) {
      this.audioEngine.playClick(time, index === 0 ? "PRIMARY" : "SOFT");
    }

    // Play Rudiment demonstration sound if enabled
    if (playDemo) {
      if (stroke.grace && stroke.diddle) {
        // Drag ruff: 2 micro grace notes
        this.audioEngine.playGraceNote(Math.max(0, time - DRAG_OFFSET_SEC * 2), stroke.hand);
        this.audioEngine.playGraceNote(Math.max(0, time - DRAG_OFFSET_SEC), stroke.hand);
      } else if (stroke.grace) {
        // Flam grace note
        this.audioEngine.playGraceNote(Math.max(0, time - FLAM_OFFSET_SEC), stroke.hand);
      } else if (stroke.accent) {
        // Accented stroke
        this.audioEngine.playAccentStroke(time, stroke.hand);
      } else if (stroke.diddle) {
        // Rebound diddle
        this.audioEngine.playSnareDiddle(time, stroke.hand);
      } else {
        // Standard tap stroke
        this.audioEngine.playSnareTap(time, stroke.hand);
      }
    }

    this.scheduledQueue.push({
      strokeIndex: index,
      time,
      isCountIn: false,
    });
  }

  private drainQueue(): void {
    if (!this.isPlaying) return;

    const now = this.audioEngine.currentTime;
    while (this.scheduledQueue.length > 0 && this.scheduledQueue[0].time <= now + 0.02) {
      const step = this.scheduledQueue.shift()!;
      for (const listener of this.stepListeners) {
        listener(step);
      }
    }

    this.rafId = window.requestAnimationFrame(() => this.drainQueue());
  }
}
