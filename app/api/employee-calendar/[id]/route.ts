import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";

const prisma = new PrismaClient();

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
