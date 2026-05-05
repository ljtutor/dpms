import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { getUserIdFromRequest } from "@/lib/auth-request";
import { canEditEmployeeSchedules } from "@/lib/schedule-editors";

const prisma = new PrismaClient();

function displayName(u: {
  employeeInformation: {
    firstName: string;
    middleName: string | null;
    lastName: string;
  } | null;
}) {
  const first = u.employeeInformation?.firstName ?? "";
  const mid = u.employeeInformation?.middleName?.trim();
  const last = u.employeeInformation?.lastName ?? "";
  return [first, mid, last].filter(Boolean).join(" ").trim();
}

export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;

    const me = await prisma.users.findUnique({
      where: { id: userResult.userId },
      include: {
        employeeInformation: true,
        companyInformation: { include: { position: true } },
      },
    });

    if (!me || !me.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const canEditOthers = canEditEmployeeSchedules(me.companyInformation?.position?.title, me.role);

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
      include: {
        employeeInformation: true,
        companyInformation: { include: { position: true } },
      },
    });

    rows.sort((a, b) => {
      const aLast = a.employeeInformation?.lastName ?? "";
      const bLast = b.employeeInformation?.lastName ?? "";
      if (aLast !== bLast) return aLast.localeCompare(bLast);
      const aFirst = a.employeeInformation?.firstName ?? "";
      const bFirst = b.employeeInformation?.firstName ?? "";
      return aFirst.localeCompare(bFirst);
    });

    return NextResponse.json({
      currentUserId: me.id,
      canEditOthers: true,
      employees: rows.map((u) => ({
        id: u.id,
        name: displayName(u),
        position: u.companyInformation?.position?.title ?? null,
        scheduleStartMinutes: u.employeeInformation?.scheduleStartMinutes ?? null,
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
