import { Metadata } from "next";

import UsersClient from "@/components/users/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Users",
};

export default async function Users() {
    const users = await prisma.users.findMany({
        include: {
            employeeInformation: true,
            companyInformation: { include: { position: true } },
        },
        orderBy: { id: "asc" },
    });

    const positions = await prisma.positions.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <UsersClient users={users} positions={positions}/>
    );
}