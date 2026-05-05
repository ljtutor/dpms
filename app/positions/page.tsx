import { Metadata } from "next";

import PositionsClient from "@/components/positions/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Positions",
};

export const dynamic = "force-dynamic";

export default async function Positions() {
    const positions = await prisma.positions.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <PositionsClient positions={positions} />
    );
}