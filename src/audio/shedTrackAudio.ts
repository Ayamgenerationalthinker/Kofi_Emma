// Resolves a ShedTrack into a set of named, decoded AudioBuffers the
// LoopPlayerEngine can load — the one place that decides "where does this
// track's audio actually come from." See docs/SHED_TRACKS_ASSETS.md.
//
// Three cases, in priority order:
//  1. The architecture-demo track: synthesize six differently-pitched
//     voices in-browser (src/audio/demoTrackSource.ts) — no file, no
//     network request. Proves the player/mixer mechanics only.
//  2. A real track with `stems`: fetch + decode each stem file into its
//     own named voice, so the Stem Mixer controls real isolated parts.
//  3. A real track with only `audioUrl` (no stems): fetch + decode one
//     "master" voice — playable by the Loop Player, nothing to mix.
// Anything else (a placeholder track with `audioUrl: null` and
// `stems: null`) resolves to `null` — no fabricated audio, ever.

import type { ShedTrack } from "../data/shedTracks";
import { DEMO_STEM_FREQUENCIES, generateDemoBuffer } from "./demoTrackSource";

export async function loadShedTrackVoices(track: ShedTrack, ctx: BaseAudioContext): Promise<Record<string, AudioBuffer> | null> {
  if (track.isArchitectureDemo) {
    const voices: Record<string, AudioBuffer> = {};
    for (const [stem, frequencyHz] of Object.entries(DEMO_STEM_FREQUENCIES)) {
      voices[stem] = generateDemoBuffer(ctx, frequencyHz);
    }
    return voices;
  }

  if (track.stems && Object.keys(track.stems).length > 0) {
    const entries = Object.entries(track.stems) as [string, string][];
    const decoded = await Promise.all(entries.map(([, url]) => fetchAndDecode(url, ctx)));
    const voices: Record<string, AudioBuffer> = {};
    entries.forEach(([stem], i) => {
      voices[stem] = decoded[i];
    });
    return voices;
  }

  if (track.audioUrl) {
    return { master: await fetchAndDecode(track.audioUrl, ctx) };
  }

  return null;
}

async function fetchAndDecode(url: string, ctx: BaseAudioContext): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch audio asset: ${url} (${response.status})`);
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}
