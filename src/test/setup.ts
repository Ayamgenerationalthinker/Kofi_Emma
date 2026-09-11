import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { resetDb } from "../lib/localDb";

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
