"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react";

import { Role } from "@/app/generated/prisma/enums";
import { useSpringHover, useSpringTap } from "@/lib/motion-presets";
import type { TimesheetCell, TimesheetReport } from "@/lib/timesheets-report";
import { TIMESHEET_THEME } from "@/lib/timesheets-theme";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar date YYYY-MM-DD (browser timezone). */
function todayIsoLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function parsePeriodAnchor(iso: string): { year: number; month: number; half: 1 | 2 } {
  const [y, m, d] = iso.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1, half: 1 };
  const day = Number.isFinite(d) ? d : 1;
  return { year: y, month: m, half: day <= 15 ? 1 : 2 };
}

/** Move by one bi-monthly half (1–15 vs 16–end). */
function shiftHalf(year: number, month: number, half: 1 | 2, delta: number): { year: number; month: number; half: 1 | 2 } {
  let y = year;
  let mo = month;
  let h = half;
  const steps = delta > 0 ? 1 : -1;
  const count = Math.abs(delta);
  for (let i = 0; i < count; i++) {
    if (steps > 0) {
      if (h === 1) h = 2;
      else {
        h = 1;
        mo += 1;
        if (mo > 12) {
          mo = 1;
          y += 1;
        }
      }
    } else {
      if (h === 2) h = 1;
      else {
        h = 2;
        mo -= 1;
        if (mo < 1) {
          mo = 12;
          y -= 1;
        }
      }
    }
  }
  return { year: y, month: mo, half: h };
}

function firstDayIsoOfHalf(year: number, month: number, half: 1 | 2): string {
  const day = half === 1 ? 1 : 16;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function cellBgStyle(c: TimesheetCell): CSSProperties | undefined {
  if (c.kind === "leave") return { backgroundColor: TIMESHEET_THEME.leaveBlue.hex };
  if (c.kind === "work" && c.inLate) {
    return {
      backgroundColor: TIMESHEET_THEME.lateGreen.hex,
      color: "#111827",
    };
  }
  return undefined;
}

export default function TimesheetsPage() {
  const router = useRouter();
  const tap = useSpringTap();
  const hoverScale = useSpringHover();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [roleGate, setRoleGate] = useState<"unknown" | "allow" | "deny">("unknown");

  /** Any date within the pay period; drives year / month / first vs second half. */
  const [periodAnchor, setPeriodAnchor] = useState(todayIsoLocal);
  const { year, month, half } = useMemo(() => parsePeriodAnchor(periodAnchor), [periodAnchor]);

  const [data, setData] = useState<TimesheetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const canAccess = roleGate === "allow";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setRoleGate("deny");
          return;
        }
        const json = (await res.json()) as { user?: { role?: Role } };
        const r = json.user?.role;
        if (cancelled) return;
        if (r === Role.MANAGER || r === Role.ADMIN) setRoleGate("allow");
        else {
          setRoleGate("deny");
          router.replace("/timekeeping");
        }
      })
      .catch(() => {
        if (!cancelled) setRoleGate("deny");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const queryString = useMemo(() => {
    const q = new URLSearchParams({
      year: String(year),
      month: String(month),
      half: String(half),
    });
    return q.toString();
  }, [year, month, half]);

  useEffect(() => {
    if (!canAccess) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/timesheets?${queryString}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body.error === "string" ? body.error : "Failed to load timesheets.");
        }
        return res.json() as Promise<TimesheetReport>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed to load timesheets.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canAccess, queryString]);

  const exportXlsx = async () => {
    if (!canAccess) return;
    setExporting(true);
    try {
      const q = new URLSearchParams({
        year: String(year),
        month: String(month),
        half: String(half),
        format: "xlsx",
      });
      const res = await fetch(`/api/timesheets?${q.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheets-${year}-${String(month).padStart(2, "0")}-half${half}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const halfLabel = half === 1 ? "1st half (1–15)" : "2nd half (16–end)";

  const openNativeDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
    }
  };

  const thBase =
    "border border-gray-200 bg-gray-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400";

  const tdBase =
    "border border-gray-200 px-2 py-1.5 text-center text-xs tabular-nums text-gray-900 dark:border-gray-700 dark:text-gray-100";

  if (roleGate === "unknown") {
    return (
      <section className="px-4 py-10 lg:px-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading…</p>
      </section>
    );
  }

  if (!canAccess) {
    return (
      <section className="px-4 py-10 lg:px-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting…</p>
      </section>
    );
  }

  return (
    <section className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <FileSpreadsheet
              className="mt-1 h-8 w-8 shrink-0 text-gray-900 dark:text-white"
              aria-hidden
              strokeWidth={2}
            />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Timesheets</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Timesheets - Weekends excluded
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-900">
              <motion.button
                type="button"
                whileTap={tap}
                aria-label="Previous pay period"
                className="rounded-l-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => {
                  const next = shiftHalf(year, month, half, -1);
                  setPeriodAnchor(firstDayIsoOfHalf(next.year, next.month, next.half));
                }}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </motion.button>

              <div className="flex min-w-0 flex-1 items-center gap-2 border-x border-gray-200 px-3 py-2 dark:border-gray-700">
                <label htmlFor="timesheet-period-picker" className="sr-only">
                  Choose any date in the pay period (days 1–15 or 16–end set the half)
                </label>
                <button
                  type="button"
                  className="dpms-timesheet-calendar-trigger"
                  aria-label="Open calendar"
                  onClick={openNativeDatePicker}
                >
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
                </button>
                <span className="hidden text-xs font-medium text-gray-600 sm:inline dark:text-gray-400">Period</span>
                <input
                  ref={dateInputRef}
                  id="timesheet-period-picker"
                  type="date"
                  value={periodAnchor}
                  min={`${new Date().getFullYear() - 6}-01-01`}
                  max={`${new Date().getFullYear() + 2}-12-31`}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) setPeriodAnchor(v);
                  }}
                  className="dpms-timesheet-date-input min-w-0 flex-1 bg-transparent py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                />
              </div>

              <motion.button
                type="button"
                whileTap={tap}
                aria-label="Next pay period"
                className="rounded-r-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => {
                  const next = shiftHalf(year, month, half, 1);
                  setPeriodAnchor(firstDayIsoOfHalf(next.year, next.month, next.half));
                }}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </motion.button>
            </div>

            <motion.button
              type="button"
              whileTap={tap}
              whileHover={{ scale: hoverScale }}
              disabled={exporting || loading || !canAccess}
              onClick={() => void exportXlsx()}
              className="dpms-btn-export-excel"
            >
              <Download className="h-4 w-4" aria-hidden />
              {exporting ? "Exporting…" : "Export Excel"}
            </motion.button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <span className="font-medium">{data?.periodLabel ?? "…"}</span>
          <span className="mx-2 text-gray-400 dark:text-gray-500">·</span>
          <span className="text-gray-500 dark:text-gray-400">{halfLabel}</span>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          ) : !data?.rows.length ? (
            <div className="flex h-48 flex-col items-center justify-center gap-1 px-4 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No employees to show</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Active users need an employee profile to appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-14rem)] overflow-auto">
              <table className="min-w-max w-full border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th
                      rowSpan={2}
                      className={`${thBase} sticky left-0 z-30 min-w-[180px] bg-gray-50 text-left dark:bg-gray-900`}
                    >
                      Employee
                    </th>
                    {data.dateColumns.map((d) => (
                      <th key={d.dateKey} colSpan={2} className={thBase}>
                        {d.headerLabel}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {data.dateColumns.flatMap((d) => [
                      <th key={`${d.dateKey}-in`} className={thBase}>
                        In
                      </th>,
                      <th key={`${d.dateKey}-out`} className={thBase}>
                        Out
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.userId} className="odd:bg-white even:bg-gray-50/80 dark:odd:bg-gray-800 dark:even:bg-gray-900/35">
                      <th
                        scope="row"
                        className={`${tdBase} sticky left-0 z-10 max-w-[220px] truncate bg-white text-left font-medium dark:bg-gray-800`}
                      >
                        {row.name}
                      </th>
                      {row.cells.flatMap((c, idx) => {
                        const dk = data.dateColumns[idx]?.dateKey ?? String(idx);
                        if (c.kind === "leave") {
                          return [
                            <td
                              key={`${dk}-leave`}
                              colSpan={2}
                              className={`${tdBase} font-semibold`}
                              style={{ backgroundColor: TIMESHEET_THEME.leaveBlue.hex }}
                            >
                              {c.code}
                            </td>,
                          ];
                        }
                        if (c.kind === "work") {
                          return [
                            <td
                              key={`${dk}-in`}
                              className={tdBase}
                              style={cellBgStyle(c)}
                            >
                              {c.inTime ?? ""}
                            </td>,
                            <td key={`${dk}-out`} className={tdBase}>
                              {c.outTime ?? ""}
                            </td>,
                          ];
                        }
                        return [
                          <td key={`${dk}-in-e`} className={tdBase}>
                            {""}
                          </td>,
                          <td key={`${dk}-out-e`} className={tdBase}>
                            {""}
                          </td>,
                        ];
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <p className="w-full font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Legend</p>
          <LegendSwatch label="Late (In)" hex={TIMESHEET_THEME.lateGreen.hex} />
          <LegendSwatch label="Leave" hex={TIMESHEET_THEME.leaveBlue.hex} />
          <LegendSwatch label="Onsite" hex={TIMESHEET_THEME.onsiteYellow.hex} />
          <LegendSwatch label="Holiday" hex={TIMESHEET_THEME.holidayOrange.hex} />
          <p className="w-full text-gray-500 dark:text-gray-400">
            Leave codes come from approved leave requests (e.g. VL / SL). Onsite and holiday shading can be extended when
            those signals exist in the system.
          </p>
        </div>
      </div>
    </section>
  );
}

function LegendSwatch({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-4 w-7 shrink-0 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: hex }} />
      <span>{label}</span>
    </span>
  );
}
