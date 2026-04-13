import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";

const prisma = new PrismaClient();

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const currentUserId = userResult.userId;

    const { id } = await context.params;
    const reminderId = Number(id);
    if (!Number.isInteger(reminderId) || reminderId <= 0) {
      return NextResponse.json({ error: "Invalid reminder id" }, { status: 400 });
    }

    const reminder = await prisma.calendarReminder.findUnique({
      where: { id: reminderId },
      select: { id: true, ownerId: true },
    });
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }
    if (reminder.ownerId !== currentUserId) {
      return NextResponse.json(
        { error: "Only the owner can delete this reminder" },
        { status: 403 },
      );
    }

    await prisma.calendarReminder.delete({ where: { id: reminderId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to delete reminder",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const currentUserId = userResult.userId;

    const { id } = await context.params;
    const reminderId = Number(id);
    if (!Number.isInteger(reminderId) || reminderId <= 0) {
      return NextResponse.json({ error: "Invalid reminder id" }, { status: 400 });
    }

    const reminder = await prisma.calendarReminder.findUnique({
      where: { id: reminderId },
      select: { id: true, ownerId: true },
    });
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }
    if (reminder.ownerId !== currentUserId) {
      return NextResponse.json(
        { error: "Only the owner can edit this reminder" },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as {
      title?: unknown;
      note?: unknown;
      time?: unknown;
      date?: unknown;
      shareUserIds?: unknown;
    };

    const title = typeof b.title === "string" ? b.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Reminder title is required" }, { status: 400 });
    }

    const note = typeof b.note === "string" ? b.note.trim() : "";
    const time = typeof b.time === "string" ? b.time.trim() : "";
    const dateRaw = typeof b.date === "string" ? b.date : "";
    const shareUserIdsRaw = Array.isArray(b.shareUserIds) ? b.shareUserIds : [];

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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.reminderShare.deleteMany({ where: { reminderId } });
      return tx.calendarReminder.update({
        where: { id: reminderId },
        data: {
          date: startOfDay(reminderDate),
          title,
          note: note || null,
          time: time || null,
          shares:
            uniqueShareIds.length > 0
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
    });

    return NextResponse.json(
      {
        reminder: {
          id: updated.id,
          title: updated.title,
          note: updated.note,
          time: updated.time,
          date: updated.date.toISOString(),
          owner: {
            id: updated.owner.id,
            name: `${updated.owner.first_name} ${updated.owner.last_name}`.trim(),
          },
          sharedWith: updated.shares.map((s) => ({
            id: s.user.id,
            name: `${s.user.first_name} ${s.user.last_name}`.trim(),
          })),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to update reminder",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
