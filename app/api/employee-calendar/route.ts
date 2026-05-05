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

function fullNameFromUser(u: {
  employeeInformation: { firstName: string; lastName: string } | null;
}) {
  return `${u.employeeInformation?.firstName ?? ""} ${u.employeeInformation?.lastName ?? ""}`.trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar YYYY-MM-DD (matches employee-calendar UI). */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Expand accepted leave range into each local calendar day overlapping [monthStart, monthEnd]. */
function expandAcceptedLeavesForMonth(
  leaves: Array<{
    id: number;
    userId: number;
    dateFrom: Date;
    dateTo: Date;
    user: {
      employeeInformation: { firstName: string; lastName: string } | null;
    };
    leaveType: { type: string };
  }>,
  monthStart: Date,
  monthEnd: Date,
): Array<{
  dateKey: string;
  leaveRequestId: number;
  userId: number;
  userName: string;
  leaveType: string;
}> {
  const monthFirst = startOfDay(monthStart);
  const monthLast = endOfDay(monthEnd);
  const out: Array<{
    dateKey: string;
    leaveRequestId: number;
    userId: number;
    userName: string;
    leaveType: string;
  }> = [];

  for (const lr of leaves) {
    const leaveStart = startOfDay(new Date(lr.dateFrom));
    const leaveEnd = endOfDay(new Date(lr.dateTo));
    const rangeStartMs = Math.max(leaveStart.getTime(), monthFirst.getTime());
    const rangeEndMs = Math.min(leaveEnd.getTime(), monthLast.getTime());
    if (rangeStartMs > rangeEndMs) continue;

    const rangeStart = new Date(rangeStartMs);
    const rangeEnd = new Date(rangeEndMs);
    let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const lastDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());

    const userName = fullNameFromUser(lr.user);
    while (cur.getTime() <= lastDay.getTime()) {
      out.push({
        dateKey: localDateKey(cur),
        leaveRequestId: lr.id,
        userId: lr.userId,
        userName,
        leaveType: lr.leaveType.type,
      });
      cur.setDate(cur.getDate() + 1);
    }
  }

  return out;
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

    const [reminders, acceptedLeavesRaw] = await Promise.all([
      prisma.calendarReminder.findMany({
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
          owner: {
            select: {
              id: true,
              employeeInformation: { select: { firstName: true, lastName: true } },
            },
          },
          shares: {
            include: {
              user: {
                select: {
                  id: true,
                  employeeInformation: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      }),
      prisma.leaveRequests.findMany({
        where: {
          isAccepted: true,
          user: { isActive: true },
          dateFrom: { lte: endOfDay(monthEnd) },
          dateTo: { gte: startOfDay(monthStart) },
        },
        select: {
          id: true,
          userId: true,
          dateFrom: true,
          dateTo: true,
          user: {
            select: {
              employeeInformation: { select: { firstName: true, lastName: true } },
            },
          },
          leaveType: { select: { type: true } },
        },
      }),
    ]);

    const acceptedLeaves = expandAcceptedLeavesForMonth(acceptedLeavesRaw, monthStart, monthEnd);

    const shareableUsers = await prisma.users.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeInformation: { select: { firstName: true, lastName: true } },
        companyInformation: {
          select: {
            position: { select: { title: true } },
          },
        },
      },
    });

    shareableUsers.sort((a, b) => {
      const aFirst = a.employeeInformation?.firstName ?? "";
      const bFirst = b.employeeInformation?.firstName ?? "";
      if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);
      const aLast = a.employeeInformation?.lastName ?? "";
      const bLast = b.employeeInformation?.lastName ?? "";
      return aLast.localeCompare(bLast);
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
            name: fullNameFromUser(r.owner),
          },
          sharedWith: r.shares.map((s) => ({
            id: s.user.id,
            name: fullNameFromUser(s.user),
          })),
        })),
        users: shareableUsers.map((u) => ({
          id: u.id,
          name: fullNameFromUser(u),
          position: u.companyInformation?.position?.title ?? null,
        })),
        acceptedLeaves,
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
        owner: {
          select: {
            id: true,
            employeeInformation: { select: { firstName: true, lastName: true } },
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                employeeInformation: { select: { firstName: true, lastName: true } },
              },
            },
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
            name: fullNameFromUser(created.owner),
          },
          sharedWith: created.shares.map((s) => ({
            id: s.user.id,
            name: fullNameFromUser(s.user),
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
