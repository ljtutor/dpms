import { NextRequest, NextResponse } from "next/server";

import { Role } from "@/app/generated/prisma/enums";
import { getUserIdFromRequest } from "@/lib/auth-request";
import prisma from "@/lib/prisma";
import { timesheetReportToWorkbookBuffer } from "@/lib/timesheets-excel";
import { buildTimesheetReport } from "@/lib/timesheets-report";

async function requireManagerOrAdmin(userId: number): Promise<boolean> {
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { isActive: true, role: true },
  });
  if (!u?.isActive) return false;
  return u.role === Role.MANAGER || u.role === Role.ADMIN;
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;

    const allowed = await requireManagerOrAdmin(userResult.userId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const halfRaw = Number(searchParams.get("half"));
    const half: 1 | 2 = halfRaw === 2 ? 2 : 1;

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    const report = await buildTimesheetReport(prisma, year, month, half);

    if (searchParams.get("format") === "xlsx") {
      const buf = await timesheetReportToWorkbookBuffer(report);
      const fn = `timesheets-${year}-${String(month).padStart(2, "0")}-half${half}.xlsx`;
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fn}"`,
        },
      });
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to load timesheets",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
