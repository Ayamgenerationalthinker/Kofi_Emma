import { getDb, mutate, type ReminderSettingsRecord, type UserSettingsRecord, type MetronomePreferencesRecord } from "../lib/localDb";

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
