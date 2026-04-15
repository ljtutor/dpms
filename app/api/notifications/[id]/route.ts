import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = await params;
    const id = Number(idParam);

    const notification = await prisma.notifications.update({
        where: {
            id
        },
        data: {
            isRead: true
        },
        include: {
            leaveRequest: true
        }
    });

    return NextResponse.redirect(new URL(`/requests/leave/${notification.leaveRequestId}`, req.url));
}