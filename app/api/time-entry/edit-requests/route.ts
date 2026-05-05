import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { TimeEntryEditRequestStatus } from "@/app/generated/prisma/enums";
import { getUserIdFromRequest } from "@/lib/auth-request";
import { canApproveTimeLogEdits } from "@/lib/schedule-editors";
const prisma = new PrismaClient();

const LOG_KINDS = new Set(["Time In", "Task", "Break", "Lunch", "Time Out"]);

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

/** GET ?scope=pending (approvers) | mine (current user's requests) */
export async function GET(req: NextRequest) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;

    const scope = req.nextUrl.searchParams.get("scope") ?? "mine";

    const me = await prisma.users.findUnique({
      where: { id: userResult.userId },
      include: {
        employeeInformation: true,
        companyInformation: { include: { position: true } },
      },
    });
    if (!me?.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (scope === "pending") {
      if (!canApproveTimeLogEdits(me.companyInformation?.position?.title, me.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const rows = await prisma.timeEntryEditRequest.findMany({
        where: { status: TimeEntryEditRequestStatus.PENDING },
        orderBy: { createdAt: "asc" },
        include: {
          requester: {
            include: {
              employeeInformation: true,
              companyInformation: { include: { position: true } },
            },
          },
          timeEntry: true,
        },
      });
      return NextResponse.json({
        requests: rows.map((r) => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          employeeNote: r.employeeNote,
          proposedClockIn: r.proposedClockIn.toISOString(),
          proposedKind: r.proposedKind,
          proposedTaskDescription: r.proposedTaskDescription,
          requester: {
            id: r.requester.id,
            name: displayName(r.requester),
            position: r.requester.companyInformation?.position?.title ?? null,
          },
          timeEntry: {
            id: r.timeEntry.id,
            clockIn: r.timeEntry.clockIn.toISOString(),
            kind: r.timeEntry.kind,
            taskDescription: r.timeEntry.taskDescription,
            isLate: r.timeEntry.isLate,
          },
        })),
      });
    }

    if (scope === "mine") {
      const rows = await prisma.timeEntryEditRequest.findMany({
        where: { requesterId: userResult.userId },
        orderBy: { createdAt: "desc" },
        include: { timeEntry: true },
      });
      return NextResponse.json({
        requests: rows.map((r) => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          reviewerComment: r.reviewerComment,
          proposedClockIn: r.proposedClockIn.toISOString(),
          proposedKind: r.proposedKind,
          proposedTaskDescription: r.proposedTaskDescription,
          employeeNote: r.employeeNote,
          timeEntryId: r.timeEntryId,
          timeEntry: {
            id: r.timeEntry.id,
            clockIn: r.timeEntry.clockIn.toISOString(),
            kind: r.timeEntry.kind,
          },
        })),
      });
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to list requests", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    const b = body as {
      timeEntryId?: unknown;
      proposedClockIn?: unknown;
      proposedKind?: unknown;
      proposedTaskDescription?: unknown;
      employeeNote?: unknown;
    };

    if (typeof b.timeEntryId !== "number" || !Number.isInteger(b.timeEntryId) || b.timeEntryId < 1) {
      return NextResponse.json({ error: "timeEntryId is required" }, { status: 400 });
    }
    if (typeof b.proposedClockIn !== "string") {
      return NextResponse.json({ error: "proposedClockIn (ISO string) is required" }, { status: 400 });
    }
    if (typeof b.proposedKind !== "string" || !LOG_KINDS.has(b.proposedKind)) {
      return NextResponse.json({ error: "Invalid proposedKind" }, { status: 400 });
    }

    const proposedClockIn = new Date(b.proposedClockIn);
    if (Number.isNaN(proposedClockIn.getTime())) {
      return NextResponse.json({ error: "Invalid proposedClockIn" }, { status: 400 });
    }

    const taskDesc =
      typeof b.proposedTaskDescription === "string" ? b.proposedTaskDescription.trim() : null;
    if (b.proposedKind === "Task" && !taskDesc) {
      return NextResponse.json({ error: "Task description is required when type is Task" }, { status: 400 });
    }

    const employeeNote =
      typeof b.employeeNote === "string" ? b.employeeNote.trim().slice(0, 500) : null;

    const entry = await prisma.timeEntry.findFirst({
      where: { id: b.timeEntryId, userId },
    });
    if (!entry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    const existing = await prisma.timeEntryEditRequest.findFirst({
      where: {
        timeEntryId: entry.id,
        status: TimeEntryEditRequestStatus.PENDING,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A pending edit request already exists for this log." },
        { status: 409 },
      );
    }

    const created = await prisma.timeEntryEditRequest.create({
      data: {
        timeEntryId: entry.id,
        requesterId: userId,
        proposedClockIn,
        proposedKind: b.proposedKind,
        proposedTaskDescription: b.proposedKind === "Task" ? taskDesc : null,
        employeeNote,
      },
    });

    return NextResponse.json(
      {
        request: {
          id: created.id,
          status: created.status,
          proposedClockIn: created.proposedClockIn.toISOString(),
          proposedKind: created.proposedKind,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to create request", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}
