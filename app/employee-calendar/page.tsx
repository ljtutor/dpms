"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useSpringHover, useSpringTap } from "@/lib/motion-presets";

type CalendarUser = {
  id: number;
  name: string;
  position: string | null;
};

type CalendarReminder = {
  id: number;
  title: string;
  note: string | null;
  time: string | null;
  date: string;
  owner: { id: number; name: string };
  sharedWith: { id: number; name: string }[];
};

/** Accepted leave (receiver acknowledged); shown on every user's calendar — no reason/note. */
type AcceptedLeaveDay = {
  dateKey: string;
  leaveRequestId: number;
  userId: number;
  userName: string;
  leaveType: string;
};

type ApiResponse = {
  reminders: CalendarReminder[];
  users: CalendarUser[];
  acceptedLeaves: AcceptedLeaveDay[];
};

type Holiday = {
  dateKey: string;
  name: string;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKeyFromIso(iso: string) {
  return toDateKey(new Date(iso));
}

function dateFromReminderIso(iso: string): Date {
  const key = toDateKeyFromIso(iso);
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseReminderTimeString(s: string | null): {
  include: boolean;
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!s || !s.trim()) {
    return { include: false, hour: "09", minute: "00", period: "AM" };
  }
  const match = /^(\d{2}):(\d{2})\s*(AM|PM)$/i.exec(s.trim());
  if (!match) {
    return { include: true, hour: "09", minute: "00", period: "AM" };
  }
  return {
    include: true,
    hour: match[1],
    minute: match[2],
    period: match[3].toUpperCase() === "PM" ? "PM" : "AM",
  };
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toLocalIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getPhilippineHolidays(year: number): Holiday[] {
  const easterSunday = getEasterSunday(year);
  const maundyThursday = new Date(easterSunday);
  maundyThursday.setDate(easterSunday.getDate() - 3);
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(easterSunday.getDate() - 2);
  const nationalHeroesDay = new Date(year, 7, 31);
  while (nationalHeroesDay.getDay() !== 1) {
    nationalHeroesDay.setDate(nationalHeroesDay.getDate() - 1);
  }

  const fixed = [
    { month: 0, day: 1, name: "New Year's Day" },
    { month: 3, day: 9, name: "Araw ng Kagitingan" },
    { month: 4, day: 1, name: "Labor Day" },
    { month: 5, day: 12, name: "Independence Day" },
    { month: 7, day: 21, name: "Ninoy Aquino Day" },
    { month: 10, day: 1, name: "All Saints' Day" },
    { month: 10, day: 30, name: "Bonifacio Day" },
    { month: 11, day: 8, name: "Feast of the Immaculate Conception" },
    { month: 11, day: 24, name: "Christmas Eve" },
    { month: 11, day: 25, name: "Christmas Day" },
    { month: 11, day: 30, name: "Rizal Day" },
    { month: 11, day: 31, name: "New Year's Eve" },
  ];

  const holidays: Holiday[] = fixed.map((item) => ({
    dateKey: toDateKey(new Date(year, item.month, item.day)),
    name: item.name,
  }));

  holidays.push(
    { dateKey: toDateKey(maundyThursday), name: "Maundy Thursday" },
    { dateKey: toDateKey(goodFriday), name: "Good Friday" },
    { dateKey: toDateKey(nationalHeroesDay), name: "National Heroes Day" },
  );

  return holidays;
}

export default function EmployeeCalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [includeTime, setIncludeTime] = useState(false);
  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [noteInput, setNoteInput] = useState("");
  const [shareUserIds, setShareUserIds] = useState<number[]>([]);
  const [shareUsersOpen, setShareUsersOpen] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [reminderFormDate, setReminderFormDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [acceptedLeaves, setAcceptedLeaves] = useState<AcceptedLeaveDay[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const tap = useSpringTap();
  const hoverScale = useSpringHover();

  const shareableUsers = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId],
  );

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
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const applyMode = () => setIsDarkMode(root.classList.contains("dark"));
    applyMode();
    const observer = new MutationObserver(applyMode);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!includeTime) {
      setTimeInput("");
      return;
    }
    setTimeInput(`${timeHour}:${timeMinute} ${timePeriod}`);
  }, [includeTime, timeHour, timeMinute, timePeriod]);

  const holidays = useMemo(
    () => getPhilippineHolidays(visibleMonth.getFullYear()),
    [visibleMonth],
  );
  const holidaysByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const h of holidays) {
      if (!map[h.dateKey]) map[h.dateKey] = [];
      map[h.dateKey].push(h.name);
    }
    return map;
  }, [holidays]);

  const remindersByDate = useMemo(() => {
    const map: Record<string, CalendarReminder[]> = {};
    for (const reminder of reminders) {
      const key = toDateKeyFromIso(reminder.date);
      if (!map[key]) map[key] = [];
      map[key].push(reminder);
    }
    return map;
  }, [reminders]);

  const leavesByDate = useMemo(() => {
    const map: Record<string, AcceptedLeaveDay[]> = {};
    for (const row of acceptedLeaves) {
      if (!map[row.dateKey]) map[row.dateKey] = [];
      map[row.dateKey].push(row);
    }
    return map;
  }, [acceptedLeaves]);

  const monthTitle = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const startOffset = firstDay.getDay();
    const cells: Date[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(new Date(year, month, -i));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length % 7 !== 0) {
      const lastCell = cells[cells.length - 1];
      cells.push(
        new Date(
          lastCell.getFullYear(),
          lastCell.getMonth(),
          lastCell.getDate() + 1,
        ),
      );
    }

    return cells;
  }, [visibleMonth]);

  const todayKey = toDateKey(new Date());
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : "";
  const selectedDateReminders = selectedDateKey
    ? remindersByDate[selectedDateKey] ?? []
    : [];
  const selectedDateHolidays = selectedDateKey
    ? holidaysByDate[selectedDateKey] ?? []
    : [];
  const selectedDateLeaves = selectedDateKey ? leavesByDate[selectedDateKey] ?? [] : [];

  const fetchCalendar = async () => {
    if (!sessionReady) return;
    setLoading(true);
    setError(null);
    try {
      // Use local date string (not toISOString) to avoid timezone month shifts.
      const monthIso = toLocalIsoDate(visibleMonth);
      const [calendarRes, meRes] = await Promise.all([
        fetch(`/api/employee-calendar?month=${monthIso}`, {
          credentials: "include",
        }),
        fetch("/api/auth/me", {
          credentials: "include",
        }),
      ]);

      if (!calendarRes.ok) {
        const body = await calendarRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to fetch calendar");
      }
      if (!meRes.ok) {
        throw new Error("Failed to fetch current user");
      }

      const calendarJson = (await calendarRes.json()) as ApiResponse;
      const meJson = (await meRes.json()) as {
        user?: { id: number };
      };
      setUsers(calendarJson.users);
      setReminders(calendarJson.reminders);
      setAcceptedLeaves(Array.isArray(calendarJson.acceptedLeaves) ? calendarJson.acceptedLeaves : []);
      setCurrentUserId(meJson.user?.id ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load calendar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth, sessionReady]);

  const openDateModal = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(day);
    setReminderFormDate(day);
    setEditingReminderId(null);
    setShowModal(true);
    setTitleInput("");
    setTimeInput("");
    setIncludeTime(false);
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setNoteInput("");
    setShareUserIds([]);
    setShareUsersOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReminderId(null);
  };

  const beginEditReminder = (reminder: CalendarReminder) => {
    const t = parseReminderTimeString(reminder.time);
    setEditingReminderId(reminder.id);
    setTitleInput(reminder.title);
    setNoteInput(reminder.note ?? "");
    setShareUserIds(reminder.sharedWith.map((u) => u.id));
    setIncludeTime(t.include);
    setTimeHour(t.hour);
    setTimeMinute(t.minute);
    setTimePeriod(t.period);
    const rd = dateFromReminderIso(reminder.date);
    setSelectedDate(rd);
    setReminderFormDate(rd);
    setShareUsersOpen(false);
    setError(null);
  };

  const cancelEditReminder = () => {
    setEditingReminderId(null);
    setTitleInput("");
    setTimeInput("");
    setIncludeTime(false);
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setNoteInput("");
    setShareUserIds([]);
  };

  const saveReminder = async () => {
    if (!sessionReady) return;
    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    setError(null);
    try {
      const payload = {
        date: reminderFormDate.toISOString(),
        title: trimmedTitle,
        time: timeInput || null,
        note: noteInput || null,
        shareUserIds,
      };

      const res =
        editingReminderId != null
          ? await fetch(`/api/employee-calendar/${editingReminderId}`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/employee-calendar", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ??
            (editingReminderId != null ? "Failed to update reminder" : "Failed to create reminder"),
        );
      }

      await fetchCalendar();
      setTitleInput("");
      setTimeInput("");
      setNoteInput("");
      setShareUserIds([]);
      setEditingReminderId(null);
      setIncludeTime(false);
      setTimeHour("09");
      setTimeMinute("00");
      setTimePeriod("AM");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save reminder";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const removeReminder = async (id: number) => {
    if (!sessionReady) return;
    setError(null);
    try {
      const res = await fetch(`/api/employee-calendar/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete reminder");
      }
      await fetchCalendar();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete reminder";
      setError(message);
    }
  };

  const toggleShareUser = (userId: number) => {
    setShareUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const goToToday = () => {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const setNowAsReminderTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = Math.round(now.getMinutes() / 5) * 5;
    if (minutes === 60) {
      hours = (hours + 1) % 24;
    }
    const normalizedMinutes = minutes === 60 ? 0 : minutes;
    const period: "AM" | "PM" = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    setIncludeTime(true);
    setTimeHour(String(h12).padStart(2, "0"));
    setTimeMinute(String(normalizedMinutes).padStart(2, "0"));
    setTimePeriod(period);
  };

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Employee Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Click any date to add reminders, share with teammates, view PH holidays, and accepted leave (office-wide).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={goToToday}
              whileTap={tap}
              whileHover={{ scale: hoverScale }}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Today
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              whileTap={tap}
              whileHover={{ scale: hoverScale }}
              className="rounded-full border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <div className="min-w-[170px] text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
              {monthTitle}
            </div>
            <motion.button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              whileTap={tap}
              whileHover={{ scale: hoverScale }}
              className="rounded-full border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#0b1220]"
          style={{
            backgroundColor: isDarkMode ? "#0b1220" : "#ffffff",
            borderColor: isDarkMode ? "#374151" : "#e5e7eb",
          }}
        >
          <div
            className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700"
            style={{
              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
              borderColor: isDarkMode ? "#374151" : undefined,
            }}
          >
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                style={{
                  color: isDarkMode ? "#9ca3af" : undefined,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading calendar...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((date) => {
                const key = toDateKey(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isToday = key === todayKey;
                const dayReminders = remindersByDate[key] ?? [];
                const dayHolidays = holidaysByDate[key] ?? [];
                const dayLeaves = leavesByDate[key] ?? [];

                type DayChip =
                  | { kind: "holiday"; key: string; label: string }
                  | { kind: "leave"; key: string; label: string }
                  | { kind: "reminder"; key: number; reminder: CalendarReminder };

                const dayChips: DayChip[] = [];
                for (const name of dayHolidays) {
                  dayChips.push({ kind: "holiday", key: `${key}-h-${name}`, label: name });
                }
                for (const L of dayLeaves) {
                  dayChips.push({
                    kind: "leave",
                    key: `${key}-l-${L.leaveRequestId}-${L.userId}`,
                    label: `${L.userName} — ${L.leaveType}`,
                  });
                }
                for (const r of dayReminders) {
                  dayChips.push({ kind: "reminder", key: r.id, reminder: r });
                }
                const visibleChips = dayChips.slice(0, 3);
                const moreChipCount = dayChips.length - visibleChips.length;

                return (
                  <motion.button
                    type="button"
                    key={key}
                    onClick={() => openDateModal(date)}
                    whileTap={tap}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 460, damping: 28 }}
                    className={`appearance-none min-h-[132px] w-full border-b border-r border-gray-200 p-2 text-left transition-[box-shadow,background-color] duration-200 hover:bg-gray-100 hover:ring-2 hover:ring-blue-400/15 hover:shadow-md dark:border-gray-800 dark:hover:bg-[#1e293b] dark:hover:ring-blue-500/20 ${
                      isCurrentMonth
                        ? "bg-white text-gray-900 dark:bg-[#0b1220] dark:text-gray-100"
                        : "bg-gray-50 text-gray-500 dark:bg-[#1f2937] dark:text-gray-400"
                    }`}
                    style={{
                      backgroundColor: isCurrentMonth
                        ? (isDarkMode ? "#0b1220" : "#ffffff")
                        : (isDarkMode ? "#1f2937" : "#f9fafb"),
                      color: isCurrentMonth
                        ? (isDarkMode ? "#f3f4f6" : "#111827")
                        : (isDarkMode ? "#9ca3af" : "#6b7280"),
                      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayChips.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {dayChips.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {visibleChips.map((chip) =>
                        chip.kind === "holiday" ? (
                          <div
                            key={chip.key}
                            className="dpms-calendar-holiday-chip truncate rounded-full bg-indigo-200 px-2 py-1 text-[11px] text-indigo-800 dark:bg-indigo-400/70 dark:text-white"
                          >
                            {chip.label}
                          </div>
                        ) : chip.kind === "leave" ? (
                          <div
                            key={chip.key}
                            className="truncate rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white dark:bg-emerald-500 dark:text-white"
                          >
                            {chip.label}
                          </div>
                        ) : (
                          <div
                            key={chip.key}
                            className="truncate rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white dark:bg-blue-500 dark:text-white"
                            style={{
                              backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                              color: "#ffffff",
                            }}
                          >
                            {chip.reminder.time ? `${chip.reminder.time} - ` : ""}
                            {chip.reminder.title}
                          </div>
                        ),
                      )}
                      {moreChipCount > 0 && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          +{moreChipCount} more
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && selectedDate && (
          <motion.div
            key="calendar-modal"
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="max-h-[min(90vh,44rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingReminderId != null ? "Edit reminder" : "Add reminder"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatLongDate(selectedDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-500 transition-transform duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedDateHolidays.length > 0 && (
              <div className="dpms-calendar-holiday-modal-banner mb-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
                Holiday: {selectedDateHolidays.join(", ")}
              </div>
            )}

            {selectedDateLeaves.length > 0 && (
              <div className="dpms-calendar-accepted-leave mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-100">
                <p className="dpms-calendar-accepted-leave-heading mb-1.5 font-semibold text-emerald-950 dark:text-emerald-50">
                  Accepted leave (office-wide)
                </p>
                <ul className="space-y-1">
                  {selectedDateLeaves.map((L) => (
                    <li key={`${L.leaveRequestId}-${L.dateKey}-${L.userId}`}>
                      <span className="dpms-calendar-accepted-leave-name font-medium">{L.userName}</span>
                      <span className="dpms-calendar-accepted-leave-type text-emerald-800 dark:text-emerald-200">
                        {" "}
                        — {L.leaveType}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-3">
              <label
                htmlFor="reminder-form-date"
                className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Date
              </label>
              <input
                id="reminder-form-date"
                type="date"
                value={toLocalIsoDate(reminderFormDate)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const [y, mon, d] = v.split("-").map(Number);
                  const next = new Date(y, mon - 1, d);
                  setReminderFormDate(next);
                  setSelectedDate(next);
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Reminder title"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div className="rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className="text-xs font-medium text-gray-600 dark:text-gray-300"
                    style={{ color: isDarkMode ? "#e5e7eb" : undefined }}
                  >
                    Time
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeTime((prev) => !prev)}
                    className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-[0.96] dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {includeTime ? "No time" : "Set time"}
                  </button>
                </div>
                {includeTime ? (
                  <>
                    <div className="animate-content-reveal grid grid-cols-3 gap-1.5">
                      <select
                        value={timeHour}
                        onChange={(e) => setTimeHour(e.target.value)}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 transition-colors duration-150 hover:border-blue-400/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        style={{
                          backgroundColor: isDarkMode ? "#0f172a" : undefined,
                          color: isDarkMode ? "#f3f4f6" : undefined,
                        }}
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={timeMinute}
                        onChange={(e) => setTimeMinute(e.target.value)}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 transition-colors duration-150 hover:border-blue-400/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        style={{
                          backgroundColor: isDarkMode ? "#0f172a" : undefined,
                          color: isDarkMode ? "#f3f4f6" : undefined,
                        }}
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value as "AM" | "PM")}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 transition-colors duration-150 hover:border-blue-400/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        style={{
                          backgroundColor: isDarkMode ? "#0f172a" : undefined,
                          color: isDarkMode ? "#f3f4f6" : undefined,
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("09"); setTimeMinute("00"); setTimePeriod("AM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 transition-transform duration-150 hover:bg-blue-200/80 active:scale-95 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>9:00 AM</button>
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("01"); setTimeMinute("00"); setTimePeriod("PM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 transition-transform duration-150 hover:bg-blue-200/80 active:scale-95 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>1:00 PM</button>
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("05"); setTimeMinute("00"); setTimePeriod("PM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 transition-transform duration-150 hover:bg-blue-200/80 active:scale-95 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>5:00 PM</button>
                      <button type="button" onClick={setNowAsReminderTime} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 transition-transform duration-150 hover:bg-emerald-200/80 active:scale-95 dark:bg-emerald-900/40 dark:text-emerald-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>Now</button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    No time set
                  </div>
                )}
              </div>
            </div>

            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Optional note"
              rows={2}
              className="dpms-calendar-note-input mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />

            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50/90 dark:border-gray-700 dark:bg-gray-950/70">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShareUsersOpen((open) => !open);
                }}
                aria-expanded={shareUsersOpen}
                aria-controls="share-users-panel"
                className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm transition-colors hover:bg-gray-100/90 active:bg-gray-200/50 dark:hover:bg-gray-800/70 dark:active:bg-gray-800"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Share with users
                  </span>
                  {!shareUsersOpen && shareableUsers.length > 0 && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      ({shareableUsers.length} people)
                    </span>
                  )}
                  {shareUserIds.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                      {shareUserIds.length} selected
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ease-out dark:text-gray-400 ${shareUsersOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {shareUsersOpen && (
                <div
                  id="share-users-panel"
                  role="region"
                  className="border-t border-gray-200/90 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-950/50"
                >
                  <div className="flex max-h-44 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2.5 pt-2">
                    {shareableUsers.length === 0 ? (
                      <p className="py-0.5 text-center text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                        No other users available to share with.
                      </p>
                    ) : (
                      shareableUsers.map((u) => (
                        <label
                          key={u.id}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-xs shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:shadow-none dark:hover:border-blue-500/50 dark:hover:bg-gray-700/90"
                        >
                          <span className="min-w-0 truncate text-gray-900 dark:text-gray-100">
                            {u.name}
                            <span className="text-gray-600 dark:text-gray-400">
                              {u.position ? ` (${u.position})` : ""}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={shareUserIds.includes(u.id)}
                            onChange={() => toggleShareUser(u.id)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:border-gray-500 dark:bg-gray-900 dark:text-blue-400 dark:ring-offset-gray-900"
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Reminders for selected date
              </h3>
              {selectedDateReminders.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                  No reminders yet.
                </p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {selectedDateReminders.map((reminder, idx) => {
                    const isOwner = reminder.owner.id === currentUserId;
                    return (
                      <li
                        key={reminder.id}
                        style={{ animationDelay: `${idx * 55}ms` }}
                        className="animate-reminder-item rounded-lg border border-gray-200 px-3 py-2 transition-shadow duration-200 hover:shadow-md dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {reminder.time ? `${reminder.time} - ` : ""}
                              {reminder.title}
                            </div>
                            {reminder.note && (
                              <div className="dpms-calendar-reminder-note mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {reminder.note}
                              </div>
                            )}
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              Owner: {reminder.owner.name}
                            </div>
                            {reminder.sharedWith.length > 0 && (
                              <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                Shared with:{" "}
                                {reminder.sharedWith.map((u) => u.name).join(", ")}
                              </div>
                            )}
                          </div>
                          {isOwner && (
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  beginEditReminder(reminder);
                                }}
                                className="rounded-md p-1 text-gray-500 transition-transform duration-150 hover:bg-blue-50 hover:text-blue-600 active:scale-90 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                aria-label="Edit reminder"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeReminder(reminder.id);
                                }}
                                className="rounded-md p-1 text-gray-500 transition-transform duration-150 hover:bg-red-50 hover:text-red-600 active:scale-90 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                aria-label="Delete reminder"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-600">
              {editingReminderId != null && (
                <button
                  type="button"
                  onClick={cancelEditReminder}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel editing
                </button>
              )}
              <button
                type="button"
                onClick={saveReminder}
                disabled={saving || !titleInput.trim()}
                style={
                  titleInput.trim()
                    ? {
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        borderColor: "#1d4ed8",
                      }
                    : undefined
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-md transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-90 disabled:shadow-none ${
                  titleInput.trim()
                    ? ""
                    : "border-gray-300 bg-gray-200 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin opacity-90" aria-hidden />
                ) : editingReminderId != null ? (
                  <Pencil className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                ) : (
                  <Plus className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                )}
                {editingReminderId != null ? "Save changes" : "Add reminder"}
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

