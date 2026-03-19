import { Metadata } from "next";
import prisma from "@/lib/prisma";
import ShiftsClient from "@/components/shifts/ShiftsClient";

export const metadata: Metadata = {
    title: "Shifts",
};

export default async function Shifts() {
    const shifts = await prisma.shifts.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <ShiftsClient shifts={shifts} />
    );
}