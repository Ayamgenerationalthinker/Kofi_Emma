import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "abele_pwa_install_dismissed_at";
const COOLDOWN_DAYS = 3;

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function checkIsIos(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone] = useState<boolean>(checkIsStandalone);
  const [isIos] = useState<boolean>(checkIsIos);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Check dismissal cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < COOLDOWN_DAYS) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS and not standalone, show after a short delay
    if (isIos && !isStandalone) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (isStandalone || !visible || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border border-gold-500/50 bg-charcoal-900/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 sm:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gold-500/10 p-2.5 text-gold-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-parchment">Install Abele Drums Coach</h4>
            <p className="mt-0.5 text-xs text-parchment/70">
              Practice offline anywhere. 100% drum curriculum, metronome, and audio engine without internet.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-parchment/40 hover:bg-charcoal-800 hover:text-parchment"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIosInstructions ? (
        <div className="mt-3 rounded-xl border border-charcoal-700 bg-charcoal-800/80 p-3 text-xs text-parchment/80">
          <p className="font-semibold text-gold-300">To install on iPhone / iPad:</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-parchment/70">
            <li>Tap the <strong className="text-parchment">Share</strong> button at the bottom of Safari.</li>
            <li>Scroll down and tap <strong className="text-parchment">Add to Home Screen</strong>.</li>
            <li>Tap <strong className="text-parchment">Add</strong> in the top-right corner.</li>
          </ol>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex flex-1 min-h-[40px] items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2 text-xs font-bold text-charcoal-950 shadow-md transition hover:bg-gold-400 active:scale-95"
          >
            <Download className="h-4 w-4" />
            {isIos ? "HOW TO INSTALL ON IOS" : "INSTALL APP"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[40px] rounded-xl border border-charcoal-700 bg-charcoal-800 px-4 py-2 text-xs font-semibold text-parchment/60 hover:text-parchment"
          >
            NOT NOW
          </button>
        </div>
      )}
    </div>
  );
}
