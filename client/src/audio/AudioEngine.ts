// Section 18/48: a dedicated Web Audio service. Clicks are synthesized with
// oscillators so the metronome never depends on shipping/loading audio
// files, and stays stable at high BPM because scheduling (see
// MetronomeEngine) is driven by AudioContext time, not setInterval.

export type ClickType = "accent" | "normal" | "subdivision";

const FREQUENCIES: Record<ClickType, number> = {
  accent: 1500,
  normal: 1000,
  subdivision: 700,
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

  /** Must be called from a user gesture (e.g. pressing Start) before scheduling any sound. */
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

  playClick(time: number, type: ClickType): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = FREQUENCIES[type];

    const peak = type === "accent" ? 1 : type === "normal" ? 0.7 : 0.45;
    const duration = type === "subdivision" ? 0.03 : 0.045;

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
