import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import prisma from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export default async function NotificationRedirectPage({ params }: PageProps) {
    const { id } = await params;
    const numId = Number(id);
    if (Number.isNaN(numId)) notFound();

    const token = (await cookies()).get("token")?.value;
    if (!token) redirect("/auth/login");

    let userId: number;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        userId = payload.id;
    } catch {
        redirect("/auth/login");
    }

    const notification = await prisma.notifications.findFirst({
        where: {
            id: numId,
            AND: [
                {
                    OR: [
                        { fromId: userId },
                        { toUsers: { some: { id: userId } } },
                        { ccUsers: { some: { id: userId } } },
                    ],
                }
            ],
        },
    });

    if (!notification) notFound();

    await prisma.notifications.update({
        where: { id: numId },
        data: { isRead: true },
    });

    if (notification.leaveRequestId == null) notFound();

    redirect(`/requests/leave/${notification.leaveRequestId}`);
}
