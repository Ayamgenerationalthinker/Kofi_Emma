import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { MetronomeEngine, clampBpm, MIN_BPM, MAX_BPM, type StepDefinition } from "../audio/MetronomeEngine";

export interface UseMetronomeOptions {
  steps: StepDefinition[];
  subdivision: string;
  initialBpm: number;
  initialVolume?: number;
}

export function useMetronome({ steps, subdivision, initialBpm, initialVolume = 80 }: UseMetronomeOptions) {
  const tapTimesRef = useRef<number[]>([]);

  // Lazy useState initializers (rather than a ref set during render) give a
  // stable, once-only-constructed engine instance without ever touching
  // ref.current outside an effect or event handler.
  const [audioEngine] = useState(() => new AudioEngine());
  const [metronome] = useState(() => new MetronomeEngine(audioEngine));
  const audioEngineRef = useRef(audioEngine);
  const metronomeRef = useRef(metronome);

  const [bpm, setBpmState] = useState(clampBpm(initialBpm));
  const [volume, setVolumeState] = useState(initialVolume);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [tapDetectedBpm, setTapDetectedBpm] = useState<number | null>(null);

  useEffect(() => {
    audioEngineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const engine = metronomeRef.current!;
    const unsubscribe = engine.onStep((step) => {
      setCurrentStepIndex(step.index % Math.max(1, steps.length));
    });
    return unsubscribe;
  }, [steps.length]);

  useEffect(() => {
    if (isRunning) {
      metronomeRef.current?.setTempo(bpm, subdivision);
    }
  }, [bpm, subdivision, isRunning]);

  useEffect(() => {
    return () => {
      metronomeRef.current?.stop();
      audioEngineRef.current?.dispose();
    };
  }, []);

  const start = useCallback(async () => {
    if (steps.length === 0) return;
    await metronomeRef.current?.start(steps, bpm, subdivision);
    setIsRunning(true);
  }, [steps, bpm, subdivision]);

  const stop = useCallback(() => {
    metronomeRef.current?.stop();
    setIsRunning(false);
    setCurrentStepIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) stop();
    else start();
  }, [isRunning, start, stop]);

  const setBpm = useCallback((next: number) => {
    setBpmState(clampBpm(next));
  }, []);

  const setVolume = useCallback((next: number) => {
    setVolumeState(Math.max(0, Math.min(100, next)));
  }, []);

  // Section 49: average the last few tap intervals, discard long pauses, clamp to the valid BPM range.
  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 8) taps.shift();

    if (taps.length < 2) {
      setTapDetectedBpm(null);
      return;
    }

    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const detected = clampBpm(Math.round(60000 / avgMs));
    setTapDetectedBpm(detected);
  }, []);

  const acceptTapTempo = useCallback(() => {
    if (tapDetectedBpm != null) {
      setBpmState(tapDetectedBpm);
      setTapDetectedBpm(null);
      tapTimesRef.current = [];
    }
  }, [tapDetectedBpm]);

  return useMemo(
    () => ({
      bpm,
      setBpm,
      minBpm: MIN_BPM,
      maxBpm: MAX_BPM,
      volume,
      setVolume,
      isRunning,
      currentStepIndex,
      start,
      stop,
      toggle,
      tapTempo,
      tapDetectedBpm,
      acceptTapTempo,
    }),
    [bpm, setBpm, volume, setVolume, isRunning, currentStepIndex, start, stop, toggle, tapTempo, tapDetectedBpm, acceptTapTempo]
  );
}
