// The Shed Tracks playback engine — drives both the Loop Player and the
// Stem Mixer from one shared instance so their transport (play/pause/seek/
// BPM/loop) always stays in sync with per-voice mixing (volume/mute/solo).
//
// Tempo changes are a live AudioParam automation on each running
// AudioBufferSourceNode (`playbackRate.setValueAtTime`), never a stop/
// reload/recreate of the source — see `setPlaybackRate`. That satisfies
// "changing BPM must not reload the track," though it's a real varispeed
// change (pitch shifts with tempo), not pitch-preserving time-stretch —
// there is no such thing as a pitch-preserving AudioParam on
// AudioBufferSourceNode. A future upgrade to genuine pitch-preserving
// time-stretch (e.g. a phase-vocoder AudioWorklet) would slot in by
// replacing what `startVoicesAt`/`setPlaybackRate` do internally; the
// public transport API (play/pause/seek/setPlaybackRate/setLoop) would not
// need to change, which is what "architecture ready for proper time-
// stretching" means here.
//
// Looping uses the AudioBufferSourceNode's native loop/loopStart/loopEnd
// rather than a JS-scheduled restart, so a loop is sample-accurate and
// gapless.

export type PlaybackStatus = "stopped" | "playing" | "paused";

export interface LoopRegion {
  start: number;
  end: number;
}

interface VoiceMixState {
  volume: number; // 0-100
  muted: boolean;
}

interface RunningVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const START_LOOKAHEAD_SECONDS = 0.03;

export class LoopPlayerEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private running = new Map<string, RunningVoice>();
  private mixState = new Map<string, VoiceMixState>();
  private soloed = new Set<string>();
  private status: PlaybackStatus = "stopped";
  private rate = 1;
  private loopRegion: LoopRegion | null = null;
  private positionAtCheckpoint = 0;
  private ctxTimeAtCheckpoint = 0;
  private durationSeconds = 0;
  private onEnded: (() => void) | null = null;
  private onStatusChange: ((status: PlaybackStatus) => void) | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  /** Replaces the loaded voices (e.g. stems, or a single "master" voice). All buffers should share the same duration. Stops any current playback. */
  loadVoices(buffers: Record<string, AudioBuffer>): void {
    this.stopRunningSources();
    this.buffers = new Map(Object.entries(buffers));
    this.mixState = new Map(Object.keys(buffers).map((name) => [name, { volume: 100, muted: false }]));
    this.soloed.clear();
    this.durationSeconds = this.buffers.size === 0 ? 0 : Math.max(...Array.from(this.buffers.values()).map((b) => b.duration));
    this.positionAtCheckpoint = 0;
    this.ctxTimeAtCheckpoint = 0;
    this.loopRegion = null;
    this.setStatus("stopped");
  }

  get duration(): number {
    return this.durationSeconds;
  }

  get voiceNames(): string[] {
    return Array.from(this.buffers.keys());
  }

  get hasAudio(): boolean {
    return this.buffers.size > 0;
  }

  get playbackStatus(): PlaybackStatus {
    return this.status;
  }

  get playbackRate(): number {
    return this.rate;
  }

  get activeLoopRegion(): LoopRegion | null {
    return this.loopRegion;
  }

  onEndedCallback(cb: (() => void) | null): void {
    this.onEnded = cb;
  }

  onStatusChangeCallback(cb: ((status: PlaybackStatus) => void) | null): void {
    this.onStatusChange = cb;
  }

  private setStatus(status: PlaybackStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
  }

  private effectiveGain(name: string): number {
    const state = this.mixState.get(name);
    if (!state) return 0;
    if (this.soloed.size > 0 && !this.soloed.has(name)) return 0;
    if (state.muted) return 0;
    return state.volume / 100;
  }

  private checkpoint(): void {
    if (this.status === "playing" && this.ctx) {
      this.positionAtCheckpoint = this.computePosition();
      this.ctxTimeAtCheckpoint = this.ctx.currentTime;
    }
  }

  private computePosition(): number {
    if (this.status !== "playing" || !this.ctx) return this.positionAtCheckpoint;
    const elapsedNative = Math.max(0, this.ctx.currentTime - this.ctxTimeAtCheckpoint) * this.rate;
    let pos = this.positionAtCheckpoint + elapsedNative;
    if (this.loopRegion) {
      const { start, end } = this.loopRegion;
      const span = Math.max(0.001, end - start);
      if (pos >= end) pos = start + ((pos - start) % span);
    } else if (pos >= this.durationSeconds) {
      pos = this.durationSeconds;
    }
    return pos;
  }

  getCurrentTime(): number {
    return this.computePosition();
  }

  private stopRunningSources(): void {
    for (const { source } of this.running.values()) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped/never started — safe to ignore
      }
    }
    this.running.clear();
  }

  private startVoicesAt(offsetSeconds: number): void {
    const ctx = this.ensureContext();
    if (!this.masterGain || this.buffers.size === 0) return;
    this.stopRunningSources();

    const when = ctx.currentTime + START_LOOKAHEAD_SECONDS;
    const names = Array.from(this.buffers.keys());
    names.forEach((name, i) => {
      const buffer = this.buffers.get(name)!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(this.rate, ctx.currentTime);
      if (this.loopRegion) {
        source.loop = true;
        source.loopStart = this.loopRegion.start;
        source.loopEnd = this.loopRegion.end;
      } else {
        source.loop = false;
      }
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.effectiveGain(name), ctx.currentTime);
      source.connect(gain);
      gain.connect(this.masterGain!);
      source.start(when, offsetSeconds);

      // Only one voice needs to report natural end-of-track (they're all the same duration and started together).
      if (i === 0 && !this.loopRegion) {
        source.onended = () => {
          if (this.status === "playing") {
            this.positionAtCheckpoint = this.durationSeconds;
            this.setStatus("stopped");
            this.onEnded?.();
          }
        };
      }
      this.running.set(name, { source, gain });
    });

    this.ctxTimeAtCheckpoint = when;
    this.positionAtCheckpoint = offsetSeconds;
  }

  async play(): Promise<void> {
    if (this.buffers.size === 0 || this.status === "playing") return;
    await this.resume();
    const atEnd = !this.loopRegion && this.positionAtCheckpoint >= this.durationSeconds;
    const offset = atEnd ? 0 : this.positionAtCheckpoint;
    this.setStatus("playing");
    this.startVoicesAt(offset);
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.checkpoint();
    this.stopRunningSources();
    this.setStatus("paused");
  }

  /** Seeks to the loop region's start (or the track start when no loop is set) and, if already playing, restarts audibly from there. */
  restart(): void {
    const target = this.loopRegion?.start ?? 0;
    this.positionAtCheckpoint = target;
    this.ctxTimeAtCheckpoint = this.ctx?.currentTime ?? 0;
    if (this.status === "playing") this.startVoicesAt(target);
  }

  seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(this.durationSeconds, seconds));
    this.positionAtCheckpoint = clamped;
    this.ctxTimeAtCheckpoint = this.ctx?.currentTime ?? 0;
    if (this.status === "playing") this.startVoicesAt(clamped);
  }

  /** Live tempo change — an AudioParam automation on the already-running sources. Never stops, reloads, or recreates them. */
  setPlaybackRate(rate: number): void {
    const clamped = Math.max(0.25, Math.min(4, rate));
    this.checkpoint();
    this.rate = clamped;
    if (this.status === "playing" && this.ctx) {
      for (const { source } of this.running.values()) {
        source.playbackRate.setValueAtTime(clamped, this.ctx.currentTime);
      }
    }
  }

  /** Enables/disables/changes the loop region. Live on already-running sources — no restart, except when the current position falls outside a newly-set region (a seek to the region start is the only sane behavior there). */
  setLoop(region: LoopRegion | null): void {
    this.checkpoint();
    this.loopRegion = region;

    if (this.status !== "playing") return;

    if (!region) {
      for (const { source } of this.running.values()) source.loop = false;
      return;
    }

    const pos = this.positionAtCheckpoint;
    if (pos < region.start || pos >= region.end) {
      this.startVoicesAt(region.start);
      return;
    }
    for (const { source } of this.running.values()) {
      source.loop = true;
      source.loopStart = region.start;
      source.loopEnd = region.end;
    }
  }

  setVoiceVolume(name: string, percent: number): void {
    const state = this.mixState.get(name);
    if (!state) return;
    state.volume = Math.max(0, Math.min(100, percent));
    this.applyGain(name);
  }

  setVoiceMuted(name: string, muted: boolean): void {
    const state = this.mixState.get(name);
    if (!state) return;
    state.muted = muted;
    this.applyGain(name);
  }

  toggleSolo(name: string): void {
    if (!this.mixState.has(name)) return;
    if (this.soloed.has(name)) this.soloed.delete(name);
    else this.soloed.add(name);
    for (const voiceName of this.mixState.keys()) this.applyGain(voiceName);
  }

  isSoloed(name: string): boolean {
    return this.soloed.has(name);
  }

  getVoiceState(name: string): VoiceMixState | undefined {
    return this.mixState.get(name);
  }

  private applyGain(name: string): void {
    const running = this.running.get(name);
    if (running && this.ctx) {
      running.gain.gain.setValueAtTime(this.effectiveGain(name), this.ctx.currentTime);
    }
  }

  dispose(): void {
    this.stopRunningSources();
    this.masterGain?.disconnect();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.masterGain = null;
    this.buffers.clear();
    this.mixState.clear();
    this.soloed.clear();
  }
}
