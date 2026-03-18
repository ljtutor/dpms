import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Authorized from "@/components/Authorized";
import PositionsClient from "@/components/positions/PositionsClient";

export const metadata: Metadata = {
    title: "Positions",
};

export default async function Positions() {
    const positions = await prisma.positions.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <Authorized>
            <PositionsClient positions={positions} />
        </Authorized>
    );
}