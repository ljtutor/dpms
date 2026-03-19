import { NextResponse } from "next/server";

import { PrismaClient } from "@/app/generated/prisma/client";
import { Role } from "@/app/generated/prisma/enums";

import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            first_name,
            middle_name,
            last_name,
            email,
            birthday,
            position_id,
            role,
            isActive
        } = body;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_USER_ID }, { status: 400 });

        const user = await prisma.users.findUnique({where: { id: Number(id) }});
        if (!user)
            return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 401 });

        if (first_name.trim() === "")
            return NextResponse.json({ error: ValidationErrors.FIRST_NAME_REQUIRED }, { status: 400 });

        if (last_name.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LAST_NAME_REQUIRED }, { status: 400 });
        
        if (email.trim() === "")
            return NextResponse.json({ error: ValidationErrors.EMAIL_REQUIRED }, { status: 400 });
      
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return NextResponse.json({ error: ValidationErrors.INVALID_EMAIL_FORMAT }, { status: 400 });

        if (role.trim() === "")
            return NextResponse.json({ error: ValidationErrors.ROLE_REQUIRED }, { status: 400 });

        if (role.trim() !== Role.ADMIN && role.trim() !== Role.USER)
            return NextResponse.json({ error: ValidationErrors.INVALID_ROLE }, { status: 400 });

        if (isActive.trim() === "")
            return NextResponse.json({ error: ValidationErrors.STATUS_REQUIRED }, { status: 400 });
        
        await prisma.users.update({
            where: { id: Number(id) },
            data: {
                first_name,
                middle_name: middle_name || null,
                last_name,
                email,
                birthday: birthday ? new Date(birthday) : null,
                position_id: position_id ? Number(position_id) : null,
                role,
                isActive: isActive === "true" ? true : false,
                updated_at: new Date()
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.USER_UPDATED,
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
            return NextResponse.json({ error: ValidationErrors.INVALID_USER_ID }, { status: 400 });

        const user = await prisma.users.findUnique({ where: { id: Number(id) } });
        if (!user)
            return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 401 });

        await prisma.users.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            {
                message: SuccessMessages.USER_REMOVED,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}