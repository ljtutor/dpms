import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { Role } from "@/app/generated/prisma/enums";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            firstName,
            middleName,
            lastName,
            email,
            birthday,
            positionId,
            role,
        } = body;

        if (typeof firstName !== "string" || firstName.trim() === "")
            return NextResponse.json({ error: ValidationErrors.FIRST_NAME_REQUIRED }, { status: 400 });

        if (typeof lastName !== "string" || lastName.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LAST_NAME_REQUIRED }, { status: 400 });

        if (typeof email !== "string" || email.trim() === "")
            return NextResponse.json({ error: ValidationErrors.EMAIL_REQUIRED }, { status: 400 });
      
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return NextResponse.json({ error: ValidationErrors.INVALID_EMAIL_FORMAT }, { status: 400 });

        if (typeof role !== "string" || role.trim() === "")
            return NextResponse.json({ error: ValidationErrors.ROLE_REQUIRED }, { status: 400 });

        if (role.trim() !== Role.ADMIN && role.trim() !== Role.MANAGER && role.trim() !== Role.USER)
            return NextResponse.json({ error: ValidationErrors.INVALID_ROLE }, { status: 400 });

        const user = await prisma.users.findUnique({where: { email }});
        if (user)
            return NextResponse.json({ error: ValidationErrors.EMAIL_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.users.create({
            data: {
                email,
                password: await bcrypt.hash(`Dataplus@${new Date().getFullYear()}`, 10),
                role: role as Role,
                isActive: true,
                employeeInformation: {
                    create: {
                        firstName,
                        middleName: middleName || null,
                        lastName,
                        birthday: birthday ? new Date(birthday) : null,
                    },
                },
                companyInformation: {
                    create: {
                        positionId: positionId ? Number(positionId) : null,
                    },
                },
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.USER_CREATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}