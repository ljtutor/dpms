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

    // Update the previous entry's totalHours (duration until this new log)
    const previousEntry = await prisma.timeEntry.findFirst({
      where: { userId },
      orderBy: { clockIn: "desc" },
    });

    if (previousEntry) {
      const diffMs = clockIn.getTime() - previousEntry.clockIn.getTime();
      if (diffMs > 0) {
        const totalHours = diffMs / 1000 / 60 / 60; // ms → hours (can include minutes/seconds)
        await prisma.timeEntry.update({
          where: { id: previousEntry.id },
          data: { totalHours },
        });
      }
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        clockIn,
        clockOut: null,
        breakMinutes: 0,
        totalHours: null,
        status: "RECORDED",
        notes: null,
        taskDescription: type === "Task" ? (typeof taskDescription === "string" ? taskDescription.trim() : null) : null,
        kind: type,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
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

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

