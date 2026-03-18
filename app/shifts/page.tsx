import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Authorized from "@/components/Authorized";
import ShiftsClient from "@/components/shifts/ShiftsClient";

export const metadata: Metadata = {
    title: "Shifts",
};

export default async function Shifts() {
    const shifts = await prisma.shifts.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <Authorized>
            <ShiftsClient shifts={shifts} />
        </Authorized>
    );
}