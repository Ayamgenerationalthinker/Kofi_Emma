import { useSyncExternalStore } from "react";
import { subscribe, getVersion } from "../lib/localDb";

/**
 * Subscribes a component to the LocalStorage-backed store. Every `mutate()`
 * call anywhere in the app bumps a version counter and notifies
 * subscribers, so any component that calls this hook re-renders on every
 * change — this is the mechanism that replaces fetch/refetch entirely now
 * that there is no server to poll.
 *
 * Deliberately does NOT accept a selector: the store mutates nested objects
 * in place (see localDb.ts), so selector output can't be trusted for
 * reference-equality bail-outs. Call this once per component that needs to
 * react to store changes, then read derived data with the plain service
 * functions (getCurriculumState(), getProgressSummary(), etc.) in the render
 * body — cheap enough at this app's scale to just recompute on every render.
 */
export function useLocalDbVersion(): number {
  return useSyncExternalStore(subscribe, getVersion);
}
