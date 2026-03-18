import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

function getUserIdFromRequest(req: NextRequest): { ok: true; userId: number } | { ok: false; response: NextResponse } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const token = authHeader.split(" ")[1]!;
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return { ok: false, response: NextResponse.json({ error: "Server configuration error" }, { status: 500 }) };
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: number; email: string };
    return { ok: true, userId: decoded.id };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}

function parseWeekStart(searchParams: URLSearchParams): Date {
  const raw = searchParams.get("weekStart");
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon
  const diff = (day === 0 ? -6 : 1) - day; // to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export async function GET(req: NextRequest) {
  try {
    const userResult = getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const userId = userResult.userId;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "json";

    const weekStart = parseWeekStart(searchParams);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: { clockIn: "asc" },
    });

    // Group by day (Mon–Fri)
    type DayBucket = {
      date: Date;
      label: string;
      entries: {
        start: Date;
        end: Date | null;
        kind: string;
        description: string;
      }[];
      totalWorkMinutes: number;
    };

    const days: DayBucket[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dayEntries = entries.filter(
        (e) => e.clockIn >= dayStart && e.clockIn < dayEnd,
      );

      const rows: DayBucket["entries"] = [];
      let totalWorkMinutes = 0;

      for (let j = 0; j < dayEntries.length; j++) {
        const current = dayEntries[j];
        const next = dayEntries[j + 1] ?? null;

        const start = current.clockIn;
        const end = next ? next.clockIn : null;

        const isLunch = current.kind === "Lunch";
        const isTimeOut = current.kind === "Time Out";
        if (!isLunch && !isTimeOut && end) {
          const diffMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
          if (diffMinutes > 0) {
            totalWorkMinutes += diffMinutes;
          }
        }

        const descriptionParts: string[] = [];
        descriptionParts.push(current.kind);
        if (current.taskDescription) descriptionParts.push(current.taskDescription);
        const description = descriptionParts.join(" - ");

        rows.push({
          start,
          end,
          kind: current.kind,
          description,
        });
      }

      days.push({
        date: d,
        label: d.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        entries: rows,
        totalWorkMinutes,
      });
    }

    const totalWorkMinutesWeek = days.reduce(
      (sum, d) => sum + d.totalWorkMinutes,
      0,
    );

    if (format === "csv") {
      // Build a simple CSV with one column per weekday and rows of text lines.
      const maxRows = Math.max(...days.map((d) => d.entries.length));
      const header = ["", ...days.map((d) => d.label)];

      const lines: string[] = [];
      lines.push(header.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

      for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        const rowCells: string[] = [String(rowIdx + 1)];
        for (let d = 0; d < days.length; d++) {
          const entry = days[d].entries[rowIdx];
          if (!entry) {
            rowCells.push('""');
          } else {
            const startLabel = formatTimeLabel(entry.start);
            const endLabel = entry.end ? formatTimeLabel(entry.end) : "";
            const range = endLabel ? `${startLabel} - ${endLabel}` : startLabel;
            const text = `${range} - ${entry.description}`;
            rowCells.push(`"${text.replace(/"/g, '""')}"`);
          }
        }
        lines.push(rowCells.join(","));
      }

      const csv = lines.join("\r\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="weekly-activity-${weekStart
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(
      {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        days: days.map((d) => ({
          date: d.date.toISOString(),
          label: d.label,
          totalWorkMinutes: Math.round(d.totalWorkMinutes * 100) / 100,
          entries: d.entries.map((e) => ({
            start: e.start.toISOString(),
            end: e.end ? e.end.toISOString() : null,
            kind: e.kind,
            description: e.description,
          })),
        })),
        totalWorkMinutesWeek: Math.round(totalWorkMinutesWeek * 100) / 100,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to fetch weekly activity",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}

