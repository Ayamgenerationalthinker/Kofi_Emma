import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";
import { resetDb } from "../lib/localDb";

// Tests must be deterministic regardless of the developer machine's local
// `.env.local` — Vitest loads it the same way `vite dev` does, so without
// this, the entire "Supabase not configured / guest mode" test suite would
// silently start hitting the real network as soon as anyone runs cloud
// sync setup locally. Force guest mode for every test; a test that
// specifically needs `isSupabaseConfigured` true should stub these back
// with its own `vi.stubEnv` and call `vi.unstubAllEnvs()` in cleanup.
vi.stubEnv("VITE_SUPABASE_URL", "");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

// Every test starts from a clean LocalStorage-backed store — this is the
// one thing that would otherwise leak state between test files, since the
// store is a module-level singleton by design (it mirrors how the real
// app works: one store per browser tab).
beforeEach(() => {
  window.localStorage.clear();
  resetDb();
});

// Recharts (used on the Progress page) measures its container via
// ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
