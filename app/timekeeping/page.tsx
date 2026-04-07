"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock, PlayCircle, CalendarDays, Coffee, Sandwich, LogOut, CalendarClock, ListTodo, Pencil } from "lucide-react";

import { useSpringHover, useSpringTap } from "@/lib/motion-presets";
import {
  endMinutesAfterStart,
  formatMinutesAs12h,
  getScheduleStartMinutes,
  shiftEndsNextCalendarDay,
} from "@/lib/schedule";

type LogType = "Time In" | "Task" | "Break" | "Lunch" | "Time Out";

type LogEntry = {
  id: number;
  type: LogType;
  time: string;
  timestamp: number;
  note?: string;
  isLate?: boolean;
  pendingEditRequest?: { id: number; status: string } | null;
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

type ScheduleEditEmployee = {
  id: number;
  name: string;
  position: string | null;
  scheduleStartMinutes: number | null;
};

type ScheduleEditContext = {
  currentUserId: number;
  canEditOthers: boolean;
  employees: ScheduleEditEmployee[];
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

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapApiEntryToLog(e: {
  id: number;
  kind: LogType;
  clockIn: string;
  taskDescription: string | null;
  isLate: boolean | null;
  pendingEditRequest?: { id: number; status: string } | null;
}): LogEntry {
  const date = new Date(e.clockIn);
  return {
    id: e.id,
    type: e.kind,
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timestamp: date.getTime(),
    note: e.taskDescription ?? undefined,
    isLate: e.isLate ?? undefined,
    pendingEditRequest: e.pendingEditRequest ?? null,
  };
}

/** Oldest event first — required so “open” segment uses `now` only for the chronologically last row. */
function sortLogsChronologically(logs: LogEntry[]): LogEntry[] {
  return [...logs].sort((a, b) => a.timestamp - b.timestamp || a.id - b.id);
}

/**
 * Each segment runs from this log’s time to the next log’s time, or to `now` for the last segment.
 * Must not depend on table sort order (API returns `clockIn` desc; after edits, index 0 is not always the open segment).
 */
function computeLogDurationsMs(logs: LogEntry[], nowMs: number): {
  durationMsByLogId: Map<number, number | null>;
  liveWorkMinutesExclLunch: number;
} {
  const sorted = sortLogsChronologically(logs);
  const durationMsByLogId = new Map<number, number | null>();
  let liveWorkMinutesExclLunch = 0;

  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    if (log.type === "Time Out") {
      durationMsByLogId.set(log.id, null);
      continue;
    }
    const next = sorted[i + 1];
    const endMs = next ? next.timestamp : nowMs;
    const durationMs = Math.max(0, endMs - log.timestamp);
    durationMsByLogId.set(log.id, durationMs);
    if (log.type !== "Lunch") {
      liveWorkMinutesExclLunch += durationMs / 1000 / 60;
    }
  }

  return { durationMsByLogId, liveWorkMinutesExclLunch };
}

export default function TimekeepingPage() {
  const [now, setNow] = useState(new Date());
  const [selectedType, setSelectedType] = useState<LogType>("Time In");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  /** Login uses httpOnly cookie; JS can’t read it — session is confirmed via /api/auth/me */
  const [sessionReady, setSessionReady] = useState(false);
  /** Only Team Lead, Finance Officer, BDM, PM may use Edit Schedule (matches API). */
  const [canEditSchedules, setCanEditSchedules] = useState(false);
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
  const [flashLogId, setFlashLogId] = useState<number | null>(null);
  const pendingLogFlashRef = useRef(false);
  const [scheduleEditContext, setScheduleEditContext] = useState<ScheduleEditContext | null>(null);
  const [selectedScheduleUserId, setSelectedScheduleUserId] = useState<number | null>(null);
  const [logEditEntry, setLogEditEntry] = useState<LogEntry | null>(null);
  const [logEditDatetime, setLogEditDatetime] = useState("");
  const [logEditKind, setLogEditKind] = useState<LogType>("Time In");
  const [logEditTask, setLogEditTask] = useState("");
  const [logEditEmployeeNote, setLogEditEmployeeNote] = useState("");
  const [logEditSaving, setLogEditSaving] = useState(false);
  const [logEditError, setLogEditError] = useState<string | null>(null);
  const tap = useSpringTap();
  const hoverScale = useSpringHover();
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" }).then(async (res) => {
      if (!res.ok || cancelled) return;
      const data = (await res.json().catch(() => null)) as { user?: { canEditEmployeeSchedules?: boolean } } | null;
      if (cancelled) return;
      setSessionReady(true);
      setCanEditSchedules(Boolean(data?.user?.canEditEmployeeSchedules));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    fetch("/api/users/schedule-edit-context", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ScheduleEditContext | null) => {
        if (!cancelled && data && typeof data.currentUserId === "number") {
          setScheduleEditContext(data);
        }
      })
      .catch(() => {
        if (!cancelled) setScheduleEditContext(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionReady]);

  useEffect(() => {
    if (scheduleEditContext?.currentUserId != null) {
      setSelectedScheduleUserId((prev) => (prev === null ? scheduleEditContext.currentUserId : prev));
    }
  }, [scheduleEditContext]);

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
          pendingEditRequest?: { id: number; status: string } | null;
        }>;

        setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
        if (data.schedule && typeof data.schedule === "object") {
          setSchedule(data.schedule as ScheduleInfo);
        }

        setLogs(entries.map(mapApiEntryToLog));
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

    pendingLogFlashRef.current = true;

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
          const entries = (data.entries ?? []) as Array<{
            id: number;
            kind: LogType;
            clockIn: string;
            taskDescription: string | null;
            isLate: boolean | null;
            pendingEditRequest?: { id: number; status: string } | null;
          }>;
          setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
          if (data.schedule && typeof data.schedule === "object") {
            setSchedule(data.schedule as ScheduleInfo);
          }
          setLogs(entries.map(mapApiEntryToLog));
          if (pendingLogFlashRef.current && entries.length > 0) {
            pendingLogFlashRef.current = false;
            const newestId = entries[0].id;
            setFlashLogId(newestId);
            window.setTimeout(() => setFlashLogId(null), 1000);
          }
        } else {
          pendingLogFlashRef.current = false;
        }
      } else {
        pendingLogFlashRef.current = false;
      }
    } catch {
      pendingLogFlashRef.current = false;
    }
  };

  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logTypes: { label: LogType; icon?: ReactNode }[] = [
    { label: "Time In", icon: <CalendarDays className="h-4 w-4 shrink-0" /> },
    { label: "Task", icon: <ListTodo className="h-4 w-4 shrink-0" /> },
    { label: "Break", icon: <Coffee className="h-4 w-4 shrink-0" /> },
    { label: "Lunch", icon: <Sandwich className="h-4 w-4 shrink-0" /> },
    { label: "Time Out", icon: <LogOut className="h-4 w-4 shrink-0" /> },
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

  const { durationMsByLogId, liveWorkMinutesExclLunch } = useMemo(
    () => computeLogDurationsMs(logs, now.getTime()),
    [logs, now],
  );
  const liveTotalWorkMinutes = liveWorkMinutesExclLunch;

  const openScheduleModal = () => {
    setScheduleError(null);
    const ctx = scheduleEditContext;
    let startM = schedule.startMinutes;
    if (ctx?.canEditOthers && ctx.employees.length > 0) {
      const uid = ctx.currentUserId;
      let effectiveId = selectedScheduleUserId ?? uid;
      if (!ctx.employees.some((e) => e.id === effectiveId)) {
        effectiveId = uid;
      }
      setSelectedScheduleUserId(effectiveId);
      const emp = ctx.employees.find((e) => e.id === effectiveId);
      if (emp) {
        startM = getScheduleStartMinutes(emp.scheduleStartMinutes);
      }
    }
    const p = minutesToParts(startM);
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
      const ctx = scheduleEditContext;
      const payload: { scheduleStartMinutes: number; targetUserId?: number } = { scheduleStartMinutes };
      if (ctx?.canEditOthers && selectedScheduleUserId != null && selectedScheduleUserId !== ctx.currentUserId) {
        payload.targetUserId = selectedScheduleUserId;
      }

      const res = await fetch("/api/users/me/schedule", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setScheduleError(typeof err.error === "string" ? err.error : "Could not save schedule.");
        return;
      }
      const refetchCtx = await fetch("/api/users/schedule-edit-context", { credentials: "include" });
      if (refetchCtx.ok) {
        const ctxData = (await refetchCtx.json()) as ScheduleEditContext;
        if (typeof ctxData.currentUserId === "number") {
          setScheduleEditContext(ctxData);
        }
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

  const editingSomeoneElse =
    scheduleEditContext?.canEditOthers === true &&
    selectedScheduleUserId != null &&
    selectedScheduleUserId !== scheduleEditContext.currentUserId;

  const draftPreview = useMemo(() => {
    const h = Number.parseInt(draftHour, 10);
    const min = Number.parseInt(draftMinute, 10);
    if (!Number.isFinite(h) || h < 1 || h > 12 || !Number.isFinite(min) || min < 0 || min > 59) {
      return null;
    }
    const start = partsToMinutes(h, min, draftPeriod);
    const end = endMinutesAfterStart(start);
    return {
      startLabel: formatMinutesAs12h(start),
      endLabel: formatMinutesAs12h(end),
      shiftEndsNextCalendarDay: shiftEndsNextCalendarDay(start),
    };
  }, [draftHour, draftMinute, draftPeriod]);

  const openLogEdit = (log: LogEntry) => {
    if (log.pendingEditRequest) return;
    setLogEditError(null);
    setLogEditEntry(log);
    setLogEditDatetime(toDatetimeLocalValue(log.timestamp));
    setLogEditKind(log.type);
    setLogEditTask(log.note ?? "");
    setLogEditEmployeeNote("");
  };

  const submitLogEditRequest = async () => {
    if (!logEditEntry) return;
    if (logEditKind === "Task" && logEditTask.trim() === "") {
      setLogEditError("Task description is required for Task logs.");
      return;
    }
    const d = new Date(logEditDatetime);
    if (Number.isNaN(d.getTime())) {
      setLogEditError("Enter a valid date and time.");
      return;
    }
    setLogEditSaving(true);
    setLogEditError(null);
    try {
      const res = await fetch("/api/time-entry/edit-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeEntryId: logEditEntry.id,
          proposedClockIn: d.toISOString(),
          proposedKind: logEditKind,
          proposedTaskDescription: logEditKind === "Task" ? logEditTask.trim() : undefined,
          employeeNote: logEditEmployeeNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLogEditError(typeof err.error === "string" ? err.error : "Could not submit edit request.");
        return;
      }
      const refetch = await fetch("/api/time-entry", { credentials: "include" });
      if (refetch.ok) {
        const data = await refetch.json();
        const entries = (data.entries ?? []) as Array<{
          id: number;
          kind: LogType;
          clockIn: string;
          taskDescription: string | null;
          isLate: boolean | null;
          pendingEditRequest?: { id: number; status: string } | null;
        }>;
        setLogs(entries.map(mapApiEntryToLog));
        setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
      }
      setLogEditEntry(null);
    } catch {
      setLogEditError("Could not submit edit request.");
    } finally {
      setLogEditSaving(false);
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
          {sessionReady && canEditSchedules && (
            <motion.button
              type="button"
              onClick={openScheduleModal}
              whileTap={tap}
              whileHover={{ scale: hoverScale }}
              className="dpms-btn-edit-schedule"
            >
              <CalendarClock aria-hidden />
              Edit Schedule
            </motion.button>
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
                <motion.div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0.35)",
                            "0 0 0 10px rgba(59, 130, 246, 0)",
                          ],
                        }
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 2.2, repeat: Infinity, ease: "easeOut" }
                  }
                >
                  <Clock className="w-6 h-6" />
                </motion.div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
              {authError && (
                <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">{authError}</p>
              )}
              <motion.button
                type="button"
                onClick={handleStartLog}
                whileTap={tap}
                whileHover={{ scale: hoverScale }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-sm border border-black/70 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900/0"
              >
                <PlayCircle className="w-5 h-5" />
                Start log
              </motion.button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                Log type
              </p>
              <div className="flex flex-col gap-3 rounded-2xl bg-gray-100/80 p-2.5 ring-1 ring-gray-200/80 dark:bg-gray-900/55 dark:ring-gray-700/80">
                {logTypes.map(({ label, icon }) => {
                  const isActive = selectedType === label;
                  return (
                    <motion.button
                      key={label}
                      type="button"
                      onClick={() => setSelectedType(label)}
                      whileTap={tap}
                      layout={false}
                      style={
                        isActive
                          ? {
                              backgroundColor: "rgb(37 99 235)",
                              color: "#ffffff",
                              borderColor: "rgb(29 78 216)",
                            }
                          : undefined
                      }
                      className={
                        isActive
                          ? "flex min-h-[2.5rem] w-full items-center justify-center gap-2 rounded-full border-2 border-solid px-3 py-2 text-xs font-semibold shadow-sm ring-2 ring-blue-400/45 [color-scheme:light] dark:ring-blue-500/30"
                          : "flex min-h-[2.5rem] w-full items-center justify-center gap-2 rounded-full border border-solid border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-sm hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                      }
                    >
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:stroke-current [&>svg]:text-current">
                        {icon}
                      </span>
                      <span className="select-none">{label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {selectedType === "Task" && (
                  <motion.div
                    key="task-desc"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
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
                    A running list of your time entries. Edits require approver review (see Requests → Time log edits).
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
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="flex h-40 flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-2" />
                </motion.div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  No logs yet
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Start your day by creating a new timekeeping entry.
                </p>
              </motion.div>
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
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                      {logs.map((log, index) => {
                        const durationMs = durationMsByLogId.get(log.id);
                        const isTimeOut = log.type === "Time Out";
                        const durationDisplay =
                          isTimeOut || durationMs == null ? "-" : formatDuration(durationMs);

                        return (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 32,
                              delay: Math.min(index * 0.035, 0.2),
                            }}
                            className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/70 ${flashLogId === log.id ? "animate-log-row-flash" : ""}`}
                          >
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                              {log.time}
                              {log.isLate && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  Late
                                </span>
                              )}
                              {log.pendingEditRequest && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-900/50 dark:text-sky-200">
                                  Edit pending
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
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => openLogEdit(log)}
                                disabled={Boolean(log.pendingEditRequest)}
                                title={
                                  log.pendingEditRequest
                                    ? "A change is already waiting for approval"
                                    : "Request an edit (needs approval)"
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </button>
                            </td>
                          </motion.tr>
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

      <AnimatePresence>
        {scheduleModalOpen && (
          <motion.div
            key="schedule-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setScheduleModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="dpms-modal-edit-schedule"
              onClick={(e) => e.stopPropagation()}
            >
            <h2 id="schedule-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit schedule
            </h2>
            {scheduleEditContext?.canEditOthers && scheduleEditContext.employees.length > 0 && (
              <div className="mt-4">
                <label
                  htmlFor="schedule-employee-select"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Employee
                </label>
                <select
                  id="schedule-employee-select"
                  value={selectedScheduleUserId ?? scheduleEditContext.currentUserId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedScheduleUserId(id);
                    const emp = scheduleEditContext.employees.find((x) => x.id === id);
                    if (emp) {
                      const startM = getScheduleStartMinutes(emp.scheduleStartMinutes);
                      const p = minutesToParts(startM);
                      setDraftHour(String(p.h12));
                      setDraftMinute(p.minute.toString().padStart(2, "0"));
                      setDraftPeriod(p.period);
                    }
                  }}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-150 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:border-gray-500"
                >
                  {scheduleEditContext.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.position ? ` — ${e.position}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {editingSomeoneElse ? (
                <>
                  Set when this employee&apos;s shift starts in <span className="font-medium">GMT+8</span>. Their day is
                  always <span className="font-medium">9 hours of work</span> plus a{" "}
                  <span className="font-medium">1-hour lunch</span> (10 hours on the clock). Example: 8:00 AM → 6:00 PM.
                </>
              ) : (
                <>
                  Set when your shift starts in <span className="font-medium">GMT+8</span>. Your day is always{" "}
                  <span className="font-medium">9 hours of work</span> plus a <span className="font-medium">1-hour lunch</span>{" "}
                  (10 hours on the clock). Example: 8:00 AM → 6:00 PM.
                </>
              )}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {draftPreview ? (
                <>
                  {editingSomeoneElse ? "Their" : "Your"} window (preview): {draftPreview.startLabel} – {draftPreview.endLabel}
                  {draftPreview.shiftEndsNextCalendarDay ? " (end next calendar day)" : ""}.
                </>
              ) : (
                <>
                  Current window: {schedule.startLabel} – {schedule.endLabel}
                  {schedule.shiftEndsNextCalendarDay ? " (end next calendar day)" : ""}.
                </>
              )}
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
                  className="mt-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 transition-colors duration-150 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:border-gray-500"
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
                  className="mt-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 transition-colors duration-150 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:border-gray-500"
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
                  className="mt-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 transition-colors duration-150 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:border-gray-500"
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
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logEditEntry && (
          <motion.div
            key="log-edit-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-edit-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLogEditEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="dpms-modal-edit-schedule max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="log-edit-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Request log edit
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Proposed changes stay on <span className="font-medium">the same calendar day</span> as this log. A Team
                Lead, Finance Officer, Business Development Manager, or Project Manager must approve before the log
                updates.
              </p>

              <div className="mt-4">
                <label
                  htmlFor="log-edit-datetime"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Date &amp; time
                </label>
                <input
                  id="log-edit-datetime"
                  type="datetime-local"
                  value={logEditDatetime}
                  onChange={(e) => setLogEditDatetime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="log-edit-kind"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Log type
                </label>
                <select
                  id="log-edit-kind"
                  value={logEditKind}
                  onChange={(e) => setLogEditKind(e.target.value as LogType)}
                  className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  {logTypes.map(({ label }) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {logEditKind === "Task" && (
                <div className="mt-4">
                  <label
                    htmlFor="log-edit-task"
                    className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    Task description
                  </label>
                  <input
                    id="log-edit-task"
                    value={logEditTask}
                    onChange={(e) => setLogEditTask(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="mt-4">
                <label
                  htmlFor="log-edit-note"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Note to approver (optional)
                </label>
                <textarea
                  id="log-edit-note"
                  value={logEditEmployeeNote}
                  onChange={(e) => setLogEditEmployeeNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  placeholder="Reason for this change"
                />
              </div>

              {logEditError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{logEditError}</p>}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLogEditEntry(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitLogEditRequest}
                  disabled={logEditSaving}
                  className="dpms-btn-submit-request"
                >
                  {logEditSaving ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


