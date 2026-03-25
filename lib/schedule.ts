/** Minutes from midnight (GMT+8) for late / display. Null in DB = use default 8:00 AM. */
export const DEFAULT_SCHEDULE_START_MINUTES = 8 * 60;
export const WORK_MINUTES_EXCLUDING_LUNCH = 9 * 60;
export const LUNCH_MINUTES = 60;
export const CLOCK_SPAN_MINUTES = WORK_MINUTES_EXCLUDING_LUNCH + LUNCH_MINUTES;

export function getScheduleStartMinutes(scheduleStartMinutes: number | null): number {
  return scheduleStartMinutes ?? DEFAULT_SCHEDULE_START_MINUTES;
}

export function gmt8SecondsFromMidnight(d: Date): number {
  const gmt8OffsetMs = 8 * 60 * 60 * 1000;
  const g = new Date(d.getTime() + gmt8OffsetMs);
  return g.getUTCHours() * 3600 + g.getUTCMinutes() * 60 + g.getUTCSeconds();
}

export function isLateFirstTimeIn(clockIn: Date, scheduleStartMinutes: number): boolean {
  return gmt8SecondsFromMidnight(clockIn) > scheduleStartMinutes * 60;
}

export function endMinutesAfterStart(startMinutes: number): number {
  return (startMinutes + CLOCK_SPAN_MINUTES) % (24 * 60);
}

export function shiftEndsNextCalendarDay(startMinutes: number): boolean {
  return startMinutes + CLOCK_SPAN_MINUTES > 24 * 60;
}

export function formatMinutesAs12h(mins: number): string {
  const total = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}
