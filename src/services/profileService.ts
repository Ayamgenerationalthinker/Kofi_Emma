import { getDb, mutate, newId, type ExperienceLevel } from "../lib/localDb";
import { ensureProgressInitialized } from "./curriculumService";
import { Errors } from "../lib/errors";

export function getUser() {
  return getDb().user;
}

export function requireUser() {
  const user = getUser();
  if (!user) throw Errors.noUser();
  return user;
}

export interface CreateUserInput {
  name: string;
  experienceLevel: ExperienceLevel;
  timezone: string;
  morningOn: boolean;
  eveningOn: boolean;
  morningTime: string;
  eveningTime: string;
}

// First-run onboarding: creates the single local profile and seeds their
// reminder preferences. There is exactly one profile per browser/device —
// multi-user support is out of scope for a LocalStorage-backed app.
export function createUser(input: CreateUserInput) {
  if (getUser()) throw Errors.conflict("A local profile already exists.");

  const nowIso = new Date().toISOString();
  mutate((db) => {
    db.user = {
      id: newId(),
      name: input.name,
      experienceLevel: input.experienceLevel,
      timezone: input.timezone,
      onboardedAt: nowIso,
      createdAt: nowIso,
    };
    db.reminderSettings = {
      notificationsOn: true,
      morningOn: input.morningOn,
      eveningOn: input.eveningOn,
      morningTime: input.morningTime,
      eveningTime: input.eveningTime,
    };
  });

  ensureProgressInitialized();
  return getUser()!;
}

export function updateUser(partial: Partial<{ name: string; experienceLevel: ExperienceLevel; timezone: string }>) {
  mutate((db) => {
    if (!db.user) return;
    Object.assign(db.user, partial);
  });
  return requireUser();
}
