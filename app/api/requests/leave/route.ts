import { NextResponse } from "next/server";

import { NotificationType } from "@/app/generated/prisma/enums";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";
import { getRemainingLeaves } from "@/lib/leaveBalances";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const userId = formData.get("userId") as string;
        const dateFiled = formData.get("dateFiled") as string;
        const leaveTypeId = formData.get("type") as string;
        const dateFrom = formData.get("dateFrom") as string;
        const dateTo = formData.get("dateTo") as string;
        const noOfDays = formData.get("noOfDays") as string;
        const reason = formData.get("reason") as string | null;
        const approvedBy = formData.getAll("approvedBy[]") as string[];
        const receivedBy = formData.get("receivedBy") as string;

        const signatureFile = formData.get("signature") as File | null;
        let eSignatureBytes: Uint8Array | null = null;

        if (signatureFile && signatureFile.size > 0) {
            const arrayBuffer = await signatureFile.arrayBuffer();
            const view = new Uint8Array(arrayBuffer);
            eSignatureBytes = Uint8Array.from(view);
        }

        if (leaveTypeId.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LEAVE_TYPE_REQUIRED }, { status: 400 });

        const leaveType = await prisma.leaves.findUnique({where: { id: Number(leaveTypeId) }});
        if (!leaveType)
            return NextResponse.json({ error: AuthErrors.LEAVE_NOT_FOUND }, { status: 401 });

        if (noOfDays.trim() === "")
            return NextResponse.json({ error: ValidationErrors.NUMBER_OF_DAYS_REQUIRED }, { status: 400 });

        if (Number(noOfDays) <= 0 || Number.isNaN(Number(noOfDays)))
            return NextResponse.json({ error: ValidationErrors.INVALID_NUMBER_OF_DAYS }, { status: 400 });

        if (dateFrom.trim() === "")
            return NextResponse.json({ error: ValidationErrors.DATE_FROM_REQUIRED }, { status: 400 });

        if (dateTo.trim() === "")
            return NextResponse.json({ error: ValidationErrors.DATE_TO_REQUIRED }, { status: 400 });

        if (new Date(dateFrom) > new Date(dateTo))
            return NextResponse.json({ error: ValidationErrors.INVALID_DATE_RANGE }, { status: 400 });

        if (approvedBy.length === 0)
            return NextResponse.json({ error: ValidationErrors.APPROVER_REQUIRED }, { status: 400 });

        if (receivedBy.trim() === "")
            return NextResponse.json({ error: ValidationErrors.RECEIVER_REQUIRED }, { status: 400 });

        const u = await prisma.users.findUnique({where: { id: Number(userId) }});
        const l = await prisma.leaves.findUnique({where: { id: Number(leaveTypeId) }});
        const lr = await prisma.leaveRequests.findMany({where: { userId: Number(userId), leaveTypeId: Number(leaveTypeId), isApproved: true, isAccepted: true }});
        const remainingLeaves = getRemainingLeaves(u, l, lr);
        if (Number(noOfDays) > remainingLeaves)
            return NextResponse.json({ error: ValidationErrors.INSUFFICIENT_LEAVE_BALANCE }, { status: 400 });

        const leaveRequest = await prisma.leaveRequests.create({
            data: {
                userId: Number(userId),
                dateFiled: new Date(dateFiled),
                leaveTypeId: Number(leaveTypeId),
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo),
                noOfDays: Number(noOfDays),
                reason,
                eSignature: eSignatureBytes ? new Uint8Array(eSignatureBytes) : undefined,
                approvedBy: { connect: approvedBy.map((id: string) => ({ id: Number(id) })) },
                receivedBy: Number(receivedBy),
            },
        });

        await prisma.notifications.create({
            data: {
                type: NotificationType.SUBMIT,
                fromId: Number(userId),
                toUsers: {
                    connect: approvedBy.map((id: string) => ({
                        id: Number(id)
                    }))
                },
                ccUsers: {
                    connect: [{
                        id: Number(receivedBy)
                    }]
                },
                leaveRequestId: leaveRequest.id,
            },
        });

        return NextResponse.json(
            {
                leaveRequest: {
                    id: leaveRequest.id,
                },
                message: SuccessMessages.LEAVE_REQUEST_CREATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}