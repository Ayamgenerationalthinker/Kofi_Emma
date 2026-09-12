import { CheckCircle2, Heart, PlayCircle } from "lucide-react";
import type { KofiEmmaVideo } from "../../data/kofiEmmaVideos";
import type { VideoStudyRecord } from "../../lib/localDb";

export function VideoCard({ video, study, onOpen }: { video: KofiEmmaVideo; study: VideoStudyRecord; onOpen: () => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-charcoal-700 bg-charcoal-900/50 transition-colors hover:border-gold-500/40">
      <button type="button" onClick={onOpen} className="group relative block w-full shrink-0">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
          alt=""
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
          <PlayCircle className="h-9 w-9 text-white/90" aria-hidden="true" />
        </span>
        {study.watched && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-charcoal-950/80 px-1.5 py-0.5 text-[9px] font-medium text-gold-300">
            <CheckCircle2 className="h-2.5 w-2.5" /> Watched
          </span>
        )}
        {study.favorite && (
          <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal-950/80 text-red-400">
            <Heart className="h-3 w-3 fill-current" />
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-2.5">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="rounded-full border border-gold-600/40 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gold-300">
            {video.category}
          </span>
          {video.level != null && (
            <span className="rounded-full border border-charcoal-600 px-1.5 py-0.5 text-[9px] text-parchment/50">Lvl {video.level}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-xs font-bold leading-snug">{video.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-parchment/50">{video.focus}</p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 min-h-[32px] rounded-md border border-gold-500/50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-300 hover:bg-gold-500/10"
        >
          Watch Study
        </button>
      </div>
    </div>
  );
}
