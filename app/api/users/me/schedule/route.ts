import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";
import { canEditEmployeeSchedules } from "@/lib/schedule-editors";

const prisma = new PrismaClient();

const MINUTES_PER_DAY = 24 * 60;

export async function PATCH(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const sessionUserId = userResult.userId;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as { scheduleStartMinutes?: unknown; targetUserId?: unknown };
    const raw = b.scheduleStartMinutes;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw >= MINUTES_PER_DAY) {
      return NextResponse.json(
        { error: "scheduleStartMinutes must be an integer from 0 to 1439 (minutes from midnight, GMT+8)." },
        { status: 400 },
      );
    }

    const actor = await prisma.users.findUnique({
      where: { id: sessionUserId },
      include: { position: true },
    });
    if (!actor?.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canEditEmployeeSchedules(actor.position?.title)) {
      return NextResponse.json(
        {
          error:
            "Only Team Lead, Finance Officer, Business Development Manager, and Project Manager can edit schedules.",
        },
        { status: 403 },
      );
    }

    let targetUserId = sessionUserId;
    if (b.targetUserId !== undefined && b.targetUserId !== null) {
      if (typeof b.targetUserId !== "number" || !Number.isInteger(b.targetUserId) || b.targetUserId < 1) {
        return NextResponse.json({ error: "targetUserId must be a positive integer when provided." }, { status: 400 });
      }
      targetUserId = b.targetUserId;
    }

    if (targetUserId !== sessionUserId) {
      const target = await prisma.users.findUnique({ where: { id: targetUserId } });
      if (!target || !target.isActive) {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }
    }

    await prisma.users.update({
      where: { id: targetUserId },
      data: { scheduleStartMinutes: raw },
    });

    return NextResponse.json({ ok: true, scheduleStartMinutes: raw, targetUserId }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to update schedule", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}
