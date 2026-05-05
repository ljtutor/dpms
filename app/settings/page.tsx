import jwt from "jsonwebtoken";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SettingsClient from "@/components/settings/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const cookieToken = (await cookies()).get("token")?.value;
    if (!cookieToken) redirect("/auth/login");

    const payload = jwt.verify(cookieToken, process.env.JWT_SECRET!) as { id: number };
    const userId = payload.id;

    const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
            employeeInformation: true,
            companyInformation: { include: { position: true } },
        },
    });

    const leaves = await prisma.leaves.findMany({
        include: {
            leaveRequests: true,
        },
    });

    const leaveRequests = await prisma.leaveRequests.findMany({
        where: { userId: userId },
        include: {
            leaveType: true
        },
    });

    return (
        <SettingsClient user={user} leaves={leaves} leaveRequests={leaveRequests}/>
    );
}