// The entire persistence layer for the app. There is no backend: this
// module is a tiny embedded JSON "database" backed by the browser's
// LocalStorage API. Every read is synchronous; every write updates an
// in-memory cache, persists it, and notifies subscribers via
// `useSyncExternalStore` (see `src/hooks/useLocalDb.ts`) so the whole UI
// reacts instantly without any fetch/loading ceremony.

import { STORAGE_KEY } from "./keys";
import { defaultDb, migrate, readLegacyData } from "./migrations";
import type { LocalDbShape } from "./types";

function isStorageAvailable(): boolean {
  try {
    const testKey = "__abele_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** True once we know whether writes actually persist (private browsing, quota, or SSR can all make this false). */
export const storageAvailable = typeof window !== "undefined" && isStorageAvailable();

function load(): LocalDbShape {
  if (!storageAvailable) return defaultDb();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));

    // Nothing under the current key yet — check for pre-rebrand data so a
    // returning user's progress carries forward instead of vanishing.
    const legacy = readLegacyData();
    if (legacy) return migrate(legacy);

    return defaultDb();
  } catch {
    // Malformed JSON the parser itself can't read: nothing can be salvaged
    // from that raw string, but this never throws past here — the app
    // starts from a fresh, valid store instead of a blank crash screen.
    return defaultDb();
  }
}

let cache: LocalDbShape = load();

// Mutations below write into `cache` in place (array pushes,
// Object.assign, etc.) rather than rebuilding the object graph — cheap and
// simple, but it means nested object/array references never change even
// when their contents do. So reactivity does NOT depend on reference
// equality of any slice of `cache`: a plain incrementing version number is
// the only thing `useSyncExternalStore` compares (see useLocalDb.ts), and
// every read goes through the service functions, which recompute fresh
// values straight from `cache` on every call.
let version = 0;
const listeners = new Set<() => void>();

function persist(): void {
  if (storageAvailable) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Quota exceeded or storage revoked mid-session — the in-memory cache
      // still works for the rest of this tab session, it just won't survive
      // a reload. There is nowhere else to put it for a backend-less app.
    }
  }
  version += 1;
  for (const listener of listeners) listener();
}

export function getDb(): LocalDbShape {
  return cache;
}

export function getVersion(): number {
  return version;
}

/** Mutate the store in place inside `fn`, then persist and notify subscribers. */
export function mutate(fn: (db: LocalDbShape) => void): void {
  fn(cache);
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDb(): void {
  cache = defaultDb();
  persist();
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
