import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import ExcelJS from "exceljs";
import { getUserIdFromRequest } from "@/lib/auth-request";

const prisma = new PrismaClient();
const MANAGER_POSITIONS = new Set([
  "Team Lead",
  "Finance Officer",
  "Business Development Manager",
  "Project Manager",
]);

function parseWeekStart(searchParams: URLSearchParams): Date {
  const toMonday = (input: Date) => {
    const d = new Date(input);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const raw = searchParams.get("weekStart");
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return toMonday(d);
  }
  const now = new Date();
  return toMonday(now);
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const currentUserId = userResult.userId;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "json";
    const requestedUserIdRaw = searchParams.get("userId");
    const requestedUserId = requestedUserIdRaw ? Number(requestedUserIdRaw) : null;

    const currentUser = await prisma.users.findUnique({
      where: { id: currentUserId },
      include: { position: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const canViewOthers = MANAGER_POSITIONS.has(currentUser.position?.title ?? "");
    let targetUserId = currentUserId;
    if (canViewOthers && requestedUserId && Number.isInteger(requestedUserId)) {
      const requestedUser = await prisma.users.findUnique({
        where: { id: requestedUserId },
        include: { position: true },
      });
      const requestedIsEmployee =
        !!requestedUser && !MANAGER_POSITIONS.has(requestedUser.position?.title ?? "");
      if (requestedIsEmployee) {
        targetUserId = requestedUserId;
      }
    }

    const weekStart = parseWeekStart(searchParams);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: targetUserId,
        clockIn: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: { clockIn: "asc" },
    });

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

    const targetUserRecord = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { first_name: true, last_name: true },
    });
    const employeeDisplayName = targetUserRecord
      ? `${targetUserRecord.first_name} ${targetUserRecord.last_name}`.trim()
      : `User ${targetUserId}`;

    const maxRows = Math.max(0, ...days.map((d) => d.entries.length));
    const headerCells = [employeeDisplayName, ...days.map((d) => d.label)];

    const cellTextForEntry = (rowIdx: number, dayIdx: number) => {
      const entry = days[dayIdx].entries[rowIdx];
      if (!entry) return "";
      const startLabel = formatTimeLabel(entry.start);
      const endLabel = entry.end ? formatTimeLabel(entry.end) : "";
      const range = endLabel ? `${startLabel} - ${endLabel}` : startLabel;
      return `${range} - ${entry.description}`;
    };

    if (format === "xlsx") {
      const GRID_COLS = 6;
      const MIN_GRID_ROWS = 20;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Weekly Activity");
      const headerRow = sheet.addRow(headerCells);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
      });

      for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        const rowValues: string[] = [""];
        for (let d = 0; d < days.length; d++) {
          rowValues.push(cellTextForEntry(rowIdx, d));
        }
        sheet.addRow(rowValues);
      }

      const dataEndRow = 1 + maxRows;
      const lastRow = Math.max(MIN_GRID_ROWS, dataEndRow);
      for (let r = dataEndRow + 1; r <= lastRow; r++) {
        sheet.addRow(Array(GRID_COLS).fill(""));
      }

      const thinBorder = {
        style: "thin" as const,
        color: { argb: "FF000000" },
      };
      const allSides = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: thinBorder,
      };

      for (let r = 1; r <= lastRow; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= GRID_COLS; c++) {
          const cell = row.getCell(c);
          cell.border = allSides;
          cell.alignment = { wrapText: true, vertical: "top" };
        }
      }

      for (let c = 1; c <= GRID_COLS; c++) {
        let maxLen = 10;
        for (let r = 1; r <= lastRow; r++) {
          const val = sheet.getRow(r).getCell(c).value;
          const s = val == null ? "" : String(val);
          maxLen = Math.max(maxLen, s.length);
        }
        const width = Math.min(50, Math.max(12, maxLen * 0.85 + 2));
        sheet.getColumn(c).width = width;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="weekly-activity-${weekStart
            .toISOString()
            .slice(0, 10)}-user-${targetUserId}.xlsx"`,
        },
      });
    }

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(headerCells.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

      for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        const rowCells: string[] = [""];
        for (let d = 0; d < days.length; d++) {
          const text = cellTextForEntry(rowIdx, d);
          rowCells.push(`"${text.replace(/"/g, '""')}"`);
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
            .slice(0, 10)}-user-${targetUserId}.csv"`,
        },
      });
    }

    const users = canViewOthers
      ? await prisma.users.findMany({
          where: {
            isActive: true,
            position: {
              title: {
                notIn: Array.from(MANAGER_POSITIONS),
              },
            },
          },
          include: { position: true },
          orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
        })
      : [];

    return NextResponse.json(
      {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        canViewOthers,
        selectedUserId: targetUserId,
        users: users.map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          position: u.position?.title ?? null,
        })),
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

