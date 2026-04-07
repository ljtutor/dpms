import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";
import { canEditEmployeeSchedules } from "@/lib/schedule-editors";

const prisma = new PrismaClient();

function displayName(u: { first_name: string; middle_name: string | null; last_name: string }) {
  const mid = u.middle_name?.trim();
  return [u.first_name, mid, u.last_name].filter(Boolean).join(" ");
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;

    const me = await prisma.users.findUnique({
      where: { id: userResult.userId },
      include: { position: true },
    });

    if (!me || !me.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canEditOthers = canEditEmployeeSchedules(me.position?.title);

    if (!canEditOthers) {
      return NextResponse.json(
        {
          currentUserId: me.id,
          canEditOthers: false,
          employees: [] as { id: number; name: string; position: string | null; scheduleStartMinutes: number | null }[],
        },
        { status: 200 },
      );
    }

    const rows = await prisma.users.findMany({
      where: { isActive: true },
      include: { position: true },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
    });

    return NextResponse.json({
      currentUserId: me.id,
      canEditOthers: true,
      employees: rows.map((u) => ({
        id: u.id,
        name: displayName(u),
        position: u.position?.title ?? null,
        scheduleStartMinutes: u.scheduleStartMinutes,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load schedule context", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}
