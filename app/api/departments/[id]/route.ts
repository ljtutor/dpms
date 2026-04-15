import { NextResponse } from "next/server";

import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            name
        } = body;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_DEPARTMENT_ID }, { status: 400 });

        const department = await prisma.departments.findUnique({where: { id: Number(id) }});
        if (!department)
            return NextResponse.json({ error: AuthErrors.DEPARTMENT_NOT_FOUND }, { status: 401 });

        const department_name = await prisma.departments.findUnique({where: { name }});
        if (department_name && department_name.id !== Number(id))
            return NextResponse.json({ error: ValidationErrors.DEPARTMENT_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.departments.update({
            where: { id: Number(id) },
            data: {
                name
            },
        });

        return NextResponse.json(
            {
                message: SuccessMessages.DEPARTMENT_UPDATED,
                success: true,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_DEPARTMENT_ID }, { status: 400 });

        const department = await prisma.departments.findUnique({ where: { id: Number(id) } });
        if (!department)
            return NextResponse.json({ error: AuthErrors.DEPARTMENT_NOT_FOUND }, { status: 401 });

        /*const inUseCount = await prisma.companyInformation.count({
            where: { positionId: Number(id) },
        });
        if (inUseCount > 0)
            return NextResponse.json({ error: ValidationErrors.DEPARTMENT_IN_USE }, { status: 400 });
        */
        await prisma.departments.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            {
                message: SuccessMessages.DEPARTMENT_REMOVED,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}