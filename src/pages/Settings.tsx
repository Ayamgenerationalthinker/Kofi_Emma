import { useRef, useState } from "react";
import { Download, Upload, Trash2, BellRing } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { updateUser } from "../services/profileService";
import { getSettings, updateSettings, getReminderSettings, updateReminderSettings } from "../services/settingsService";
import { downloadExport, importData } from "../services/exportImportService";
import { resetProgress } from "../services/dataService";
import { isNotificationSupported, requestNotificationPermission } from "../lib/notifications";
import { AppError } from "../lib/errors";
import type { User } from "../lib/types";

// Profile, practice defaults, notifications, theme, and data
// (export/import/reset). Everything here is stored locally on this device —
// no analytics, no third-party sync, no server involved at all.
export function Settings() {
  const { user } = useAppContext();
  useLocalDbVersion();
  const settings = getSettings();
  const reminderSettings = getReminderSettings();

  const [name, setName] = useState(user!.name);
  const [experienceLevel, setExperienceLevel] = useState<User["experienceLevel"]>(user!.experienceLevel);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    isNotificationSupported() ? Notification.permission : "unsupported"
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [resetConfirming, setResetConfirming] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSaveProfile() {
    try {
      updateUser({ name, experienceLevel });
      setSaveMessage("Profile saved.");
    } catch (err) {
      setSaveMessage(err instanceof AppError ? err.message : "Could not save profile.");
    }
  }

  async function handleEnableNotifications() {
    const permission = await requestNotificationPermission();
    setNotifPermission(permission);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = importData(parsed);
      setImportMessage(`Imported ${result.progress} progress records and ${result.attempts} attempts.`);
    } catch (err) {
      setImportMessage(err instanceof AppError ? err.message : "That file could not be imported.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleReset() {
    if (!resetConfirming) {
      setResetConfirming(true);
      return;
    }
    resetProgress();
    setResetConfirming(false);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black">Settings</h1>

      <SettingsSection title="Profile">
        <FieldRow label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </FieldRow>
        <FieldRow label="Experience level">
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as User["experienceLevel"])} className="input">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </FieldRow>
        <button type="button" onClick={handleSaveProfile} className="rounded-md bg-gold-500 px-4 py-2 text-sm font-bold text-charcoal-950 hover:bg-gold-400">
          Save Profile
        </button>
      </SettingsSection>

      <SettingsSection title="Practice">
        <FieldRow label="Preferred duration (minutes)">
          <input
            type="number"
            min={10}
            max={180}
            value={settings.preferredDurationMinutes}
            onChange={(e) => updateSettings({ preferredDurationMinutes: Number(e.target.value) })}
            className="input"
          />
        </FieldRow>
        <FieldRow label="Accuracy threshold (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={settings.accuracyThreshold}
            onChange={(e) => updateSettings({ accuracyThreshold: Number(e.target.value) })}
            className="input"
          />
        </FieldRow>
        <FieldRow label="Default BPM increase">
          <input
            type="number"
            min={1}
            max={20}
            value={settings.defaultBpmIncrease}
            onChange={(e) => updateSettings({ defaultBpmIncrease: Number(e.target.value) })}
            className="input"
          />
        </FieldRow>
        <FieldRow label="Metronome volume">
          <input
            type="range"
            min={0}
            max={100}
            value={settings.metronomeVolume}
            onChange={(e) => updateSettings({ metronomeVolume: Number(e.target.value) })}
            className="w-full accent-gold-500"
          />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <p className="mb-2 flex items-start gap-2 text-xs text-parchment/50">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
          Browser notifications only fire while this app is open in a tab — the browser cannot guarantee background
          delivery when it's fully closed. Use the calendar export for guaranteed reminders.
        </p>
        {notifPermission !== "granted" && notifPermission !== "unsupported" && (
          <button type="button" onClick={handleEnableNotifications} className="mb-3 rounded-md border border-gold-500 px-3 py-1.5 text-sm text-gold-300">
            Enable browser notifications
          </button>
        )}
        <ToggleRow
          label="Notifications on"
          checked={reminderSettings.notificationsOn}
          onChange={(v) => updateReminderSettings({ notificationsOn: v })}
        />
        <ToggleRow label="Morning reminder" checked={reminderSettings.morningOn} onChange={(v) => updateReminderSettings({ morningOn: v })} />
        <FieldRow label="Morning time">
          <input
            type="time"
            value={reminderSettings.morningTime}
            onChange={(e) => updateReminderSettings({ morningTime: e.target.value })}
            className="input"
          />
        </FieldRow>
        <ToggleRow label="Evening reminder" checked={reminderSettings.eveningOn} onChange={(v) => updateReminderSettings({ eveningOn: v })} />
        <FieldRow label="Evening time">
          <input
            type="time"
            value={reminderSettings.eveningTime}
            onChange={(e) => updateReminderSettings({ eveningTime: e.target.value })}
            className="input"
          />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Theme">
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateSettings({ theme: t })}
              aria-pressed={settings.theme === t}
              className={[
                "rounded-md border px-4 py-2 text-sm capitalize",
                settings.theme === t ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </SettingsSection>

      {saveMessage && <p className="text-sm text-parchment/60">{saveMessage}</p>}

      <SettingsSection title="Data">
        <p className="mb-3 text-sm text-parchment/60">
          Your practice data is stored locally on this device (browser LocalStorage) and never sent anywhere. No
          third-party analytics or tracking, and no server exists to lose it — but that also means it does not
          sync across devices, and clearing your browser's site data will erase it. Export regularly if you want a
          backup.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadExport}
            className="flex items-center gap-2 rounded-md border border-charcoal-600 px-4 py-2 text-sm hover:border-gold-500"
          >
            <Download className="h-4 w-4" /> Export data
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-charcoal-600 px-4 py-2 text-sm hover:border-gold-500"
          >
            <Upload className="h-4 w-4" /> Import data
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          <button
            type="button"
            onClick={handleReset}
            className={[
              "flex items-center gap-2 rounded-md border px-4 py-2 text-sm",
              resetConfirming ? "border-red-500 bg-red-950/40 text-red-300" : "border-charcoal-600 text-parchment/70 hover:border-red-500",
            ].join(" ")}
          >
            <Trash2 className="h-4 w-4" /> {resetConfirming ? "Click again to confirm reset" : "Reset progress"}
          </button>
        </div>
        {importMessage && <p className="mt-2 text-sm text-parchment/60">{importMessage}</p>}
      </SettingsSection>

      <style>{`.input { width: 100%; border-radius: 0.375rem; border: 1px solid #38383E; background: #0B0B0C; padding: 0.5rem 0.75rem; }`}</style>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-charcoal-700 bg-charcoal-900/50 p-5">
      <h2 className="font-bold">{title}</h2>
      {children}
    </section>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-parchment/60">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-gold-500" />
    </label>
  );
}
