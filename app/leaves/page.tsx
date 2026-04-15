import { Metadata } from "next";

import LeavesClient from "@/components/leaves/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Leaves",
};

export default async function Leaves() {
    const leaves = await prisma.leaves.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <LeavesClient leaves={leaves}/>
    );
}