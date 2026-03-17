import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";

import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            first_name,
            middle_name,
            last_name,
            email,
            birthday,
            position_id
        } = body;

        if (first_name.trim() === "")
            return NextResponse.json({ error: ValidationErrors.FIRST_NAME_REQUIRED }, { status: 400 });

        if (last_name.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LAST_NAME_REQUIRED }, { status: 400 });
        
        if (email.trim() === "")
            return NextResponse.json({ error: ValidationErrors.EMAIL_REQUIRED }, { status: 400 });
      
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return NextResponse.json({ error: ValidationErrors.INVALID_EMAIL_FORMAT }, { status: 400 });

        if (birthday.trim() === "")
            return NextResponse.json({ error: ValidationErrors.BIRTHDAY_REQUIRED }, { status: 400 });

        const user = await prisma.users.findUnique({where: { email }});
        if (user)
            return NextResponse.json({ error: ValidationErrors.EMAIL_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.users.create({
            data: {
                first_name,
                middle_name: middle_name || null,
                last_name,
                email,
                password: await bcrypt.hash(`Dataplus@${new Date().getFullYear()}`, 10),
                birthday: birthday ? new Date(birthday) : null,
                position_id: position_id ? Number(position_id) : null
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