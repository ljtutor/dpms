import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { TimeEntryEditRequestStatus } from "@/app/generated/prisma/enums";
import { getUserIdFromRequest } from "@/lib/auth-request";
import { canApproveTimeLogEdits } from "@/lib/schedule-editors";
import { recalculateDayTimeEntries } from "@/lib/time-entry-day";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userResult = await getUserIdFromRequest(req);
    if (!userResult.ok) return userResult.response;

    const idParam = (await ctx.params).id;
    const requestId = Number.parseInt(idParam, 10);
    if (!Number.isInteger(requestId) || requestId < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const reviewer = await prisma.users.findUnique({
      where: { id: userResult.userId },
      include: { position: true },
    });
    if (!reviewer?.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canApproveTimeLogEdits(reviewer.position?.title)) {
      return NextResponse.json({ error: "Only approvers may review time log edits." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const action = (body as { action?: string }).action;
    const reviewerComment =
      typeof (body as { reviewerComment?: unknown }).reviewerComment === "string"
        ? (body as { reviewerComment: string }).reviewerComment.trim().slice(0, 500)
        : null;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const editReq = await prisma.timeEntryEditRequest.findUnique({
      where: { id: requestId },
      include: { timeEntry: true },
    });
    if (!editReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (editReq.status !== TimeEntryEditRequestStatus.PENDING) {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
    }

    const now = new Date();

    if (action === "reject") {
      await prisma.timeEntryEditRequest.update({
        where: { id: requestId },
        data: {
          status: TimeEntryEditRequestStatus.REJECTED,
          reviewedById: reviewer.id,
          reviewedAt: now,
          reviewerComment,
        },
      });
      return NextResponse.json({ ok: true, status: TimeEntryEditRequestStatus.REJECTED });
    }

    // approve
    await prisma.$transaction(async (tx) => {
      await tx.timeEntry.update({
        where: { id: editReq.timeEntryId },
        data: {
          clockIn: editReq.proposedClockIn,
          kind: editReq.proposedKind,
          taskDescription:
            editReq.proposedKind === "Task" ? editReq.proposedTaskDescription?.trim() || null : null,
        },
      });
      await tx.timeEntryEditRequest.update({
        where: { id: requestId },
        data: {
          status: TimeEntryEditRequestStatus.APPROVED,
          reviewedById: reviewer.id,
          reviewedAt: now,
          reviewerComment,
        },
      });
    });

    await recalculateDayTimeEntries(prisma, editReq.timeEntry.userId, editReq.proposedClockIn);

    return NextResponse.json({ ok: true, status: TimeEntryEditRequestStatus.APPROVED });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to update request", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}
