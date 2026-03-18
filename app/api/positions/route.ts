import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            title
        } = body;

        if (title.trim() === "")
            return NextResponse.json({ error: ValidationErrors.TITLE_REQUIRED }, { status: 400 });

        const position = await prisma.positions.findUnique({where: { title }});
        if (position)
            return NextResponse.json({ error: ValidationErrors.POSITION_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.positions.create({
            data: { title },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.POSITION_CREATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}