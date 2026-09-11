import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2, BellRing } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { LoadingState, ErrorState } from "../components/StatusStates";
import { api, ApiError, downloadFile } from "../lib/apiClient";
import { useAppContext } from "../context/AppContext";
import { isNotificationSupported, requestNotificationPermission } from "../lib/notifications";
import type { User, Settings as SettingsDto, ReminderSettings } from "../lib/types";

interface SettingsResponse {
  user: User;
  settings: SettingsDto;
  reminderSettings: ReminderSettings;
}

// Section 31/32/66: profile, practice defaults, notifications, theme, and
// data (export/import/reset). Data is stored locally on this device only —
// no analytics, no third-party sync.
export function Settings() {
  const { data, loading, error, refetch } = useFetch<SettingsResponse>("/settings");
  const { setUser, refreshUser } = useAppContext();

  const [name, setName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<User["experienceLevel"]>("INTERMEDIATE");
  const [preferredDuration, setPreferredDuration] = useState(55);
  const [accuracyThreshold, setAccuracyThreshold] = useState(90);
  const [defaultBpmIncrease, setDefaultBpmIncrease] = useState(5);
  const [metronomeVolume, setMetronomeVolume] = useState(80);
  const [theme, setTheme] = useState<SettingsDto["theme"]>("system");
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [morningOn, setMorningOn] = useState(true);
  const [eveningOn, setEveningOn] = useState(true);
  const [morningTime, setMorningTime] = useState("07:00");
  const [eveningTime, setEveningTime] = useState("19:00");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    isNotificationSupported() ? Notification.permission : "unsupported"
  );

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [resetConfirming, setResetConfirming] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setName(data.user.name);
    setExperienceLevel(data.user.experienceLevel);
    setPreferredDuration(data.settings.preferredDurationMinutes);
    setAccuracyThreshold(data.settings.accuracyThreshold);
    setDefaultBpmIncrease(data.settings.defaultBpmIncrease);
    setMetronomeVolume(data.settings.metronomeVolume);
    setTheme(data.settings.theme);
    setNotificationsOn(data.reminderSettings.notificationsOn);
    setMorningOn(data.reminderSettings.morningOn);
    setEveningOn(data.reminderSettings.eveningOn);
    setMorningTime(data.reminderSettings.morningTime);
    setEveningTime(data.reminderSettings.eveningTime);
  }, [data]);

  if (loading) return <LoadingState label="Loading settings..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data) return null;

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const { user } = await api.put<{ user: User }>("/profile", { name, experienceLevel });
      setUser(user);
      await api.put("/settings", {
        settings: {
          preferredDurationMinutes: preferredDuration,
          accuracyThreshold,
          defaultBpmIncrease,
          metronomeVolume,
          theme,
        },
        reminderSettings: { notificationsOn, morningOn, eveningOn, morningTime, eveningTime },
      });
      setSaveMessage("Settings saved.");
    } catch (err) {
      setSaveMessage(err instanceof ApiError ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
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
      const result = await api.post<{ imported: { progress: number; attempts: number } }>("/import", parsed);
      setImportMessage(`Imported ${result.imported.progress} progress records and ${result.imported.attempts} attempts.`);
      refreshUser();
    } catch (err) {
      setImportMessage(err instanceof ApiError ? err.message : "That file could not be imported.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleReset() {
    if (!resetConfirming) {
      setResetConfirming(true);
      return;
    }
    await api.post("/data/reset", { confirm: "RESET" });
    setResetConfirming(false);
    refetch();
    refreshUser();
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
      </SettingsSection>

      <SettingsSection title="Practice">
        <FieldRow label="Preferred duration (minutes)">
          <input type="number" min={10} max={180} value={preferredDuration} onChange={(e) => setPreferredDuration(Number(e.target.value))} className="input" />
        </FieldRow>
        <FieldRow label="Accuracy threshold (%)">
          <input type="number" min={0} max={100} value={accuracyThreshold} onChange={(e) => setAccuracyThreshold(Number(e.target.value))} className="input" />
        </FieldRow>
        <FieldRow label="Default BPM increase">
          <input type="number" min={1} max={20} value={defaultBpmIncrease} onChange={(e) => setDefaultBpmIncrease(Number(e.target.value))} className="input" />
        </FieldRow>
        <FieldRow label="Metronome volume">
          <input type="range" min={0} max={100} value={metronomeVolume} onChange={(e) => setMetronomeVolume(Number(e.target.value))} className="w-full accent-gold-500" />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <p className="mb-2 flex items-start gap-2 text-xs text-parchment/50">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
          Browser notifications only fire while this app is open in a tab — the browser cannot guarantee background delivery when it's fully closed. Use the calendar export for guaranteed reminders.
        </p>
        {notifPermission !== "granted" && notifPermission !== "unsupported" && (
          <button type="button" onClick={handleEnableNotifications} className="mb-3 rounded-md border border-gold-500 px-3 py-1.5 text-sm text-gold-300">
            Enable browser notifications
          </button>
        )}
        <ToggleRow label="Notifications on" checked={notificationsOn} onChange={setNotificationsOn} />
        <ToggleRow label="Morning reminder" checked={morningOn} onChange={setMorningOn} />
        <FieldRow label="Morning time">
          <input type="time" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} className="input" />
        </FieldRow>
        <ToggleRow label="Evening reminder" checked={eveningOn} onChange={setEveningOn} />
        <FieldRow label="Evening time">
          <input type="time" value={eveningTime} onChange={(e) => setEveningTime(e.target.value)} className="input" />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Theme">
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={["rounded-md border px-4 py-2 text-sm capitalize", theme === t ? "border-gold-500 bg-gold-500/10 text-gold-300" : "border-charcoal-600 text-parchment/70"].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </SettingsSection>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-gold-500 px-6 py-2.5 font-bold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saveMessage && <span className="text-sm text-parchment/60">{saveMessage}</span>}
      </div>

      <SettingsSection title="Data">
        <p className="mb-3 text-sm text-parchment/60">Your practice data is stored locally on this device. No third-party analytics or tracking.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadFile("/export", "gospel-drum-coach-export.json")}
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
