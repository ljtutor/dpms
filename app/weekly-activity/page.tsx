"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Download } from "lucide-react";

type ApiDay = {
  date: string;
  label: string;
  totalWorkMinutes: number;
  entries: {
    start: string;
    end: string | null;
    kind: string;
    description: string;
  }[];
};

type ApiResponse = {
  weekStart: string;
  weekEnd: string;
  canViewOthers: boolean;
  selectedUserId: number;
  users: {
    id: number;
    name: string;
    position: string | null;
  }[];
  days: ApiDay[];
  totalWorkMinutesWeek: number;
};

function getCurrentWeekMondayISO() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function toMondayISO(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return getCurrentWeekMondayISO();
  const day = d.getDay(); // 0 = Sun, 1 = Mon
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default function WeeklyActivityPage() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekMondayISO);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (weekStartIso: string, userId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") ?? sessionStorage.getItem("token")
          : null;
      const query = new URLSearchParams({ weekStart: weekStartIso });
      if (userId) query.set("userId", String(userId));
      const res = await fetch(`/api/weekly-activity?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load weekly activity.");
        setData(null);
        return;
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setSelectedUserId(json.selectedUserId);
    } catch {
      setError("Failed to load weekly activity.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(weekStart, selectedUserId);
  }, [weekStart]);

  useEffect(() => {
    if (selectedUserId == null) return;
    fetchData(weekStart, selectedUserId);
  }, [selectedUserId]);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const handleExportExcel = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") ?? sessionStorage.getItem("token")
          : null;
      const query = new URLSearchParams({ weekStart, format: "xlsx" });
      if (selectedUserId) query.set("userId", String(selectedUserId));
      const res = await fetch(
        `/api/weekly-activity?${query.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      if (!res.ok) {
        const body = await res.text();
        console.error("Export failed", body);
        alert("Failed to export. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-activity-${weekStart}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export. Please try again.");
    }
  };

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Weekly Activity Report
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View a summary of your timekeeping logs for the selected week.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            {data?.canViewOthers && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  Employee
                </span>
                <div>
                  <select
                    value={selectedUserId ?? ""}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="min-w-[260px] rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    {data.users.map((u) => (
                      <option
                        key={u.id}
                        value={u.id}
                        className="bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {u.name}{u.position ? ` (${u.position})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800">
              <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(toMondayISO(e.target.value))}
                className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none dark:text-gray-100"
              />
            </div>
            <div className="inline-flex rounded-full border border-gray-300 bg-white p-0.5 text-xs dark:border-gray-600 dark:bg-gray-800">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900/0"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading weekly activity…
          </p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {data && !loading && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Week of{" "}
                <span className="font-medium">
                  {new Date(data.weekStart).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Total work time (Mon–Fri, excl. lunch):{" "}
                <span className="font-semibold tabular-nums">
                  {Math.floor(data.totalWorkMinutesWeek / 60)}h{" "}
                  {Math.floor(data.totalWorkMinutesWeek % 60)}m
                </span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {data.days.map((day) => (
                      <th
                        key={day.date}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {(() => {
                    const maxRows = Math.max(
                      ...data.days.map((d) => d.entries.length),
                    );
                    return Array.from({ length: maxRows || 1 }).map((_, rowIdx) => (
                      <tr key={rowIdx} className="align-top">
                        {data.days.map((day) => {
                          const entry = day.entries[rowIdx];
                          if (!entry) {
                            return (
                              <td
                                key={day.date}
                                className="px-4 py-2 text-sm text-gray-400 dark:text-gray-600"
                              >
                                {/* empty cell for this day/row */}
                              </td>
                            );
                          }
                          const start = new Date(entry.start);
                          const end = entry.end ? new Date(entry.end) : null;
                          const timeLabel = end
                            ? `${start.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })} – ${end.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}`
                            : start.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              });
                          return (
                            <td
                              key={day.date}
                              className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100"
                            >
                              <div className="space-y-0.5">
                                <div className="font-medium tabular-nums">
                                  {timeLabel}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  {entry.description}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

