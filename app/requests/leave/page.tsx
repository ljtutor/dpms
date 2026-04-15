import jwt from "jsonwebtoken";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LeaveRequestsClient from "@/components/requests/leave/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Leave Requests",
};

export default async function LeaveRequests() {
    const token = (await cookies()).get("token")?.value;
    if (!token) redirect("/auth/login");

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const userId = payload.id;
    
    const leaveRequests = await prisma.leaveRequests.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { userId: userId },
                        { approvedBy: { some: { id: userId } } },
                        { receiver: { id: userId } },
                    ],
                },
                {
                    NOT: {
                        AND: [
                            { isApproved: false },
                            { receivedBy: userId },
                        ],
                    },
                },
            ],
        },
        include: {
            leaveType: true,
            approvedBy: { include: { employeeInformation: true } },
            receiver: { include: { employeeInformation: true } },
        },
        orderBy: { id: "desc" },
    });
    return (
        <LeaveRequestsClient leaveRequests={leaveRequests}/>
    );
}
