import type { AccentType } from "./meter";

// A dedicated Web Audio service synthesizing metronome clicks, snare strokes,
// accents, grace notes, flams, drags, kick drums, and hi-hats in real-time.
// Scheduling is driven by AudioContext time for microsecond precision.

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
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.8;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.initNoiseBuffer(this.ctx);
    }
    return this.ctx;
  }

  private initNoiseBuffer(ctx: AudioContext): void {
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  get currentTime(): number {
    return this.ensureContext().currentTime;
  }

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

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  playSnareTap(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.45, 0.07, 180);
  }

  playAccentStroke(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.95, 0.12, 220);
  }

  playGraceNote(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.22, 0.04, 160);
  }

  playSnareDiddle(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.35, 0.05, 175);
  }

  private synthesizeSnare(time: number, gainLevel: number, decaySec: number, toneHz: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    // 1. Tonal body (snare drum head resonance)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(toneHz, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + decaySec);

    oscGain.gain.setValueAtTime(0, time);
    oscGain.gain.linearRampToValueAtTime(gainLevel * 0.6, time + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + decaySec + 0.01);

    // 2. Snare wire rattle (noise burst through bandpass filter)
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(gainLevel * 0.5, time + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + decaySec + 0.01);
  }

  playKick(time: number, gainLevel = 0.9): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  playHiHat(time: number, open = false, gainLevel = 0.4): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;

    const duration = open ? 0.22 : 0.04;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + duration + 0.01);
  }

  dispose(): void {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
  }
}
