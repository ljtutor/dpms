import { Metadata } from "next";
import prisma from "@/lib/prisma";
import UsersClient from "@/components/users/UsersClient";

export const metadata: Metadata = {
    title: "Users",
};

export default async function Users() {
    const users = await prisma.users.findMany({
        include: { position: true },
        orderBy: { id: "asc" },
    });

    const positions = await prisma.positions.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <UsersClient users={users} positions={positions} />
    );
}