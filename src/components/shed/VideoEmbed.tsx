import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

// Official YouTube embed with offline fallback — never shows a broken iframe when offline.
export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-charcoal-800 bg-charcoal-950 p-6 text-center"
        style={{ aspectRatio: "16 / 9" }}
      >
        <div className="rounded-full bg-charcoal-900 p-3 text-gold-400">
          <WifiOff className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-parchment">External Video Requires Internet</p>
        <p className="text-xs text-parchment/60 max-w-xs">
          Connect to Wi-Fi or mobile data to stream this external demonstration. All core lessons, audio synthesis, metronome, and practice tracking work 100% offline!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
