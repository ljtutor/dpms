import type { PrismaClient } from "@/app/generated/prisma/client";
import { getScheduleStartMinutes, isLateFirstTimeIn } from "@/lib/schedule";

/** Same calendar day in the server local timezone (matches /api/time-entry GET filter). */
export function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function localDayBounds(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Recompute totalHours for all entries on the same local day as `dayAnchor`, and refresh first Time In isLate.
 */
export async function recalculateDayTimeEntries(prisma: PrismaClient, userId: number, dayAnchor: Date): Promise<void> {
  const { start, end } = localDayBounds(dayAnchor);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockIn: { gte: start, lte: end },
    },
    orderBy: { clockIn: "asc" },
  });

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const next = entries[i + 1];
    let totalHours: number | null = null;
    let breakMinutes = e.breakMinutes;
    if (next) {
      const diffMs = next.clockIn.getTime() - e.clockIn.getTime();
      totalHours = diffMs > 0 ? diffMs / 1000 / 60 / 60 : 0;
      const isBreakLike = e.kind === "Break" || e.kind === "Lunch";
      breakMinutes = isBreakLike ? Math.max(0, Math.floor(diffMs / 1000 / 60)) : e.breakMinutes;
    } else {
      totalHours = e.kind === "Time Out" ? 0 : null;
    }
    await prisma.timeEntry.update({
      where: { id: e.id },
      data: { totalHours, breakMinutes },
    });
  }

  const userRow = await prisma.users.findUnique({
    where: { id: userId },
    select: { scheduleStartMinutes: true },
  });
  const scheduleStartM = getScheduleStartMinutes(userRow?.scheduleStartMinutes ?? null);

  await prisma.timeEntry.updateMany({
    where: {
      userId,
      clockIn: { gte: start, lte: end },
      kind: "Time In",
    },
    data: { isLate: null },
  });

  const firstTi = await prisma.timeEntry.findFirst({
    where: {
      userId,
      clockIn: { gte: start, lte: end },
      kind: "Time In",
    },
    orderBy: { clockIn: "asc" },
  });

  if (firstTi) {
    await prisma.timeEntry.update({
      where: { id: firstTi.id },
      data: { isLate: isLateFirstTimeIn(firstTi.clockIn, scheduleStartM) },
    });
  }
}
