import { NextResponse } from "next/server";

import { Role } from "@/app/generated/prisma/enums";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            firstName,
            middleName,
            lastName,
            email,
            birthday,
            positionId,
            role,
            isActive
        } = body;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_USER_ID }, { status: 400 });

        const user = await prisma.users.findUnique({where: { id: Number(id) }});
        if (!user)
            return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 401 });

        if (firstName.trim() === "")
            return NextResponse.json({ error: ValidationErrors.FIRST_NAME_REQUIRED }, { status: 400 });

        if (lastName.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LAST_NAME_REQUIRED }, { status: 400 });
        
        if (email.trim() === "")
            return NextResponse.json({ error: ValidationErrors.EMAIL_REQUIRED }, { status: 400 });
      
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return NextResponse.json({ error: ValidationErrors.INVALID_EMAIL_FORMAT }, { status: 400 });

        const user_email = await prisma.users.findUnique({where: { email }});
        if (user_email && user_email.id !== Number(id))
            return NextResponse.json({ error: ValidationErrors.EMAIL_ALREADY_EXISTS }, { status: 400 });

        if (role.trim() === "")
            return NextResponse.json({ error: ValidationErrors.ROLE_REQUIRED }, { status: 400 });

        if (role.trim() !== Role.ADMIN && role.trim() !== Role.MANAGER && role.trim() !== Role.USER)
            return NextResponse.json({ error: ValidationErrors.INVALID_ROLE }, { status: 400 });

        if (isActive.trim() === "")
            return NextResponse.json({ error: ValidationErrors.STATUS_REQUIRED }, { status: 400 });
        
        await prisma.users.update({
            where: { id: Number(id) },
            data: {
                email,
                role,
                isActive: isActive === "true" ? true : false,
                employeeInformation: {
                    update: {
                        firstName,
                        middleName: middleName || null,
                        lastName,
                        birthday: birthday ? new Date(birthday) : null,
                    },
                },
                companyInformation: {
                    update: {
                        positionId: positionId ? Number(positionId) : null,
                    },
                },
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