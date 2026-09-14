import type { AccentType } from "./meter";

// Central Web Audio Sound Palette and procedural synthesis engine for Abele Drums Coach.
// Procedurally synthesizes acoustic kick, snare, rimshot, closed/open hi-hat, crash, ride,
// toms (low/mid/high), handclaps, and metronome clicks with sub-millisecond precision.

const CLICK_FREQUENCIES: Record<AccentType, number> = {
  PRIMARY: 1760, // A6 - High piercing tone for Beat 1
  SECONDARY: 1174, // D6 - Medium tone for secondary downbeats
  SOFT: 880, // A5 - Soft tone for offbeats / subdivisions
};

const CLICK_WAVEFORMS: Record<AccentType, OscillatorType> = {
  PRIMARY: "sine",
  SECONDARY: "sine",
  SOFT: "triangle",
};

const CLICK_PEAK_GAIN: Record<AccentType, number> = {
  PRIMARY: 1.0,
  SECONDARY: 0.7,
  SOFT: 0.4,
};

const CLICK_DURATION: Record<AccentType, number> = {
  PRIMARY: 0.04,
  SECONDARY: 0.035,
  SOFT: 0.025,
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private volume = 0.85;

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
    const bufferSize = ctx.sampleRate * 2.0; // 2.0 seconds of white noise
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

  // =========================================================================
  // METRONOME CLICKS
  // =========================================================================
  playClick(time: number, type: AccentType = "SOFT"): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = CLICK_WAVEFORMS[type];
    osc.frequency.setValueAtTime(CLICK_FREQUENCIES[type], time);

    const peak = CLICK_PEAK_GAIN[type];
    const duration = CLICK_DURATION[type];

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  // =========================================================================
  // BASS DRUM / KICK
  // =========================================================================
  playKick(time: number, gainLevel = 0.95): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    // Pitch sweep: punchy 140 Hz down to sub 45 Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.07);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.19);
  }

  // =========================================================================
  // SNARE & RUDIMENT VOICES
  // =========================================================================
  playSnare(time: number, gainLevel = 0.85, accent = false): void {
    this.synthesizeSnare(
      time,
      accent ? 1.0 : gainLevel,
      accent ? 0.14 : 0.08,
      accent ? 230 : 185,
      accent ? 1800 : 1200
    );
  }

  playSnareTap(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.55, 0.08, 185, 1200);
  }

  playAccentStroke(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 1.0, 0.14, 230, 1800);
  }

  playGraceNote(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.25, 0.04, 160, 1000);
  }

  playSnareDiddle(time: number, _hand: "R" | "L" = "R"): void {
    this.synthesizeSnare(time, 0.42, 0.05, 175, 1100);
  }

  private synthesizeSnare(time: number, gainLevel: number, decaySec: number, toneHz: number, filterHz: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    // 1. Tonal membrane body (shell fundamental)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(toneHz, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + decaySec);

    oscGain.gain.setValueAtTime(0, time);
    oscGain.gain.linearRampToValueAtTime(gainLevel * 0.65, time + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + decaySec + 0.01);

    // 2. Snare bottom wires (filtered noise snap)
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = filterHz;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(gainLevel * 0.6, time + 0.001);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + decaySec + 0.01);
  }

  // =========================================================================
  // RIMSHOT / CROSS-STICK
  // =========================================================================
  playRim(time: number, gainLevel = 0.8): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(820, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.025);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  // =========================================================================
  // HI-HATS (CLOSED & OPEN)
  // =========================================================================
  playClosedHiHat(time: number, gainLevel = 0.45): void {
    this.synthesizeCymbalNoise(time, gainLevel, 0.04, 7500);
  }

  playOpenHiHat(time: number, gainLevel = 0.55): void {
    this.synthesizeCymbalNoise(time, gainLevel, 0.28, 6500);
  }

  playHiHat(time: number, open = false, gainLevel = 0.45): void {
    if (open) {
      this.playOpenHiHat(time, gainLevel);
    } else {
      this.playClosedHiHat(time, gainLevel);
    }
  }

  // =========================================================================
  // CYMBALS: CRASH & RIDE
  // =========================================================================
  playCrash(time: number, gainLevel = 0.7): void {
    this.synthesizeCymbalNoise(time, gainLevel, 0.85, 4500);
  }

  playRide(time: number, gainLevel = 0.5): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    // Metallic ping oscillator (harmonic bell) + subtle shimmer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(3200, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel * 0.7, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.36);

    this.synthesizeCymbalNoise(time, gainLevel * 0.4, 0.25, 6000);
  }

  private synthesizeCymbalNoise(time: number, gainLevel: number, decaySec: number, filterHz: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = filterHz;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decaySec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + decaySec + 0.01);
  }

  // =========================================================================
  // TOMS (LOW / MID / HIGH)
  // =========================================================================
  playTom(time: number, pitch: "low" | "mid" | "high" = "mid", gainLevel = 0.8): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const frequencies: Record<"low" | "mid" | "high", { start: number; end: number }> = {
      low: { start: 110, end: 65 },
      mid: { start: 160, end: 95 },
      high: { start: 220, end: 130 },
    };

    const { start, end } = frequencies[pitch];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(start, time);
    osc.frequency.exponentialRampToValueAtTime(end, time + 0.15);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  // =========================================================================
  // HANDCLAP
  // =========================================================================
  playClap(time: number, gainLevel = 0.75): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || !this.noiseBuffer) return;

    // Multi-burst clap emulation (3 quick bursts + decay tail)
    [0, 0.012, 0.024].forEach((offset, idx) => {
      const isLast = idx === 2;
      const decay = isLast ? 0.12 : 0.015;

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1100;
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time + offset);
      gain.gain.linearRampToValueAtTime(gainLevel * (isLast ? 0.9 : 0.6), time + offset + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + decay);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      noise.start(time + offset);
      noise.stop(time + offset + decay + 0.01);
    });
  }

  dispose(): void {
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
  }
}
