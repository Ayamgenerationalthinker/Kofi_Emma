import { Volume2, VolumeX, Drum } from "lucide-react";
import type { ShedTrackPlayer } from "./LoopPlayer";

const STEM_ICON_LABEL: Record<string, string> = {
  Drums: "🥁",
  Bass: "🎸",
  Keys: "🎹",
  Guitar: "🎸",
  Vocals: "🎤",
  Percussion: "🪘",
};

// The mixer's whole reason for existing: "remove the drums and become the
// drummer." That one action gets its own oversized, unmissable button
// above the generic per-stem grid, rather than making the user hunt for
// the Drums row and tap its mute icon like every other stem.
export function StemMixer({ player }: { player: ShedTrackPlayer }) {
  if (player.loadState !== "ready" || player.voices.length === 0) {
    return null;
  }

  const drumsVoice = player.voices.find((v) => v.name === "Drums");
  const isSingleVoice = player.voices.length === 1;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-5">
      <h2 className="text-xs uppercase tracking-widest text-gold-400">Stem Mixer</h2>

      {isSingleVoice ? (
        <p className="rounded-lg border border-charcoal-700 bg-charcoal-950/50 px-4 py-6 text-center text-sm text-parchment/50">
          This track doesn't have separate stems yet — practice along with the full mix above.
        </p>
      ) : (
        <>
          {drumsVoice && (
            <button
              type="button"
              onClick={() => player.setVoiceMuted("Drums", !drumsVoice.muted)}
              aria-pressed={drumsVoice.muted}
              className={[
                "flex items-center justify-center gap-3 rounded-xl border-2 px-4 py-4 text-base font-bold uppercase tracking-wide transition-colors",
                drumsVoice.muted
                  ? "border-gold-500 bg-gold-500/15 text-gold-300"
                  : "border-charcoal-600 text-parchment hover:border-gold-500/60",
              ].join(" ")}
            >
              <Drum className="h-6 w-6" aria-hidden="true" />
              {drumsVoice.muted ? "Drums Removed — You're Up" : "Remove the Drums — Become the Drummer"}
            </button>
          )}

          <div className="flex flex-col gap-3">
            {player.voices.map((voice) => (
              <div key={voice.name} className="flex items-center gap-3 rounded-lg border border-charcoal-700 bg-charcoal-950/40 p-3">
                <span className="w-24 shrink-0 truncate text-sm font-semibold" title={voice.name}>
                  <span aria-hidden="true">{STEM_ICON_LABEL[voice.name] ?? "🎵"}</span> {voice.name}
                </span>

                <button
                  type="button"
                  aria-label={voice.muted ? `Unmute ${voice.name}` : `Mute ${voice.name}`}
                  aria-pressed={voice.muted}
                  onClick={() => player.setVoiceMuted(voice.name, !voice.muted)}
                  className={[
                    // 44px is the minimum tappable target (was 36px) — the
                    // icon itself stays the same visual size, only the hit
                    // area grows, so the row doesn't read as bulkier.
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
                    voice.muted ? "border-red-500/60 bg-red-950/40 text-red-300" : "border-charcoal-600 text-parchment/60 hover:border-gold-500",
                  ].join(" ")}
                >
                  {voice.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  aria-label={voice.soloed ? `Unsolo ${voice.name}` : `Solo ${voice.name}`}
                  aria-pressed={voice.soloed}
                  onClick={() => player.toggleSolo(voice.name)}
                  className={[
                    // Fixed h-11 (44px) rather than py-1 (was ~26-28px) —
                    // same pill shape and text size, just a taller hit area.
                    "flex h-11 shrink-0 items-center justify-center rounded-full border px-3 text-[11px] font-bold uppercase",
                    voice.soloed ? "border-gold-500 bg-gold-500/15 text-gold-300" : "border-charcoal-600 text-parchment/50 hover:border-gold-500/60",
                  ].join(" ")}
                >
                  Solo
                </button>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={voice.volume}
                  onChange={(e) => player.setVoiceVolume(voice.name, Number(e.target.value))}
                  aria-label={`${voice.name} volume`}
                  // py-3 grows the input's own hit-testable box (native
                  // range inputs are tappable across their full box, not
                  // just the thin visible track) to ~44px tall without
                  // changing how thick the track itself looks.
                  className="w-full accent-gold-500 py-3"
                  disabled={voice.muted}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
