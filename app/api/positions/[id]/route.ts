import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            title
        } = body;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_POSITION_ID }, { status: 400 });

        const position = await prisma.positions.findUnique({where: { id: Number(id) }});
        if (!position)
            return NextResponse.json({ error: AuthErrors.POSITION_NOT_FOUND }, { status: 401 });

        const position_title = await prisma.positions.findUnique({where: { title }});
        if (position_title)
            return NextResponse.json({ error: ValidationErrors.POSITION_ALREADY_EXISTS }, { status: 400 });
        
        await prisma.positions.update({
            where: { id: Number(id) },
            data: {
                title,
                updated_at: new Date()
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.POSITION_UPDATED,
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
            return NextResponse.json({ error: ValidationErrors.INVALID_POSITION_ID }, { status: 400 });

        const position = await prisma.positions.findUnique({ where: { id: Number(id) } });
        if (!position)
            return NextResponse.json({ error: AuthErrors.POSITION_NOT_FOUND }, { status: 401 });

        await prisma.positions.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            {
                message: SuccessMessages.POSITION_REMOVED,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}