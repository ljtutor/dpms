import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";

const prisma = new PrismaClient();

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const currentUserId = userResult.userId;

    const { searchParams } = new URL(req.url);
    const monthRaw = searchParams.get("month");
    const parseLocalDate = (value: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!m) return new Date(NaN);
      const year = Number(m[1]);
      const month = Number(m[2]) - 1;
      const day = Number(m[3]);
      return new Date(year, month, day);
    };
    const month = monthRaw ? parseLocalDate(monthRaw) : new Date();

    if (Number.isNaN(month.getTime())) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const reminders = await prisma.calendarReminder.findMany({
      where: {
        date: {
          gte: startOfDay(monthStart),
          lte: endOfDay(monthEnd),
        },
        OR: [
          { ownerId: currentUserId },
          { shares: { some: { userId: currentUserId } } },
        ],
      },
      include: {
        owner: { select: { id: true, first_name: true, last_name: true } },
        shares: {
          include: {
            user: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const shareableUsers = await prisma.users.findMany({
      where: { isActive: true },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        position: { select: { title: true } },
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    });

    return NextResponse.json(
      {
        reminders: reminders.map((r) => ({
          id: r.id,
          title: r.title,
          note: r.note,
          time: r.time,
          date: r.date.toISOString(),
          owner: {
            id: r.owner.id,
            name: `${r.owner.first_name} ${r.owner.last_name}`.trim(),
          },
          sharedWith: r.shares.map((s) => ({
            id: s.user.id,
            name: `${s.user.first_name} ${s.user.last_name}`.trim(),
          })),
        })),
        users: shareableUsers.map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          position: u.position?.title ?? null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to fetch employee calendar",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const currentUserId = userResult.userId;

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const dateRaw = typeof body.date === "string" ? body.date : "";
    const shareUserIdsRaw = Array.isArray(body.shareUserIds)
      ? body.shareUserIds
      : [];

    if (!title) {
      return NextResponse.json(
        { error: "Reminder title is required" },
        { status: 400 },
      );
    }

    const reminderDate = new Date(dateRaw);
    if (!dateRaw || Number.isNaN(reminderDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const uniqueShareIds: number[] = [
      ...new Set<number>(
        shareUserIdsRaw
          .map((v: unknown) => Number(v))
          .filter(
            (v: number) => Number.isInteger(v) && v > 0 && v !== currentUserId,
          ),
      ),
    ];

    const created = await prisma.calendarReminder.create({
      data: {
        ownerId: currentUserId,
        date: startOfDay(reminderDate),
        title,
        note: note || null,
        time: time || null,
        shares: uniqueShareIds.length
          ? {
              create: uniqueShareIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        owner: { select: { id: true, first_name: true, last_name: true } },
        shares: {
          include: {
            user: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        reminder: {
          id: created.id,
          title: created.title,
          note: created.note,
          time: created.time,
          date: created.date.toISOString(),
          owner: {
            id: created.owner.id,
            name: `${created.owner.first_name} ${created.owner.last_name}`.trim(),
          },
          sharedWith: created.shares.map((s) => ({
            id: s.user.id,
            name: `${s.user.first_name} ${s.user.last_name}`.trim(),
          })),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to create reminder",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
