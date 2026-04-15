import { Metadata } from "next";

import { Role } from "@/app/generated/prisma/enums";
import RequestLeaveCreateClient from "@/components/requests/leave/create/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Leave Application Form",
};

export default async function LeaveRequestCreate() {
    const users = await prisma.users.findMany({
        include: {
            employeeInformation: true,
            companyInformation: {
                include: {
                    position: true
                }
            },
        },
        where: {
            isActive: true,
            role: {
                in: [Role.MANAGER],
            },
        },
        orderBy: { id: "asc" },
    });

    const leaves = await prisma.leaves.findMany({
        orderBy: { id: "asc" },
    });

    const leaveRequests = await prisma.leaveRequests.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <RequestLeaveCreateClient users={users} leaves={leaves} leaveRequests={leaveRequests}/>
    );
}