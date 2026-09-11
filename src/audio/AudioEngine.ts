import type { AccentType } from "./meter";

// A dedicated Web Audio service. Clicks are synthesized with oscillators so
// the metronome never depends on shipping/loading audio files, and stays
// stable at high BPM because scheduling (see MetronomeEngine) is driven by
// AudioContext time, not setInterval.

// Section 33/34: beat 1 of every measure gets a crisp, clearly distinct
// high-pitched "ping" (a short sine tone reads as a ping; the softer clicks
// below it use a squarer, percussive tone so the two are distinguishable by
// timbre as well as pitch). Secondary accents (a compound/odd meter's other
// group starts) sit between the two.
const FREQUENCIES: Record<AccentType, number> = {
  PRIMARY: 1600,
  SECONDARY: 1100,
  SOFT: 750,
};

const WAVEFORMS: Record<AccentType, OscillatorType> = {
  PRIMARY: "sine",
  SECONDARY: "square",
  SOFT: "square",
};

const PEAK_GAIN: Record<AccentType, number> = {
  PRIMARY: 1,
  SECONDARY: 0.75,
  SOFT: 0.45,
};

const DURATION: Record<AccentType, number> = {
  PRIMARY: 0.05,
  SECONDARY: 0.045,
  SOFT: 0.03,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.8;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get currentTime(): number {
    return this.ensureContext().currentTime;
  }

  /** Must be called from a user gesture (e.g. pressing Start) before scheduling any sound — mobile browsers block audio until then (section 95). */
  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  setVolume(percent: number): void {
    this.volume = Math.max(0, Math.min(100, percent)) / 100;
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  playClick(time: number, type: AccentType): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = WAVEFORMS[type];
    osc.frequency.value = FREQUENCIES[type];

    const peak = PEAK_GAIN[type];
    const duration = DURATION[type];

    // Near-zero attack, short decay — a controlled envelope so the accent
    // reads as a clean ping rather than a harsh transient.
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  dispose(): void {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
  }
}
