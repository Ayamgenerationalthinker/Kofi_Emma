import { Minus, Pause, Play, Repeat, RotateCcw, Music2 } from "lucide-react";
import type { ShedTrack } from "../../data/shedTracks";
import type { useShedTrackPlayer } from "../../hooks/useShedTrackPlayer";

export type ShedTrackPlayer = ReturnType<typeof useShedTrackPlayer>;

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The transport half of the Shed Track experience: play/pause/restart,
// seek, tempo, and section looping. Deliberately styled after
// MetronomeControls (same large-touch-target, glance-from-across-the-room
// language) rather than a generic streaming-app scrubber, since the whole
// point is a drummer standing at a kit, not someone browsing a playlist.
export function LoopPlayer({ player, track }: { player: ShedTrackPlayer; track: ShedTrack }) {
  if (player.loadState === "loading") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center text-sm text-parchment/50">
        Loading track audio…
      </div>
    );
  }

  if (player.loadState === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-10 text-center">
        <Music2 className="h-8 w-8 text-parchment/30" aria-hidden="true" />
        <p className="text-sm font-semibold text-parchment/70">Production audio not added yet</p>
        <p className="max-w-sm text-xs text-parchment/50">
          This track's metadata is ready, but no licensed or original recording has been added to this deployment. See
          docs/SHED_TRACKS_ASSETS.md for how real audio gets added.
        </p>
      </div>
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
    if (e.code === "Space") {
      e.preventDefault();
      player.toggle();
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-6 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-5"
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Loop player"
    >
      {track.isArchitectureDemo && (
        <span className="self-start rounded-full border border-amber-600/50 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          Demo fixture — synthesized, not a real track
        </span>
      )}

      {/* Current section indicator */}
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {track.sections.map((section) => {
          const isCurrent = player.currentSection?.name === section.name;
          return (
            <span
              key={section.name}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium",
                isCurrent ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-700 text-parchment/40",
              ].join(" ")}
              aria-current={isCurrent ? "true" : undefined}
            >
              {section.name}
            </span>
          );
        })}
      </div>

      {/* Progress / seek */}
      <div className="w-full max-w-sm">
        <input
          type="range"
          min={0}
          max={Math.max(player.duration, 0.01)}
          step={0.1}
          value={player.currentTime}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Seek"
          className="w-full accent-gold-500"
        />
        <div className="mt-1 flex justify-between text-xs tabular-nums text-parchment/50">
          <span>{formatTime(player.currentTime)}</span>
          <span>{formatTime(player.duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Restart"
          onClick={player.restart}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-charcoal-600 text-parchment hover:border-gold-500"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.isPlaying ? "Pause" : "Play"}
          className={[
            "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-colors",
            player.isPlaying ? "bg-red-600 hover:bg-red-500 text-white" : "bg-gold-500 hover:bg-gold-400 text-charcoal-950",
          ].join(" ")}
        >
          {player.isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
        </button>

        <button
          type="button"
          aria-label="Toggle loop"
          aria-pressed={player.loopSectionName != null}
          onClick={player.toggleLoop}
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full border",
            player.loopSectionName ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
          ].join(" ")}
        >
          <Repeat className="h-5 w-5" />
        </button>
      </div>

      {/* Loopable section selection */}
      {track.loopableRegionNames.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {track.loopableRegionNames.map((name) => {
            const section = track.sections.find((s) => s.name === name);
            if (!section) return null;
            const active = player.loopSectionName === name;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                onClick={() => player.setLoopSection(active ? null : section)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                  active ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60 hover:border-gold-500/60",
                ].join(" ")}
              >
                Loop {name}
              </button>
            );
          })}
        </div>
      )}

      {/* BPM */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Decrease tempo"
            onClick={() => player.setBpm(player.bpm - 1)}
            disabled={player.bpm <= player.minBpm}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-600 text-parchment hover:border-gold-500 disabled:opacity-30"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center">
            <span data-testid="loop-player-bpm" className="text-4xl font-black tabular-nums">
              {player.bpm}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-parchment/50">
              BPM {player.bpm !== player.nativeBpm && `(native ${player.nativeBpm})`}
            </span>
          </div>
          <button
            type="button"
            aria-label="Increase tempo"
            onClick={() => player.setBpm(player.bpm + 1)}
            disabled={player.bpm >= player.maxBpm}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-600 text-parchment hover:border-gold-500 disabled:opacity-30"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>

        <input
          type="range"
          min={player.minBpm}
          max={player.maxBpm}
          value={player.bpm}
          onChange={(e) => player.setBpm(Number(e.target.value))}
          aria-label="Tempo slider"
          className="w-full max-w-xs accent-gold-500"
        />

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={player.tapTempo}
            className="rounded-lg border border-charcoal-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide hover:border-gold-500"
          >
            Tap Tempo
          </button>
          {player.tapDetectedBpm != null && (
            <button
              type="button"
              onClick={player.acceptTapTempo}
              className="rounded-md bg-gold-500/20 px-3 py-1 text-xs text-gold-300 hover:bg-gold-500/30"
            >
              Use {player.tapDetectedBpm} BPM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
