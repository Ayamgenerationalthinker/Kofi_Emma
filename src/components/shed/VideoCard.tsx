import { CheckCircle2, Heart, PlayCircle } from "lucide-react";
import type { KofiEmmaVideo } from "../../data/kofiEmmaVideos";
import type { VideoStudyRecord } from "../../lib/localDb";

export function VideoCard({ video, study, onOpen }: { video: KofiEmmaVideo; study: VideoStudyRecord; onOpen: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-charcoal-700 bg-charcoal-900/50">
      <button type="button" onClick={onOpen} className="relative block w-full">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
          alt=""
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/40">
          <PlayCircle className="h-12 w-12 text-white/90" aria-hidden="true" />
        </span>
        {study.watched && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-charcoal-950/80 px-2 py-0.5 text-[10px] font-medium text-gold-300">
            <CheckCircle2 className="h-3 w-3" /> Watched
          </span>
        )}
        {study.favorite && (
          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal-950/80 text-red-400">
            <Heart className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
      </button>
      <div className="p-3">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gold-600/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold-300">
            {video.category}
          </span>
          {video.level != null && (
            <span className="rounded-full border border-charcoal-600 px-2 py-0.5 text-[10px] text-parchment/50">Level {video.level}</span>
          )}
        </div>
        <h3 className="break-words text-sm font-bold leading-snug">{video.title}</h3>
        <p className="mt-1 break-words text-xs text-parchment/50">{video.focus}</p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 min-h-[36px] rounded-md border border-gold-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-300 hover:bg-gold-500/10"
        >
          Watch Study
        </button>
      </div>
    </div>
  );
}
