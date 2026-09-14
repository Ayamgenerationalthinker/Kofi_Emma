import { useState, useEffect } from "react";
import { Download, CalendarDays, ExternalLink, Clock, Bell, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLocalDbVersion } from "../hooks/useLocalDb";
import { getReminderSettings } from "../services/settingsService";
import { generateTodayLesson, readTodayLesson } from "../services/practicePlannerService";
import {
  buildTodayIcs,
  buildCustomScheduleIcs,
  buildGoogleCalendarUrl,
  downloadTextFile,
  type PracticeScheduleOptions,
} from "../services/calendarService";
import { todayKey } from "../lib/dates";

type DayCode = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

const DAYS_MAP: { code: DayCode; label: string; full: string }[] = [
  { code: "MO", label: "Mon", full: "Monday" },
  { code: "TU", label: "Tue", full: "Tuesday" },
  { code: "WE", label: "Wed", full: "Wednesday" },
  { code: "TH", label: "Thu", full: "Thursday" },
  { code: "FR", label: "Fri", full: "Friday" },
  { code: "SA", label: "Sat", full: "Saturday" },
  { code: "SU", label: "Sun", full: "Sunday" },
];

export function CalendarPage() {
  const { user } = useAppContext();
  const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  useEffect(() => {
    generateTodayLesson(timezone);
  }, [timezone]);

  useLocalDbVersion();
  const reminders = getReminderSettings();
  const lesson = readTodayLesson(timezone);

  // Custom schedule state
  const [selectedDays, setSelectedDays] = useState<DayCode[]>(["MO", "TU", "WE", "TH", "FR", "SA"]);
  const [practiceTime, setPracticeTime] = useState<string>(reminders.morningTime || "07:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [reminderMinutes, setReminderMinutes] = useState<number>(10);
  const [focusArea, setFocusArea] = useState<string>("40 PAS Rudiments & Gospel Pocket");
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  function toggleDay(code: DayCode) {
    setSelectedDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  }

  function handleSelectAllDays() {
    setSelectedDays(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);
  }

  function handleWeekdaysOnly() {
    setSelectedDays(["MO", "TU", "WE", "TH", "FR"]);
  }

  const scheduleOptions: PracticeScheduleOptions = {
    timeZone: timezone,
    time: practiceTime,
    durationMinutes,
    days: selectedDays,
    reminderMinutesBefore: reminderMinutes,
    title: "Abele Drums Coach — Practice Shed",
    focusArea,
  };

  function downloadToday() {
    if (!lesson) return;
    const ics = buildTodayIcs({ dateKey: todayKey(timezone), timeZone: timezone, lesson });
    downloadTextFile(`abele-today-${todayKey(timezone)}.ics`, ics);
    setDownloadSuccess("Today's workout exported as .ICS");
    setTimeout(() => setDownloadSuccess(null), 4000);
  }

  function downloadCustomIcs() {
    if (selectedDays.length === 0) return;
    const ics = buildCustomScheduleIcs(scheduleOptions);
    downloadTextFile("abele-practice-schedule.ics", ics);
    setDownloadSuccess("Custom weekly schedule exported as .ICS");
    setTimeout(() => setDownloadSuccess(null), 4000);
  }

  function openGoogleCalendar() {
    if (selectedDays.length === 0) return;
    const url = buildGoogleCalendarUrl(scheduleOptions);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold-600/30 bg-gold-950/30 px-3 py-1 text-xs font-semibold text-gold-400">
          <CalendarDays className="h-3.5 w-3.5" /> RFC 5545 Calendar Integration
        </div>
        <h1 className="mt-2 text-2xl font-black md:text-3xl">Practice Calendar & Reminders</h1>
        <p className="mt-1 text-sm text-parchment/70">
          Add your practice routine to Google Calendar, Apple Calendar, Outlook, or any standard calendar app. No accounts or permissions required.
        </p>
      </div>

      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-950/40 p-4 text-sm text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{downloadSuccess} — open the downloaded file in your calendar app to import!</span>
        </div>
      )}

      {/* Today's Workout Quick-Export */}
      <div className="rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400">Today's Session</span>
            </div>
            <h2 className="text-lg font-bold">
              {lesson ? `${lesson.phaseTitle} — ${lesson.totalMinutes} Min Shed` : "Today's Practice Session"}
            </h2>
            <p className="text-xs text-parchment/60">
              {lesson
                ? `${lesson.lessonParts.length} structured exercises with target BPMs and sticking guides.`
                : "A single event for today with your curated daily drum workout."}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadToday}
            className="flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-bold text-charcoal-950 transition-colors hover:bg-gold-400"
          >
            <Download className="h-4 w-4" /> Download today.ics
          </button>
        </div>
      </div>

      {/* Weekly Practice Scheduler */}
      <div className="space-y-6 rounded-2xl border border-charcoal-700 bg-charcoal-900/60 p-5 md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400">Recurring Schedule</span>
          </div>
          <h2 className="mt-1 text-lg font-bold">Build Your Weekly Practice Routine</h2>
          <p className="text-xs text-parchment/60">
            Configure your regular shed schedule, reminder alerts, and export recurring events directly.
          </p>
        </div>

        {/* Days of the Week Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-parchment/70">Practice Days</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAllDays}
                className="text-xs text-gold-400 hover:text-gold-300"
              >
                All Days
              </button>
              <span className="text-xs text-charcoal-600">•</span>
              <button
                type="button"
                onClick={handleWeekdaysOnly}
                className="text-xs text-gold-400 hover:text-gold-300"
              >
                Mon–Fri
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_MAP.map(({ code, label }) => {
              const active = selectedDays.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleDay(code)}
                  className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                    active
                      ? "border-gold-500 bg-gold-500/20 text-gold-300"
                      : "border-charcoal-800 bg-charcoal-950/40 text-parchment/40 hover:border-charcoal-700 hover:text-parchment/70"
                  }`}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          {selectedDays.length === 0 && (
            <p className="text-xs text-amber-400">Select at least one day to create a recurring schedule.</p>
          )}
        </div>

        {/* Time and Duration Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-parchment/70">Practice Time</label>
            <input
              type="time"
              value={practiceTime}
              onChange={(e) => setPracticeTime(e.target.value)}
              className="w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-parchment focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-parchment/70">Duration</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-parchment focus:border-gold-500 focus:outline-none"
            >
              <option value={15}>15 Minutes (Express)</option>
              <option value={30}>30 Minutes (Standard)</option>
              <option value={45}>45 Minutes (Full Workout)</option>
              <option value={60}>60 Minutes (Intensive Shed)</option>
              <option value={90}>90 Minutes (Masterclass)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-parchment/70">
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3 w-3 text-gold-400" /> Alert Reminder
              </span>
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-parchment focus:border-gold-500 focus:outline-none"
            >
              <option value={0}>At time of event</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
            </select>
          </div>
        </div>

        {/* Focus Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-parchment/70">Routine Focus</label>
          <input
            type="text"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="e.g. 40 PAS Rudiments, Double Bass & Gospel Chops"
            className="w-full rounded-xl border border-charcoal-700 bg-charcoal-950 px-3 py-2 text-sm text-parchment focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="button"
            disabled={selectedDays.length === 0}
            onClick={openGoogleCalendar}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold-500/50 bg-gold-500/10 px-4 py-3 text-sm font-bold text-gold-300 transition-colors hover:bg-gold-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" /> Add to Google Calendar
          </button>

          <button
            type="button"
            disabled={selectedDays.length === 0}
            onClick={downloadCustomIcs}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-charcoal-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Download Apple / Device .ICS
          </button>
        </div>
      </div>

      {/* Educational Truthfulness & Privacy Guarantee */}
      <div className="rounded-2xl border border-charcoal-800 bg-charcoal-950/60 p-5 text-xs text-parchment/70">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-parchment">How Calendar Export Works</p>
            <p>
              Abele Drums Coach generates standard <strong className="text-parchment">RFC 5545 (.ics)</strong> calendar files locally inside your browser and creates direct Google Calendar template URLs. No third-party servers, no Google OAuth authorization prompts, and no calendar data is uploaded anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
