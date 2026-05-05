import type { PrismaClient } from "@/app/generated/prisma/client";

const GMT8_MS = 8 * 60 * 60 * 1000;

export type TimesheetCell =
  | { kind: "leave"; code: string }
  | { kind: "work"; inTime: string | null; outTime: string | null; inLate: boolean }
  | { kind: "empty" };

export type TimesheetReport = {
  periodLabel: string;
  dateColumns: { dateKey: string; headerLabel: string }[];
  rows: {
    userId: number;
    name: string;
    cells: TimesheetCell[];
  }[];
};

export function leaveTypeAbbrev(type: string): string {
  const t = type.trim().toLowerCase();
  if (t.includes("vacation")) return "VL";
  if (t.includes("sick")) return "SL";
  if (t.includes("emergency")) return "EL";
  if (t.includes("no pay")) return "NPL";
  const cleaned = type.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  return cleaned.length >= 2 ? cleaned.slice(0, 3) : type.slice(0, 2).toUpperCase();
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Calendar date components for `clockIn` in GMT+8. */
export function gmt8Ymd(clockIn: Date): { y: number; m: number; d: number; dateKey: string } {
  const g = new Date(clockIn.getTime() + GMT8_MS);
  const y = g.getUTCFullYear();
  const m = g.getUTCMonth() + 1;
  const d = g.getUTCDate();
  return { y, m, d, dateKey: `${y}-${pad2(m)}-${pad2(d)}` };
}

export function weekdaySun0Gmt8(year: number, month1To12: number, day: number): number {
  const startUtcMs = Date.UTC(year, month1To12 - 1, day, 0, 0, 0, 0) - GMT8_MS;
  const start = new Date(startUtcMs);
  const g = new Date(start.getTime() + GMT8_MS);
  return g.getUTCDay();
}

/** 24-hour H:MM (GMT+8), for callers that need compact numeric times. */
export function formatClockShortGmt8(d: Date): string {
  const g = new Date(d.getTime() + GMT8_MS);
  const h = g.getUTCHours();
  const m = g.getUTCMinutes();
  return `${h}:${pad2(m)}`;
}

/** Timesheet grid / export: 12-hour with A.M. / P.M. (GMT+8). */
export function formatTimesheetClockAmPmGmt8(d: Date): string {
  const g = new Date(d.getTime() + GMT8_MS);
  const h24 = g.getUTCHours();
  const minutes = g.getUTCMinutes();
  const period = h24 >= 12 ? "P.M." : "A.M.";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${pad2(minutes)} ${period}`;
}

export function daysInMonth(year: number, month1To12: number): number {
  return new Date(year, month1To12, 0).getDate();
}

export function biMonthlyDayRange(year: number, month1To12: number, half: 1 | 2): { startDay: number; endDay: number } {
  const last = daysInMonth(year, month1To12);
  if (half === 1) return { startDay: 1, endDay: 15 };
  return { startDay: 16, endDay: last };
}

export function enumerateWeekdaysInRange(
  year: number,
  month1To12: number,
  startDay: number,
  endDay: number,
): { year: number; month: number; day: number; dateKey: string }[] {
  const out: { year: number; month: number; day: number; dateKey: string }[] = [];
  for (let day = startDay; day <= endDay; day++) {
    const dow = weekdaySun0Gmt8(year, month1To12, day);
    if (dow === 0 || dow === 6) continue;
    const dateKey = `${year}-${pad2(month1To12)}-${pad2(day)}`;
    out.push({ year, month: month1To12, day, dateKey });
  }
  return out;
}

export function monthDayHeader(month1To12: number, day: number): string {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = labels[month1To12 - 1] ?? `M${month1To12}`;
  return `${m}-${pad2(day)}`;
}

function displayName(u: {
  employeeInformation: {
    firstName: string;
    middleName: string | null;
    lastName: string;
  } | null;
}): string {
  const first = u.employeeInformation?.firstName ?? "";
  const mid = u.employeeInformation?.middleName?.trim();
  const last = u.employeeInformation?.lastName ?? "";
  return [first, mid, last].filter(Boolean).join(" ").trim();
}

function dayBoundsUtc(year: number, month1To12: number, day: number): { start: Date; end: Date } {
  const startUtcMs = Date.UTC(year, month1To12 - 1, day, 0, 0, 0, 0) - GMT8_MS;
  const endUtcMs = Date.UTC(year, month1To12 - 1, day, 23, 59, 59, 999) - GMT8_MS;
  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

function overlapsApprovedLeave(
  dayStart: Date,
  dayEnd: Date,
  leave: { dateFrom: Date; dateTo: Date; isApproved: boolean },
): boolean {
  if (!leave.isApproved) return false;
  return leave.dateFrom <= dayEnd && leave.dateTo >= dayStart;
}

export async function buildTimesheetReport(
  prisma: PrismaClient,
  year: number,
  month1To12: number,
  half: 1 | 2,
): Promise<TimesheetReport> {
  const { startDay, endDay } = biMonthlyDayRange(year, month1To12, half);
  const weekdays = enumerateWeekdaysInRange(year, month1To12, startDay, endDay);

  const prettyMonth = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month1To12 - 1];

  const periodLabelPretty =
    half === 1
      ? `${prettyMonth} 1–15, ${year}`
      : `${prettyMonth} ${startDay}–${endDay}, ${year}`;

  const dateColumns = weekdays.map((w) => ({
    dateKey: w.dateKey,
    headerLabel: monthDayHeader(w.month, w.day),
  }));

  const users = await prisma.users.findMany({
    where: { isActive: true, employeeInformation: { isNot: null } },
    include: {
      employeeInformation: true,
    },
  });

  users.sort((a, b) => {
    const al = a.employeeInformation?.lastName ?? "";
    const bl = b.employeeInformation?.lastName ?? "";
    if (al !== bl) return al.localeCompare(bl);
    const af = a.employeeInformation?.firstName ?? "";
    const bf = b.employeeInformation?.firstName ?? "";
    return af.localeCompare(bf);
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    return { periodLabel: periodLabelPretty, dateColumns, rows: [] };
  }

  const rangePadMs = 24 * 60 * 60 * 1000;
  const firstBounds = dayBoundsUtc(year, month1To12, startDay);
  const lastBounds = dayBoundsUtc(year, month1To12, endDay);
  const queryFrom = new Date(firstBounds.start.getTime() - rangePadMs);
  const queryTo = new Date(lastBounds.end.getTime() + rangePadMs);

  const [entries, leaves] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        clockIn: { gte: queryFrom, lte: queryTo },
      },
      orderBy: { clockIn: "asc" },
      select: {
        userId: true,
        clockIn: true,
        kind: true,
        isLate: true,
      },
    }),
    prisma.leaveRequests.findMany({
      where: {
        userId: { in: userIds },
        isApproved: true,
        dateFrom: { lte: lastBounds.end },
        dateTo: { gte: firstBounds.start },
      },
      include: { leaveType: true },
    }),
  ]);

  const entriesByUserDate = new Map<string, typeof entries>();
  for (const e of entries) {
    const { dateKey } = gmt8Ymd(e.clockIn);
    const k = `${e.userId}:${dateKey}`;
    const arr = entriesByUserDate.get(k);
    if (arr) arr.push(e);
    else entriesByUserDate.set(k, [e]);
  }

  function cellForDay(userId: number, wd: { year: number; month: number; day: number; dateKey: string }): TimesheetCell {
    const { start: dayStart, end: dayEnd } = dayBoundsUtc(wd.year, wd.month, wd.day);

    const dayLeaves = leaves.filter(
      (l) => l.userId === userId && overlapsApprovedLeave(dayStart, dayEnd, l),
    );
    if (dayLeaves.length > 0) {
      const pick =
        dayLeaves.find((l) => l.leaveType.type.toLowerCase().includes("vacation")) ??
        dayLeaves.find((l) => l.leaveType.type.toLowerCase().includes("sick")) ??
        dayLeaves[0];
      return { kind: "leave", code: leaveTypeAbbrev(pick.leaveType.type) };
    }

    const key = `${userId}:${wd.dateKey}`;
    const dayEntries = entriesByUserDate.get(key);
    if (!dayEntries?.length) return { kind: "empty" };

    const firstIn = dayEntries.find((x) => x.kind === "Time In");
    let lastOut: (typeof entries)[number] | undefined;
    for (let i = dayEntries.length - 1; i >= 0; i--) {
      if (dayEntries[i].kind === "Time Out") {
        lastOut = dayEntries[i];
        break;
      }
    }

    const inTime = firstIn ? formatTimesheetClockAmPmGmt8(firstIn.clockIn) : null;
    const outTime = lastOut ? formatTimesheetClockAmPmGmt8(lastOut.clockIn) : null;
    const inLate = Boolean(firstIn?.isLate);

    if (!inTime && !outTime) return { kind: "empty" };
    return { kind: "work", inTime, outTime, inLate };
  }

  const rows = users.map((u) => ({
    userId: u.id,
    name: displayName(u),
    cells: weekdays.map((wd) => cellForDay(u.id, wd)),
  }));

  return { periodLabel: periodLabelPretty, dateColumns, rows };
}
