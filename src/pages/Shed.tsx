import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Guitar, Search, WifiOff } from "lucide-react";
import { KOFI_EMMA_VIDEOS, VIDEO_CATEGORIES, KOFI_EMMA_CHANNEL_URL, type KofiEmmaVideo } from "../data/kofiEmmaVideos";
import { getVideoStudy } from "../services/videoStudyService";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { VideoCard } from "../components/shed/VideoCard";
import { VideoStudySheet } from "../components/shed/VideoStudySheet";

type FilterValue = "All" | "Favorites" | (typeof VIDEO_CATEGORIES)[number];

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

// Section 44/82: the motivational, visual-learning area. "Don't just watch
// the drummer. Study the movement." The library ships expanded from day
// one — this is not a hard-coded single-video screen; every card here is
// driven entirely by src/data/kofiEmmaVideos.ts.
export function Shed() {
  useLocalDbVersion();
  const online = useOnlineStatus();
  const [filter, setFilter] = useState<FilterValue>("All");
  const [query, setQuery] = useState("");
  const [openVideo, setOpenVideo] = useState<KofiEmmaVideo | null>(null);

  const featured = KOFI_EMMA_VIDEOS[0];

  const filtered = useMemo(() => {
    let list = KOFI_EMMA_VIDEOS;
    if (filter === "Favorites") {
      list = list.filter((v) => getVideoStudy(v.youtubeId).favorite);
    } else if (filter !== "All") {
      list = list.filter((v) => v.category === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.focus.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Shed Session</h1>
        <p className="mt-1 text-parchment/60">Watch. Listen. Break it down. Take it to your kit.</p>
      </div>

      {!online && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          Video unavailable offline. Your practice tools still work.
        </div>
      )}

      <Link
        to="/shed-tracks"
        className="flex items-center gap-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4 hover:border-gold-500/50"
      >
        <Guitar className="h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" />
        <div>
          <h2 className="font-bold">Shed Tracks</h2>
          <p className="text-xs text-parchment/50">Full-band backing tracks. Mute the drums, loop a section, play along.</p>
        </div>
      </Link>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-gold-400">Featured Video</h2>
        <div className="sm:max-w-xs">
          <VideoCard video={featured} study={getVideoStudy(featured.youtubeId)} onOpen={() => setOpenVideo(featured)} />
        </div>
      </section>

      <section className="rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-4">
        <p className="text-sm text-parchment/70">
          Don't just watch the drummer. Study the movement. Find the subdivision. Find the sticking. Take the idea to your kit.
        </p>
        <p className="mt-2 text-xs text-parchment/50">
          An independent drum-learning application inspired by Ghanaian gospel drumming study and public performances. Videos are embedded
          from YouTube and remain the property of their respective creators.
        </p>
        <a
          href={KOFI_EMMA_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 hover:underline"
        >
          View Kofi Emma Channel <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <section>
        <h2 className="mb-2 text-xs uppercase tracking-widest text-gold-400">Study Library</h2>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, focus, tags..."
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["All", "Favorites", ...VIDEO_CATEGORIES] as FilterValue[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                filter === f ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/60",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-charcoal-700 bg-charcoal-900/50 px-4 py-8 text-center text-sm text-parchment/50">
            No videos match this filter yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((video) => (
              <VideoCard key={video.youtubeId} video={video} study={getVideoStudy(video.youtubeId)} onOpen={() => setOpenVideo(video)} />
            ))}
          </div>
        )}
      </section>

      {/* Keyed by video id: opening a different video is a fresh mount, so
          its saved study state loads cleanly and no unsaved edit from a
          previously open video can leak into the next one. */}
      <VideoStudySheet key={openVideo?.youtubeId ?? "none"} video={openVideo} open={openVideo != null} onClose={() => setOpenVideo(null)} />
    </div>
  );
}
