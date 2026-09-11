// Generates a short, clearly-synthetic audio buffer entirely in the
// browser via Web Audio — no binary file, no network request, no URL of
// any kind. This is the one and only "audio" the Shed Tracks / Stem Mixer
// architecture can actually play until real production files are added
// (see docs/SHED_TRACKS_ASSETS.md); it exists purely to prove the player
// mechanics (play/pause/loop/BPM/mute/solo) genuinely work, not to
// resemble a finished track.

const DEMO_DURATION_SECONDS = 8;
const DEMO_BPM = 100;

/** A short pulsing tone at `frequencyHz` — pulses (not a constant drone) so playback is audibly obvious and distinguishable per "stem" by pitch. */
export function generateDemoBuffer(ctx: BaseAudioContext, frequencyHz: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * DEMO_DURATION_SECONDS);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const beatsPerSecond = DEMO_BPM / 60;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const beatPhase = (t * beatsPerSecond) % 1;
    const pulseWidth = 0.08;
    const envelope = beatPhase < pulseWidth ? Math.sin((beatPhase / pulseWidth) * Math.PI) : 0;
    data[i] = envelope * 0.2 * Math.sin(2 * Math.PI * frequencyHz * t);
  }

  return buffer;
}

export const DEMO_TRACK_BPM = DEMO_BPM;

export const DEMO_STEM_FREQUENCIES: Record<string, number> = {
  Drums: 110,
  Bass: 82,
  Keys: 220,
  Guitar: 165,
  Vocals: 330,
  Percussion: 440,
};
