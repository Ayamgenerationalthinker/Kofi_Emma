import { useState } from "react";
import { Heart } from "lucide-react";
import { ActionSheet } from "../ui/ActionSheet";
import { VideoEmbed } from "./VideoEmbed";
import type { KofiEmmaVideo } from "../../data/kofiEmmaVideos";
import { getVideoStudy, markWatched, toggleFavorite, saveStudyNotes } from "../../services/videoStudyService";

// Section 50/82: after watching, the drummer checks off what they noticed
// rather than passively closing the video — turning a video into a study
// loop instead of a distraction.
const NOTICE_OPTIONS = [
  "Pocket",
  "Kick placement",
  "Hi-hat articulation",
  "Ghost notes",
  "Linear sticking",
  "Fills",
  "Transitions",
  "Dynamics",
  "Tempo",
  "Independence",
];

// Callers (Shed.tsx) key this component by `video.youtubeId`, so opening a
// different video is a fresh mount rather than the same instance being
// reused — these lazy initializers read that video's saved study state
// once, at mount, which is what a reset-on-prop-change effect would have
// produced anyway, without needing the effect at all.
export function VideoStudySheet({ video, open, onClose }: { video: KofiEmmaVideo | null; open: boolean; onClose: () => void }) {
  const study = video ? getVideoStudy(video.youtubeId) : null;
  const [notedAspects, setNotedAspects] = useState<string[]>(study?.notedAspects ?? []);
  const [notes, setNotes] = useState(study?.notes ?? "");
  const [favorite, setFavorite] = useState(study?.favorite ?? false);
  const [saved, setSaved] = useState(false);

  if (!video) return null;

  function toggleAspect(aspect: string) {
    setNotedAspects((prev) => (prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]));
  }

  function handleFavorite() {
    toggleFavorite(video!.youtubeId);
    setFavorite((v) => !v);
  }

  function handleShed() {
    markWatched(video!.youtubeId);
    saveStudyNotes(video!.youtubeId, notedAspects, notes);
    setSaved(true);
  }

  return (
    <ActionSheet open={open} onClose={onClose} title={video.title}>
      <div className="space-y-4">
        <VideoEmbed videoId={video.youtubeId} title={video.title} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-parchment/50">{video.description}</p>
          <button
            type="button"
            onClick={handleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-full border", favorite ? "border-red-500 text-red-400" : "border-charcoal-600 text-parchment/50"].join(" ")}
          >
            <Heart className={favorite ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-parchment/70">What did you notice?</h3>
          <div className="grid grid-cols-2 gap-2">
            {NOTICE_OPTIONS.map((aspect) => (
              <label
                key={aspect}
                className={[
                  "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  notedAspects.includes(aspect) ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={notedAspects.includes(aspect)}
                  onChange={() => toggleAspect(aspect)}
                  className="h-4 w-4 accent-gold-500"
                />
                {aspect}
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-parchment/60">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. The fill entrance lands a 16th note early."
            className="w-full rounded-md border border-charcoal-600 bg-charcoal-950 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={handleShed}
          className="w-full rounded-md bg-gold-500 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
        >
          {saved ? "Saved — Shed This Idea Again" : "Shed This Idea"}
        </button>
        {saved && <p className="text-center text-xs text-gold-300">Marked as watched and saved to your study notes.</p>}
      </div>
    </ActionSheet>
  );
}
