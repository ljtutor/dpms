import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Authorized from "@/components/Authorized";
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
        <Authorized>
            <UsersClient users={users} positions={positions} />
        </Authorized>
    );
}