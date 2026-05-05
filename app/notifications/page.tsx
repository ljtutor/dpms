import jwt from "jsonwebtoken";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { NotificationType } from "@/app/generated/prisma/enums";
import NotificationsClient from "@/components/notifications/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Notifications",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {

    const cookieToken = (await cookies()).get("token")?.value;
    if (!cookieToken) redirect("/auth/login");

    const payload = jwt.verify(cookieToken, process.env.JWT_SECRET!) as { id: number };
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
    });

    return (
        <NotificationsClient notifications={notifications} userId={Number(userId)}/>
    );
}