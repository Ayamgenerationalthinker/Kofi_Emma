import { useState } from "react";
import { Mic, Activity, Info, ShieldCheck, Sparkles, AlertCircle, Volume2 } from "lucide-react";

export function MicCoach() {
  const [micActive, setMicActive] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const testMicrophone = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicActive(true);

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!stream.active) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setInputLevel(Math.min(100, Math.round((avg / 128) * 100)));
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err: any) {
      setMicError(err?.message || "Microphone access was denied or is not supported.");
      setMicActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-400">
          <Mic className="h-4 w-4" />
          Hardware & Acoustic Analysis
        </div>
        <div className="flex items-center gap-3">
          <h1 className="mt-1 text-2xl font-black md:text-3xl">Live Microphone Coach</h1>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
            Coming Soon / Architecture Preview
          </span>
        </div>
        <p className="mt-1 text-sm text-parchment/60">
          Real-time acoustic analysis for your acoustic kit or practice pad using low-latency Web Audio worklets.
        </p>
      </div>

      {/* Honest Feature Notice Card */}
      <div className="rounded-2xl border border-charcoal-800 bg-gradient-to-br from-charcoal-900 to-charcoal-950 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gold-500/10 p-3 text-gold-400">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-parchment">Honest Product Architecture</h2>
            <p className="mt-1 text-xs text-parchment/70 leading-relaxed">
              We never fake AI analysis or generate false timing scores. Full acoustic onset detection requires calibrated AudioWorklet processing to differentiate between kick, snare, and hi-hat transients in noisy rooms.
            </p>
          </div>
        </div>

        {/* Real Hardware Mic Test */}
        <div className="mt-8 rounded-xl border border-charcoal-800 bg-charcoal-950/70 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-parchment/70">Hardware Input Test</h3>
          <p className="mt-1 text-xs text-parchment/50">Test if your browser and microphone hardware are ready for real-time analysis:</p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={testMicrophone}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-2.5 text-xs font-bold text-charcoal-950 hover:bg-gold-400"
            >
              <Mic className="h-4 w-4" />
              {micActive ? "Microphone Connected" : "Test Browser Microphone"}
            </button>

            {micActive && (
              <div className="flex flex-1 items-center gap-3">
                <Volume2 className="h-4 w-4 text-gold-400" />
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-charcoal-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-success via-gold-400 to-danger transition-all duration-75"
                    style={{ width: `${inputLevel}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-gold-300">{inputLevel}%</span>
              </div>
            )}
          </div>

          {micError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{micError}</span>
            </div>
          )}
        </div>

        {/* Future Capabilities Architecture Matrix */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-4">
            <Activity className="h-5 w-5 text-gold-400" />
            <h4 className="mt-2 text-sm font-bold text-parchment">Sub-Millisecond Onset Detection</h4>
            <p className="mt-1 text-xs text-parchment/60">Detects whether you are rushing or dragging relative to the click transient.</p>
          </div>

          <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-4">
            <ShieldCheck className="h-5 w-5 text-gold-400" />
            <h4 className="mt-2 text-sm font-bold text-parchment">Limb Dynamic Separation</h4>
            <p className="mt-1 text-xs text-parchment/60">Spectrogram classification separating low-end kick thuds from snare high crack.</p>
          </div>

          <div className="rounded-xl border border-charcoal-800 bg-charcoal-900/50 p-4">
            <Sparkles className="h-5 w-5 text-gold-400" />
            <h4 className="mt-2 text-sm font-bold text-parchment">Endurance & Fatigue Tracking</h4>
            <p className="mt-1 text-xs text-parchment/60">Identifies when hand velocity drops during long 20-minute praise sets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
