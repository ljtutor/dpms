import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";

const prisma = new PrismaClient();

const MINUTES_PER_DAY = 24 * 60;

export async function PATCH(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;
    const userId = userResult.userId;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const raw = (body as { scheduleStartMinutes?: unknown }).scheduleStartMinutes;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw >= MINUTES_PER_DAY) {
      return NextResponse.json(
        { error: "scheduleStartMinutes must be an integer from 0 to 1439 (minutes from midnight, GMT+8)." },
        { status: 400 },
      );
    }

    await prisma.users.update({
      where: { id: userId },
      data: { scheduleStartMinutes: raw },
    });

    return NextResponse.json({ ok: true, scheduleStartMinutes: raw }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to update schedule", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}
