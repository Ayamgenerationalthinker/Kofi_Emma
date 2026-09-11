import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Gauge } from "lucide-react";
import { getTrack } from "../data/shedTracks";
import { useShedTrackPlayer } from "../hooks/useShedTrackPlayer";
import { LoopPlayer } from "../components/shedTracks/LoopPlayer";
import { StemMixer } from "../components/shedTracks/StemMixer";
import { EmptyState } from "../components/StatusStates";

function BackLink() {
  return (
    <Link to="/shed-tracks" className="inline-flex items-center gap-1.5 text-sm font-medium text-parchment/60 hover:text-parchment">
      <ArrowLeft className="h-4 w-4" /> Shed Tracks
    </Link>
  );
}

// A track's practice room: metadata up top, the shared player/mixer engine
// below. One `useShedTrackPlayer` instance feeds both the Loop Player and
// the Stem Mixer so muting Drums, looping the Chorus, and nudging the BPM
// all stay in sync with each other and with actual playback.
export function ShedTrackDetail() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = trackId ? getTrack(trackId) : undefined;

  if (!track) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState message="This track doesn't exist." />
      </div>
    );
  }

  // Keyed by track id: navigating to a different track must start every
  // piece of transport/mix state (load state, position, loop, voices)
  // completely fresh rather than carrying over the previous track's state
  // into a live instance — a full remount is the correct tool for that,
  // not an effect that resets state after the fact.
  return <ShedTrackDetailContent key={track.id} track={track} />;
}

function ShedTrackDetailContent({ track }: { track: NonNullable<ReturnType<typeof getTrack>> }) {
  const player = useShedTrackPlayer(track);

  return (
    <div className="space-y-6">
      <BackLink />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-gold-400">{track.genre}</span>
        </div>
        <h1 className="mt-1 text-2xl font-black">{track.title}</h1>
        <p className="mt-2 text-parchment/80">{track.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-parchment/60">
          <span className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4" /> {track.bpm} BPM native
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {Math.round(track.durationSeconds)}s
          </span>
          <span>Difficulty {track.difficulty}/5</span>
          <span className="text-parchment/40">{track.source}</span>
        </div>
      </header>

      <LoopPlayer player={player} track={track} />
      <StemMixer player={player} />
    </div>
  );
}
