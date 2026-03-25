"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

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

type ApiResponse = {
  reminders: CalendarReminder[];
  users: CalendarUser[];
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    setShowModal(true);
    setTitleInput("");
    setTimeInput("");
    setIncludeTime(false);
    setTimeHour("09");
    setTimeMinute("00");
    setTimePeriod("AM");
    setNoteInput("");
    setShareUserIds([]);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const addReminder = async () => {
    if (!selectedDate || !sessionReady) return;
    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/employee-calendar", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          title: trimmedTitle,
          time: timeInput || null,
          note: noteInput || null,
          shareUserIds,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create reminder");
      }

      await fetchCalendar();
      setTitleInput("");
      setTimeInput("");
      setNoteInput("");
      setShareUserIds([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create reminder";
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
              Click any date to add reminders, share with teammates, and view PH holidays.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() =>
                setVisibleMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              className="rounded-full border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[170px] text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
              {monthTitle}
            </div>
            <button
              onClick={() =>
                setVisibleMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              className="rounded-full border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
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

                return (
                  <button
                    key={key}
                    onClick={() => openDateModal(date)}
                    className={`appearance-none min-h-[132px] w-full border-b border-r border-gray-200 p-2 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-[#1e293b] ${
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
                      {dayReminders.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {dayReminders.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayHolidays.slice(0, 1).map((name) => (
                        <div
                          key={`${key}-${name}`}
                          className="truncate rounded-full bg-indigo-200 px-2 py-1 text-[11px] text-indigo-800 dark:bg-indigo-400/70 dark:text-slate-900"
                        >
                          {name}
                        </div>
                      ))}
                      {dayReminders.slice(0, 2).map((reminder) => (
                        <div
                          key={reminder.id}
                          className="truncate rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white dark:bg-blue-500 dark:text-white"
                          style={{
                            backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                            color: "#ffffff",
                          }}
                        >
                          {reminder.time ? `${reminder.time} - ` : ""}
                          {reminder.title}
                        </div>
                      ))}
                      {dayHolidays.length + dayReminders.length > 3 && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          +{dayHolidays.length + dayReminders.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Reminder
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatLongDate(selectedDate)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedDateHolidays.length > 0 && (
              <div className="mb-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
                Holiday: {selectedDateHolidays.join(", ")}
              </div>
            )}

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
                    className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {includeTime ? "No time" : "Set time"}
                  </button>
                </div>
                {includeTime ? (
                  <>
                    <div className="grid grid-cols-3 gap-1.5">
                      <select
                        value={timeHour}
                        onChange={(e) => setTimeHour(e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("09"); setTimeMinute("00"); setTimePeriod("AM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>9:00 AM</button>
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("01"); setTimeMinute("00"); setTimePeriod("PM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>1:00 PM</button>
                      <button type="button" onClick={() => { setIncludeTime(true); setTimeHour("05"); setTimeMinute("00"); setTimePeriod("PM"); }} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>5:00 PM</button>
                      <button type="button" onClick={setNowAsReminderTime} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" style={{ color: isDarkMode ? "#e5e7eb" : undefined }}>Now</button>
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
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />

            <div className="mt-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Share with users
              </div>
              <div className="max-h-28 space-y-2 overflow-y-auto pr-1">
                {users
                  .filter((u) => u.id !== currentUserId)
                  .map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700"
                    >
                      <span className="truncate pr-2 text-gray-700 dark:text-gray-200">
                        {u.name}
                        {u.position ? ` (${u.position})` : ""}
                      </span>
                      <input
                        type="checkbox"
                        checked={shareUserIds.includes(u.id)}
                        onChange={() => toggleShareUser(u.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  ))}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={addReminder}
                disabled={saving || !titleInput.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add reminder
              </button>
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
                  {selectedDateReminders.map((reminder) => {
                    const isOwner = reminder.owner.id === currentUserId;
                    return (
                      <li
                        key={reminder.id}
                        className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {reminder.time ? `${reminder.time} - ` : ""}
                              {reminder.title}
                            </div>
                            {reminder.note && (
                              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
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
                            <button
                              onClick={() => removeReminder(reminder.id)}
                              className="rounded-md p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              aria-label="Delete reminder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

