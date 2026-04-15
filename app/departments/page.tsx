import { Metadata } from "next";

import DepartmentsClient from "@/components/departments/client";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Departments",
};

export default async function DepartmentsPage() {
    const departments = await prisma.departments.findMany({
        orderBy: { id: "asc" },
    });

    return (
        <DepartmentsClient departments={departments}/>
    );
}