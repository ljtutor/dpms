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

export async function POST(req: NextRequest) {
  try {
    const userResult = getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const userId = userResult.userId;

    const body = await req.json();
    const type = body.type as string | undefined;
    const timestamp = body.timestamp as string | undefined;
    const taskDescription = body.taskDescription as string | undefined;

    if (!type || !timestamp) {
      return NextResponse.json({ error: "Missing type or timestamp" }, { status: 400 });
    }

    const clockIn = new Date(timestamp);
    const isTimeOut = type === "Time Out";
    const isTimeIn = type === "Time In";

    // Update the previous entry's totalHours (duration until this new log)
    const previousEntry = await prisma.timeEntry.findFirst({
      where: { userId },
      orderBy: { clockIn: "desc" },
    });

    if (previousEntry) {
      const diffMs = clockIn.getTime() - previousEntry.clockIn.getTime();
      if (diffMs > 0) {
        const totalHours = diffMs / 1000 / 60 / 60;
        await prisma.timeEntry.update({
          where: { id: previousEntry.id },
          data: { totalHours },
        });
      }
    }

    // Time Out = end of shift: fixed duration 0, clockOut set to clockIn
    const clockOut = isTimeOut ? clockIn : null;
    const totalHours = isTimeOut ? 0 : null;

    // Late Time-In: first "Time In" of the day (GMT+8) after 8:00 AM GMT+8 counts as late
    let isLate: boolean | null = null;
    if (isTimeIn) {
      const gmt8OffsetMs = 8 * 60 * 60 * 1000;
      const gmt8Time = new Date(clockIn.getTime() + gmt8OffsetMs);
      const gmt8Year = gmt8Time.getUTCFullYear();
      const gmt8Month = gmt8Time.getUTCMonth();
      const gmt8Date = gmt8Time.getUTCDate();
      const startOfDayGmt8 = new Date(Date.UTC(gmt8Year, gmt8Month, gmt8Date, 0, 0, 0, 0) - gmt8OffsetMs);
      const endOfDayGmt8 = new Date(startOfDayGmt8.getTime() + 24 * 60 * 60 * 1000 - 1);

      const existingTimeInsToday = await prisma.timeEntry.count({
        where: {
          userId,
          kind: "Time In",
          clockIn: { gte: startOfDayGmt8, lte: endOfDayGmt8 },
        },
      });

      if (existingTimeInsToday === 0) {
        const hour = gmt8Time.getUTCHours();
        const minute = gmt8Time.getUTCMinutes();
        const second = gmt8Time.getUTCSeconds();
        isLate = hour > 8 || (hour === 8 && (minute > 0 || second > 0));
      }
    }

    const baseData = {
      userId,
      clockIn,
      clockOut,
      breakMinutes: 0,
      totalHours,
      status: "RECORDED" as const,
      notes: null,
      taskDescription: type === "Task" ? (typeof taskDescription === "string" ? taskDescription.trim() : null) : null,
      kind: type,
    };

    let entry;
    try {
      entry = await prisma.timeEntry.create({
        data: { ...baseData, isLate: isLate ?? undefined },
      });
    } catch (createError: unknown) {
      const message = createError instanceof Error ? createError.message : String(createError);
      const isColumnError =
        typeof message === "string" &&
        (message.includes("isLate") || message.includes("column") || message.includes("Unknown column"));
      if (isColumnError) {
        entry = await prisma.timeEntry.create({ data: baseData });
      } else {
        throw createError;
      }
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to create time entry", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userResult = getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const userId = userResult.userId;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    // 9-hour shift checker: total work time today excluding Lunch (in minutes)
    const totalWorkMinutesToday = entries
      .filter((e) => e.kind !== "Lunch")
      .reduce((sum, e) => sum + (e.totalHours != null ? Number(e.totalHours) * 60 : 0), 0);

    return NextResponse.json(
      { entries, totalWorkMinutesToday: Math.round(totalWorkMinutesToday * 100) / 100 },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

