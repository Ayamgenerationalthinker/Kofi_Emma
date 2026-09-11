import { mutate, resetDb as resetLocalDb, getDb } from "../lib/localDb";
import { ensureProgressInitialized } from "./curriculumService";

// Destructive: wipes practice history and resets every exercise back to
// LOCKED, then re-unlocks whatever has no prerequisites (Phase 1's first
// exercise) — exactly like a fresh install, minus the profile itself.
export function resetProgress(): void {
  const user = getDb().user;
  const settings = getDb().settings;
  const reminderSettings = getDb().reminderSettings;

  resetLocalDb();

  mutate((db) => {
    db.user = user;
    db.settings = settings;
    db.reminderSettings = reminderSettings;
  });

  ensureProgressInitialized();
}
