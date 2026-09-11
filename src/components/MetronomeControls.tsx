import { Minus, Plus, Play, Pause, Volume2 } from "lucide-react";

export interface MetronomeControlsProps {
  bpm: number;
  minBpm: number;
  maxBpm: number;
  setBpm: (bpm: number) => void;
  isRunning: boolean;
  onToggle: () => void;
  volume: number;
  setVolume: (v: number) => void;
  onTap: () => void;
  tapDetectedBpm: number | null;
  onAcceptTap: () => void;
  large?: boolean;
  /** Section 40: ACCENT ON/OFF — omit to hide the control entirely (e.g. during a curriculum exercise, where the accent always reflects the sticking pattern). */
  accentOn?: boolean;
  onToggleAccent?: () => void;
}

// Section 50/81: large touch targets and a large BPM readout — this screen
// is meant to be used standing next to a drum kit, glanced at, not typed
// into carefully.
export function MetronomeControls({
  bpm,
  minBpm,
  maxBpm,
  setBpm,
  isRunning,
  onToggle,
  volume,
  setVolume,
  onTap,
  tapDetectedBpm,
  onAcceptTap,
  large = false,
  accentOn,
  onToggleAccent,
}: MetronomeControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Decrease tempo by 1 BPM"
          onClick={() => setBpm(bpm - 1)}
          disabled={bpm <= minBpm}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-charcoal-600 text-parchment hover:border-gold-500 disabled:opacity-30"
        >
          <Minus className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center">
          <span className={large ? "text-7xl font-black tabular-nums" : "text-5xl font-black tabular-nums"}>{bpm}</span>
          <span className="text-xs uppercase tracking-widest text-parchment/50">BPM</span>
        </div>

        <button
          type="button"
          aria-label="Increase tempo by 1 BPM"
          onClick={() => setBpm(bpm + 1)}
          disabled={bpm >= maxBpm}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-charcoal-600 text-parchment hover:border-gold-500 disabled:opacity-30"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <input
        type="range"
        min={minBpm}
        max={maxBpm}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="Tempo slider"
        className="w-full max-w-sm accent-gold-500"
      />

      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex items-center gap-3 rounded-full px-10 py-5 text-xl font-bold shadow-lg transition-colors",
          isRunning ? "bg-red-600 hover:bg-red-500 text-white" : "bg-gold-500 hover:bg-gold-400 text-charcoal-950",
        ].join(" ")}
      >
        {isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
        {isRunning ? "STOP" : "START"}
      </button>

      <div className="flex w-full max-w-sm items-center gap-3">
        <Volume2 className="h-5 w-5 shrink-0 text-parchment/60" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Metronome volume"
          className="w-full accent-gold-500"
        />
      </div>

      {onToggleAccent && (
        <button
          type="button"
          onClick={onToggleAccent}
          aria-pressed={accentOn}
          className={[
            "flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
            accentOn ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
          ].join(" ")}
        >
          Beat 1 Accent: {accentOn ? "ON" : "OFF"}
        </button>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onTap}
          className="rounded-lg border border-charcoal-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:border-gold-500"
        >
          Tap Tempo
        </button>
        {tapDetectedBpm != null && (
          <button
            type="button"
            onClick={onAcceptTap}
            className="rounded-md bg-gold-500/20 px-3 py-1 text-sm text-gold-300 hover:bg-gold-500/30"
          >
            Use {tapDetectedBpm} BPM
          </button>
        )}
      </div>
    </div>
  );
}
