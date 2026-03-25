"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock, PlayCircle, CalendarDays, Coffee, Sandwich, LogOut, CalendarClock } from "lucide-react";

type LogType = "Time In" | "Task" | "Break" | "Lunch" | "Time Out";

type LogEntry = {
  id: number;
  type: LogType;
  time: string;
  timestamp: number;
  note?: string;
  isLate?: boolean;
};

type ScheduleInfo = {
  startMinutes: number;
  endMinutes: number;
  startLabel: string;
  endLabel: string;
  shiftEndsNextCalendarDay: boolean;
  targetWorkHours: number;
  lunchHours: number;
  clockSpanHours: number;
};

const DEFAULT_SCHEDULE: ScheduleInfo = {
  startMinutes: 8 * 60,
  endMinutes: 18 * 60,
  startLabel: "8:00 AM",
  endLabel: "6:00 PM",
  shiftEndsNextCalendarDay: false,
  targetWorkHours: 9,
  lunchHours: 1,
  clockSpanHours: 10,
};

function minutesToParts(m: number): { h12: number; minute: number; period: "AM" | "PM" } {
  const total = ((m % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const minute = total % 60;
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, minute, period };
}

function partsToMinutes(h12: number, minute: number, period: "AM" | "PM"): number {
  let h24 = h12 % 12;
  if (period === "PM") h24 += 12;
  return h24 * 60 + minute;
}

export default function TimekeepingPage() {
  const [now, setNow] = useState(new Date());
  const [selectedType, setSelectedType] = useState<LogType>("Time In");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  /** Login uses httpOnly cookie; JS can’t read it — session is confirmed via /api/auth/me */
  const [sessionReady, setSessionReady] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [totalWorkMinutesToday, setTotalWorkMinutesToday] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleInfo>(DEFAULT_SCHEDULE);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [draftHour, setDraftHour] = useState("8");
  const [draftMinute, setDraftMinute] = useState("00");
  const [draftPeriod, setDraftPeriod] = useState<"AM" | "PM">("AM");
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
      if (!cancelled && res.ok) setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/time-entry", {
          credentials: "include",
        });

        if (!res.ok) {
          setLogs([]);
          return;
        }

        const data = await res.json();
        const entries = (data.entries ?? []) as Array<{
          id: number;
          kind: LogType;
          clockIn: string;
          taskDescription: string | null;
          isLate: boolean | null;
        }>;

        setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
        if (data.schedule && typeof data.schedule === "object") {
          setSchedule(data.schedule as ScheduleInfo);
        }

        const mapped: LogEntry[] = entries.map((e) => {
          const date = new Date(e.clockIn);
          return {
            id: e.id,
            type: e.kind,
            time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            timestamp: date.getTime(),
            note: e.taskDescription ?? undefined,
            isLate: e.isLate ?? undefined,
          };
        });

        setLogs(mapped);
      } catch {
        setLogs([]);
      }
    };

    fetchLogs();
  }, [sessionReady]);

  const handleStartLog = async () => {
    setAuthError(null);
    if (!sessionReady) {
      setAuthError("Please log in to record time entries.");
      return;
    }

    if (selectedType === "Task" && taskDescription.trim() === "") {
      return;
    }

    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newEntry: LogEntry = {
      id: Date.now(),
      type: selectedType,
      time,
      timestamp: now.getTime(),
      note: selectedType === "Task" ? taskDescription.trim() : undefined,
    };
    setLogs((prev) => [newEntry, ...prev]);

    try {
      const res = await fetch("/api/time-entry", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          timestamp: now.toISOString(),
          taskDescription: selectedType === "Task" ? taskDescription : undefined,
        }),
      });
      if (selectedType === "Task") setTaskDescription("");
      if (res.ok) {
        const refetchRes = await fetch("/api/time-entry", {
          credentials: "include",
        });
        if (refetchRes.ok) {
          const data = await refetchRes.json();
          const entries = (data.entries ?? []) as Array<{ id: number; kind: LogType; clockIn: string; taskDescription: string | null; isLate: boolean | null }>;
          setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
          if (data.schedule && typeof data.schedule === "object") {
            setSchedule(data.schedule as ScheduleInfo);
          }
          setLogs(
            entries.map((e) => {
              const date = new Date(e.clockIn);
              return {
                id: e.id,
                type: e.kind,
                time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                timestamp: date.getTime(),
                note: e.taskDescription ?? undefined,
                isLate: e.isLate ?? undefined,
              };
            })
          );
        }
        
      }
    } catch {

    }
  };

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logTypes: { label: LogType; icon?: ReactNode }[] = [
    { label: "Time In", icon: <CalendarDays className="w-4 h-4" /> },
    { label: "Task" },
    { label: "Break", icon: <Coffee className="w-4 h-4" /> },
    { label: "Lunch", icon: <Sandwich className="w-4 h-4" /> },
    { label: "Time Out", icon: <LogOut className="w-4 h-4" /> },
  ];

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "-";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${seconds}s`;
  };

  const liveTotalWorkMinutes = logs.reduce((sum, log, index) => {
    if (log.type === "Lunch" || log.type === "Time Out") return sum;
    const previousLog = logs[index - 1];
    const endTimestamp = previousLog ? previousLog.timestamp : now.getTime();
    const durationMs = endTimestamp - log.timestamp;
    if (durationMs <= 0) return sum;
    return sum + durationMs / 1000 / 60;
  }, 0);

  const openScheduleModal = () => {
    setScheduleError(null);
    const p = minutesToParts(schedule.startMinutes);
    setDraftHour(String(p.h12));
    setDraftMinute(p.minute.toString().padStart(2, "0"));
    setDraftPeriod(p.period);
    setScheduleModalOpen(true);
  };

  const applyPresetMinutes = (m: number) => {
    const p = minutesToParts(m);
    setDraftHour(String(p.h12));
    setDraftMinute(p.minute.toString().padStart(2, "0"));
    setDraftPeriod(p.period);
  };

  const saveSchedule = async () => {
    const h = Number.parseInt(draftHour, 10);
    const min = Number.parseInt(draftMinute, 10);
    if (!Number.isFinite(h) || h < 1 || h > 12 || !Number.isFinite(min) || min < 0 || min > 59) {
      setScheduleError("Enter a valid time.");
      return;
    }
    const scheduleStartMinutes = partsToMinutes(h, min, draftPeriod);
    setScheduleSaving(true);
    setScheduleError(null);
    try {
      const res = await fetch("/api/users/me/schedule", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleStartMinutes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setScheduleError(typeof err.error === "string" ? err.error : "Could not save schedule.");
        return;
      }
      const refetch = await fetch("/api/time-entry", { credentials: "include" });
      if (refetch.ok) {
        const data = await refetch.json();
        if (data.schedule && typeof data.schedule === "object") {
          setSchedule(data.schedule as ScheduleInfo);
        }
      }
      setScheduleModalOpen(false);
    } catch {
      setScheduleError("Could not save schedule.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const shiftSummaryLine = sessionReady
    ? `Shift (GMT+8): ${schedule.startLabel} – ${schedule.endLabel}${
        schedule.shiftEndsNextCalendarDay ? " (end next calendar day)" : ""
      } · ${schedule.targetWorkHours}h work + ${schedule.lunchHours}h lunch (${schedule.clockSpanHours}h on clock)`
    : null;

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Timekeeping
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track your workday in real time.
            </p>
          </div>
          {sessionReady && (
            <button
              type="button"
              onClick={openScheduleModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              <CalendarClock className="h-4 w-4" />
              Edit Schedule
            </button>
          )}
        </div>

        <div className="flex flex-col gap-6 items-start lg:flex-row">

          <div className="flex flex-col gap-4 w-full lg:w-80 xl:w-96">
            <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-5 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Current time
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-4xl font-semibold leading-none text-gray-900 dark:text-white tabular-nums">
                      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {formattedDate}
                  </p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
              {authError && (
                <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">{authError}</p>
              )}
              <button
                type="button"
                onClick={handleStartLog}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-sm border border-black/70 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900/0"
              >
                <PlayCircle className="w-5 h-5" />
                Start log
              </button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                Log type
              </p>
              <div className="flex flex-col gap-2">
                {logTypes.map(({ label, icon }) => {
                  const isActive = selectedType === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedType(label)}
                      style={
                        isActive
                          ? {
                              backgroundColor: "#2563eb",
                              borderColor: "#1d4ed8",
                              color: "#ffffff",
                              boxShadow: "0 0 0 2px rgba(147, 197, 253, 0.9)",
                            }
                          : undefined
                      }
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition
                        ${
                          isActive
                            ? "shadow-sm dark:bg-blue-600 dark:border-blue-600 dark:text-white dark:ring-blue-800"
                            : "bg-transparent border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                    >
                      {icon}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedType === "Task" && (
                <div className="mt-4">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    Task description
                  </label>
                  <input
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="What are you working on?"
                    className="w-full rounded-xl bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 caret-blue-400 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Required when logging a Task.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:flex-1 rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-5 min-h-[260px] dark:bg-gray-800 dark:border-gray-700">
            <div className="mb-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Today&apos;s logs
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    A running list of your time entries.
                  </p>
                </div>
              </div>
              {shiftSummaryLine && (
                <p className="text-xs text-gray-600 dark:text-gray-300">{shiftSummaryLine}</p>
              )}
              {logs.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Work time today (excl. lunch):{" "}
                  <span className="font-medium tabular-nums">
                    {Math.floor(liveTotalWorkMinutes / 60)}h {Math.floor(liveTotalWorkMinutes % 60)}m
                  </span>{" "}
                  / {schedule.targetWorkHours}h target
                </p>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/40">
                <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  No logs yet
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Start your day by creating a new timekeeping entry.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Task Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                      {logs.map((log, index) => {
                        const previousLog = logs[index - 1];
                        const endTimestamp = previousLog ? previousLog.timestamp : now.getTime();
                        const durationMs = endTimestamp - log.timestamp;
                        const isTimeOut = log.type === "Time Out";
                        const durationDisplay = isTimeOut ? "-" : formatDuration(durationMs);

                        return (
                          <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/70">
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                              {log.time}
                              {log.isLate && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  Late
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                              {log.type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {log.note ?? "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {durationDisplay}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {scheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800">
            <h2 id="schedule-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit schedule
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Set when your shift starts in <span className="font-medium">GMT+8</span>. Your day is always{" "}
              <span className="font-medium">9 hours of work</span> plus a <span className="font-medium">1-hour lunch</span>{" "}
              (10 hours on the clock). Example: 8:00 AM → 6:00 PM.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Current window: {schedule.startLabel} – {schedule.endLabel}
              {schedule.shiftEndsNextCalendarDay ? " (end next calendar day)" : ""}.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "8:00 AM", m: 8 * 60 },
                { label: "10:00 AM", m: 10 * 60 },
                { label: "2:00 PM", m: 14 * 60 },
                { label: "6:00 PM", m: 18 * 60 },
              ].map(({ label, m }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => applyPresetMinutes(m)}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/70"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Hour
                </label>
                <select
                  value={draftHour}
                  onChange={(e) => setDraftHour(e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Minute
                </label>
                <select
                  value={draftMinute}
                  onChange={(e) => setDraftMinute(e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  &nbsp;
                </label>
                <select
                  value={draftPeriod}
                  onChange={(e) => setDraftPeriod(e.target.value as "AM" | "PM")}
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {scheduleError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{scheduleError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSchedule}
                disabled={scheduleSaving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {scheduleSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


