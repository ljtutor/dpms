import { NextResponse } from "next/server";

import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name
        } = body;

        if (name.trim() === "")
            return NextResponse.json({ error: ValidationErrors.DEPARTMENT_NAME_REQUIRED }, { status: 400 });

        const department = await prisma.departments.findUnique({where: { name }});
        if (department)
            return NextResponse.json({ error: ValidationErrors.DEPARTMENT_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.departments.create({
            data: {
                name
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.DEPARTMENT_CREATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}