"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock, PlayCircle, CalendarDays, Coffee, Sandwich, LogOut } from "lucide-react";

type LogType = "Time In" | "Task" | "Break" | "Lunch" | "Time Out";

type LogEntry = {
  id: number;
  type: LogType;
  time: string;
  timestamp: number;
  note?: string;
  isLate?: boolean;
};

export default function TimekeepingPage() {
  const [now, setNow] = useState(new Date());
  const [selectedType, setSelectedType] = useState<LogType>("Time In");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [totalWorkMinutesToday, setTotalWorkMinutesToday] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== "undefined"
      ? token ?? localStorage.getItem("token") ?? sessionStorage.getItem("token")
      : null;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ?? sessionStorage.getItem("token")
        : null;
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/time-entry", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
  }, [token]);

  const handleStartLog = async () => {
    setAuthError(null);
    const authToken = getToken();
    if (!authToken) {
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: selectedType,
          timestamp: now.toISOString(),
          taskDescription: selectedType === "Task" ? taskDescription : undefined,
        }),
      });
      if (selectedType === "Task") setTaskDescription("");
      if (res.ok) {
        const refetchRes = await fetch("/api/time-entry", { headers: { Authorization: `Bearer ${authToken}` } });
        if (refetchRes.ok) {
          const data = await refetchRes.json();
          const entries = (data.entries ?? []) as Array<{ id: number; kind: LogType; clockIn: string; taskDescription: string | null; isLate: boolean | null }>;
          setTotalWorkMinutesToday(Number(data.totalWorkMinutesToday) || 0);
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

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Timekeeping
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your workday in real time.
          </p>
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
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition
                        ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-transparent border-gray-500 text-gray-300 hover:bg-gray-800"
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
              {logs.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Work time today (excl. lunch):{" "}
                  <span className="font-medium tabular-nums">
                    {Math.floor(totalWorkMinutesToday / 60)}h {Math.floor(totalWorkMinutesToday % 60)}m
                  </span>{" "}
                  / 9h shift
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
    </section>
  );
}

