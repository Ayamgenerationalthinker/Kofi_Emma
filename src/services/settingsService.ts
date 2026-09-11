import {
  getDb,
  mutate,
  type ReminderSettingsRecord,
  type UserSettingsRecord,
  type MetronomePreferencesRecord,
  type OnboardingProfileRecord,
  type PracticeGoal,
} from "../lib/localDb";

export function getSettings(): UserSettingsRecord {
  return getDb().settings;
}

export function updateSettings(partial: Partial<UserSettingsRecord>): UserSettingsRecord {
  mutate((db) => {
    db.settings = { ...db.settings, ...partial };
  });
  return getSettings();
}

export function getReminderSettings(): ReminderSettingsRecord {
  return getDb().reminderSettings;
}

export function updateReminderSettings(partial: Partial<ReminderSettingsRecord>): ReminderSettingsRecord {
  mutate((db) => {
    db.reminderSettings = { ...db.reminderSettings, ...partial };
  });
  return getReminderSettings();
}

export function getMetronomePreferences(): MetronomePreferencesRecord {
  return getDb().metronome;
}

export function updateMetronomePreferences(partial: Partial<MetronomePreferencesRecord>): MetronomePreferencesRecord {
  mutate((db) => {
    db.metronome = { ...db.metronome, ...partial };
  });
  return getMetronomePreferences();
}

export function getOnboardingProfile(): OnboardingProfileRecord {
  return getDb().onboardingProfile;
}

export function saveOnboardingProfile(goals: PracticeGoal[], experienceDescription: OnboardingProfileRecord["experienceDescription"]): void {
  mutate((db) => {
    db.onboardingProfile = { goals, experienceDescription };
  });
}

/** Section 5 (UX spec): the "keep your progress safe" account prompt is shown once, gently, after meaningful progress — never forced at onboarding, never nagged. */
export function shouldShowAccountPrompt(): boolean {
  return getDb().settings.accountPromptDismissedAt == null;
}

export function dismissAccountPrompt(): void {
  updateSettings({ accountPromptDismissedAt: new Date().toISOString() });
}
