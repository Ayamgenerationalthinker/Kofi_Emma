import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoopPlayerEngine, type PlaybackStatus } from "../audio/LoopPlayerEngine";
import { loadShedTrackVoices } from "../audio/shedTrackAudio";
import type { ShedTrack, TrackSection } from "../data/shedTracks";

export interface VoiceMixInfo {
  name: string;
  volume: number;
  muted: boolean;
  soloed: boolean;
}

const CURRENT_TIME_UPDATE_INTERVAL_MS = 80;
const MIN_RATE = 0.5;
const MAX_RATE = 1.5;

/** The single hook both LoopPlayer and StemMixer are built on — one engine instance per open track, so transport state (playing/paused, current time, loop) and per-voice mixing always agree with each other. */
export function useShedTrackPlayer(track: ShedTrack) {
  const [engine] = useState(() => new LoopPlayerEngine());
  const engineRef = useRef(engine);

  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [status, setStatus] = useState<PlaybackStatus>("stopped");
  const [currentTime, setCurrentTime] = useState(0);
  const [rate, setRateState] = useState(1);
  const [loopSectionName, setLoopSectionName] = useState<TrackSection["name"] | null>(null);
  const [voiceNames, setVoiceNames] = useState<string[]>([]);
  const [voiceStates, setVoiceStates] = useState<Record<string, VoiceMixInfo>>({});
  const tapTimesRef = useRef<number[]>([]);
  const [tapDetectedBpm, setTapDetectedBpm] = useState<number | null>(null);

  // Loads this track's audio on mount. `cancelled` guards against a load
  // resolving after the component has already unmounted. This hook's
  // caller (ShedTrackDetail) keys its consumer by track.id, so a track
  // change is a fresh mount — the useState initializers above already
  // start at "loading"/"stopped"/0/null, so there's nothing to reset here.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // An OfflineAudioContext is just a buffer/decode factory here — it
      // never touches audio hardware and doesn't count against a browser's
      // small live-AudioContext limit, unlike creating a real AudioContext
      // per track load would.
      const decodeCtx = new OfflineAudioContext(1, 1, 44100);
      try {
        const voices = await loadShedTrackVoices(track, decodeCtx);
        if (cancelled) return;
        if (!voices) {
          setLoadState("unavailable");
          setVoiceNames([]);
          return;
        }
        engineRef.current.loadVoices(voices);
        const names = engineRef.current.voiceNames;
        const initialStates: Record<string, VoiceMixInfo> = {};
        for (const name of names) {
          const state = engineRef.current.getVoiceState(name);
          initialStates[name] = { name, volume: state?.volume ?? 100, muted: state?.muted ?? false, soloed: engineRef.current.isSoloed(name) };
        }
        setVoiceNames(names);
        setVoiceStates(initialStates);
        setRateState(engineRef.current.playbackRate);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("unavailable");
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  useEffect(() => {
    const eng = engineRef.current;
    eng.onStatusChangeCallback(setStatus);
    return () => eng.onStatusChangeCallback(null);
  }, []);

  // Polls the engine's computed playback position while playing. A
  // requestAnimationFrame loop rather than setInterval so it never drifts
  // out of sync with the AudioContext's own clock, throttled so re-renders
  // stay cheap on a progress bar that doesn't need 60fps precision.
  useEffect(() => {
    if (status !== "playing") return;
    let rafId: number;
    let lastUpdate = 0;
    function tick(now: number) {
      if (now - lastUpdate >= CURRENT_TIME_UPDATE_INTERVAL_MS) {
        setCurrentTime(engineRef.current.getCurrentTime());
        lastUpdate = now;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [status]);

  useEffect(() => {
    // engineRef is set once from the lazy useState initializer above and
    // never reassigned; copied to a local so the cleanup doesn't read
    // `.current` directly (which the linter can't prove is still the same
    // instance at unmount time).
    const engineInstance = engineRef.current;
    return () => engineInstance.dispose();
  }, []);

  const play = useCallback(() => {
    void engineRef.current.play();
  }, []);

  const pause = useCallback(() => {
    engineRef.current.pause();
    setCurrentTime(engineRef.current.getCurrentTime());
  }, []);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else play();
  }, [status, play, pause]);

  const restart = useCallback(() => {
    engineRef.current.restart();
    setCurrentTime(engineRef.current.getCurrentTime());
  }, []);

  const seek = useCallback((seconds: number) => {
    engineRef.current.seek(seconds);
    setCurrentTime(engineRef.current.getCurrentTime());
  }, []);

  const minBpm = Math.round(track.bpm * MIN_RATE);
  const maxBpm = Math.round(track.bpm * MAX_RATE);
  const bpm = Math.round(track.bpm * rate);

  const setBpm = useCallback(
    (nextBpm: number) => {
      const clampedBpm = Math.max(minBpm, Math.min(maxBpm, nextBpm));
      const nextRate = clampedBpm / track.bpm;
      engineRef.current.setPlaybackRate(nextRate);
      setRateState(engineRef.current.playbackRate);
    },
    [minBpm, maxBpm, track.bpm]
  );

  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 8) taps.shift();
    if (taps.length < 2) {
      setTapDetectedBpm(null);
      return;
    }
    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const detected = Math.max(minBpm, Math.min(maxBpm, Math.round(60000 / avgMs)));
    setTapDetectedBpm(detected);
  }, [minBpm, maxBpm]);

  const acceptTapTempo = useCallback(() => {
    if (tapDetectedBpm != null) {
      setBpm(tapDetectedBpm);
      setTapDetectedBpm(null);
      tapTimesRef.current = [];
    }
  }, [tapDetectedBpm, setBpm]);

  const setLoopSection = useCallback(
    (section: TrackSection | null) => {
      engineRef.current.setLoop(section ? { start: section.startSeconds, end: section.endSeconds } : null);
      setLoopSectionName(section?.name ?? null);
    },
    []
  );

  const toggleLoop = useCallback(() => {
    if (loopSectionName) {
      setLoopSection(null);
      return;
    }
    const firstLoopable = track.sections.find((s) => track.loopableRegionNames.includes(s.name));
    setLoopSection(firstLoopable ?? null);
  }, [loopSectionName, setLoopSection, track.sections, track.loopableRegionNames]);

  const currentSection = useMemo<TrackSection | null>(() => {
    return track.sections.find((s) => currentTime >= s.startSeconds && currentTime < s.endSeconds) ?? track.sections.at(-1) ?? null;
  }, [track.sections, currentTime]);

  const setVoiceVolume = useCallback((name: string, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    engineRef.current.setVoiceVolume(name, clamped);
    setVoiceStates((prev) => (prev[name] ? { ...prev, [name]: { ...prev[name], volume: clamped } } : prev));
  }, []);

  const setVoiceMuted = useCallback((name: string, muted: boolean) => {
    engineRef.current.setVoiceMuted(name, muted);
    setVoiceStates((prev) => (prev[name] ? { ...prev, [name]: { ...prev[name], muted } } : prev));
  }, []);

  const toggleSolo = useCallback((name: string) => {
    engineRef.current.toggleSolo(name);
    const soloed = engineRef.current.isSoloed(name);
    setVoiceStates((prev) => (prev[name] ? { ...prev, [name]: { ...prev[name], soloed } } : prev));
  }, []);

  const voices = useMemo<VoiceMixInfo[]>(() => voiceNames.map((name) => voiceStates[name]).filter((v): v is VoiceMixInfo => v != null), [
    voiceNames,
    voiceStates,
  ]);

  return {
    loadState,
    status,
    isPlaying: status === "playing",
    currentTime,
    duration: engine.duration,
    bpm,
    minBpm,
    maxBpm,
    nativeBpm: track.bpm,
    setBpm,
    tapTempo,
    tapDetectedBpm,
    acceptTapTempo,
    play,
    pause,
    toggle,
    restart,
    seek,
    loopSectionName,
    setLoopSection,
    toggleLoop,
    currentSection,
    voices,
    setVoiceVolume,
    setVoiceMuted,
    toggleSolo,
  };
}
