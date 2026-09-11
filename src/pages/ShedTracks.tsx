import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Gauge, Sparkles } from "lucide-react";
import { SHED_TRACKS, TRACK_GENRES, type ShedTrack, type TrackGenre } from "../data/shedTracks";

type FilterValue = "All" | TrackGenre;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The Shed Track browser — a practice-room track wall, not a music
// streaming grid: every card leads with the numbers a drummer actually
// decides on (BPM, difficulty, length), not album art.
export function ShedTracks() {
  const [filter, setFilter] = useState<FilterValue>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return SHED_TRACKS;
    return SHED_TRACKS.filter((t) => t.genre === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Shed Tracks</h1>
        <p className="mt-1 text-parchment/60">Full-band backing tracks. Mute the drums. Play the part yourself.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", ...TRACK_GENRES] as FilterValue[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            aria-pressed={filter === g}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              filter === g ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
            ].join(" ")}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}

function TrackCard({ track }: { track: ShedTrack }) {
  return (
    <Link
      to={`/shed-tracks/${track.id}`}
      className="flex flex-col gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4 hover:border-gold-500/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold-600/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-300">
              {track.genre}
            </span>
            {track.isArchitectureDemo && (
              <span className="flex items-center gap-1 rounded-full border border-amber-600/50 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                <Sparkles className="h-3 w-3" /> Demo
              </span>
            )}
            {!track.audioUrl && !track.isArchitectureDemo && (
              <span className="rounded-full border border-charcoal-600 px-2 py-0.5 text-[10px] text-parchment/40">Audio pending</span>
            )}
          </div>
          <h2 className="font-bold leading-snug">{track.title}</h2>
        </div>
      </div>

      <p className="text-xs text-parchment/50">{track.description}</p>

      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-parchment/60">
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" /> {track.bpm} BPM
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {formatDuration(track.durationSeconds)}
        </span>
        <span>Difficulty {track.difficulty}/5</span>
      </div>
    </Link>
  );
}
