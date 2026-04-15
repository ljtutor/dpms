import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { NotificationType } from "@/app/generated/prisma/enums";
import { AuthErrors } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const cookieToken = (await cookies()).get("token")?.value;

        const token = cookieToken;
        if (!token)
            return NextResponse.json({ error: AuthErrors.NOT_LOGGED_IN }, { status: 401 });

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        const userId = payload.id;

        const notifications = await prisma.notifications.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { fromId: userId },
                            { toUsers: { some: { id: userId } } },
                            { ccUsers: { some: { id: userId } } },
                        ],
                    },
                    {
                        NOT: {
                            AND: [
                                { type: NotificationType.SUBMIT },
                                { ccUsers: { some: { id: userId } } },
                            ],
                        },
                    },
                ],
            },
            include: {
                fromUser: {
                    include: {
                        employeeInformation: true,
                    },
                },
                toUsers: {
                    include: {
                        employeeInformation: true,
                    },
                },
                ccUsers: {
                    include: {
                        employeeInformation: true,
                    },
                },
                leaveRequest: {
                    include: {
                        leaveType: true,
                    },
                },
            },
            orderBy: { id: "desc" },
            take: 5,
        });

        const unreadCount = await prisma.notifications.count({
            where: {
                isRead: false,
                OR: [
                    { fromId: userId },
                    { toUsers: { some: { id: userId } } },
                    { ccUsers: { some: { id: userId } } },
                ],
                NOT: {
                    AND: [
                        { type: NotificationType.SUBMIT },
                        { ccUsers: { some: { id: userId } } },
                    ],
                },
            },
        });

        return NextResponse.json(
            {
                unreadCount,
                notifications: notifications.map((n) => ({
                    id: n.id,
                    type: n.type,
                    fromId: n.fromId,
                    fromUser: {
                        id: n.fromUser.id,
                        employeeInformation: n.fromUser.employeeInformation,
                    },
                    toUsers: n.toUsers.map((u) => ({
                        id: u.id,
                        employeeInformation: u.employeeInformation,
                    })),
                    ccUsers: n.ccUsers.map((u) => ({
                        id: u.id,
                        employeeInformation: u.employeeInformation,
                    })),
                    isRead: n.isRead,
                    leaveRequest: {
                        id: n.leaveRequestId,
                        leaveType: n.leaveRequest?.leaveType,
                    },
                    createdAt: n.createdAt.toISOString(),
                })),
            },
            { status: 200 },
        );
    } catch {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}