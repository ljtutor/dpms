import { NextResponse } from "next/server";

import { NotificationType } from "@/app/generated/prisma/enums";
import { AuthErrors, SuccessMessages, ValidationErrors } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const numId = Number(id);
        if (Number.isNaN(numId))
            return NextResponse.json({ error: ValidationErrors.INVALID_LEAVE_ID }, { status: 400 });

        const leaveRequest = await prisma.leaveRequests.findUnique({
            where: { id: numId },
            include: {
                user: {
                    include: {
                        employeeInformation: true,
                        companyInformation: {
                            include: {
                                position: true
                            }
                        },
                    },
                },
                leaveType: true,
                approvedBy: {
                    include: {
                        employeeInformation: true
                    }
                },
                receiver: {
                    include: {
                        employeeInformation: true
                    }
                },
            },
        });

        if (!leaveRequest)
            return NextResponse.json({ error: AuthErrors.LEAVE_NOT_FOUND }, { status: 404 });

        return NextResponse.json(
            {
                leaveRequest: {
                    id: leaveRequest.id,
                    user: {
                        id: leaveRequest.user.id,
                        employeeInformation: leaveRequest.user.employeeInformation,
                        companyInformation: leaveRequest.user.companyInformation,
                    },
                    dateFiled: leaveRequest.dateFiled.toISOString(),
                    leaveType: leaveRequest.leaveType,
                    dateFrom: leaveRequest.dateFrom.toISOString(),
                    dateTo: leaveRequest.dateTo.toISOString(),
                    noOfDays: leaveRequest.noOfDays,
                    reason: leaveRequest.reason,
                    attachment: leaveRequest.attachment,
                    eSignature: leaveRequest.user.employeeInformation?.eSignature,
                    approvedBy: leaveRequest.approvedBy.map((u) => ({
                        id: u.id,
                        employeeInformation: u.employeeInformation,
                    })),
                    isApproved: leaveRequest.isApproved,
                    dateApproved: leaveRequest.dateApproved?.toISOString() ?? null,
                    receiver: {
                        id: leaveRequest.receiver.id,
                        employeeInformation: leaveRequest.receiver.employeeInformation,
                    },
                    isAccepted: leaveRequest.isAccepted,
                    dateAccepted: leaveRequest.dateAccepted?.toISOString() ?? null,
                },
            },
            { status: 200 },
        );
    } catch {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const numId = Number(id);
        if (Number.isNaN(numId))
            return NextResponse.json({ error: ValidationErrors.INVALID_LEAVE_ID }, { status: 400 });

        const body = await req.json();
        const {
            isApproved,
            isAccepted,
            userId
        } = body;

        const leaveRequest = await prisma.leaveRequests.findUnique({
            where: { id: numId },
            include: { approvedBy: true },
        });
        if (!leaveRequest)
            return NextResponse.json({ error: AuthErrors.LEAVE_NOT_FOUND }, { status: 404 });

        if (typeof isApproved === "boolean") {
            await prisma.leaveRequests.update({
                where: { id: numId },
                data: {
                    isApproved,
                    dateApproved: new Date(),
                },
            });

            await prisma.notifications.create({
                data: {
                    type: isApproved ? NotificationType.APPROVE : NotificationType.DENY,
                    fromId: userId,
                    toUsers: {
                        connect: [{
                            id: Number(leaveRequest.userId)
                        }]
                    },
                    ...(isApproved ? {
                        ccUsers: {
                            connect: [{
                                id: Number(leaveRequest.receivedBy)
                            }]
                        }
                    } : {}),
                    leaveRequestId: leaveRequest.id,
                },
            });

            return NextResponse.json(
                {
                    message: isApproved ? SuccessMessages.LEAVE_REQUEST_APPROVED : SuccessMessages.LEAVE_REQUEST_DENIED,
                    success: true,
                },
                { status: 200 },
            );
        }

        if (typeof isAccepted === "boolean") {
            await prisma.leaveRequests.update({
                where: { id: numId },
                data: {
                    isAccepted,
                    dateAccepted: new Date(),
                },
            });

            await prisma.notifications.create({
                data: {
                    type: isAccepted ? NotificationType.ACCEPT : NotificationType.DECLINE,
                    fromId: userId,
                    toUsers: {
                        connect: [{
                            id: Number(leaveRequest.userId)
                        }]
                    },
                    ccUsers: {
                        connect: leaveRequest.approvedBy.map((u) => ({
                            id: u.id
                        }))
                    },
                    leaveRequestId: leaveRequest.id,
                },
            });

            return NextResponse.json(
                {
                    message: isAccepted ? SuccessMessages.LEAVE_REQUEST_ACCEPTED : SuccessMessages.LEAVE_REQUEST_DECLINED,
                    success: true,
                },
                { status: 200 },
            );
        }
    } catch {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}