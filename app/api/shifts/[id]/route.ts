import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";

const prisma = new PrismaClient();

function parseTimeStringToDate(timeStr: string): Date | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(timeStr);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = match[3] ? Number(match[3]) : 0;
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            title,
            start_time,
            end_time
        } = body;

        if (title.trim() === "")
            return NextResponse.json({ error: ValidationErrors.TITLE_REQUIRED }, { status: 400 });

        if (start_time.trim() === "")
            return NextResponse.json({ error: ValidationErrors.START_TIME_REQUIRED }, { status: 400 });

        if (end_time.trim() === "")
            return NextResponse.json({ error: ValidationErrors.END_TIME_REQUIRED }, { status: 400 });

        const startDate = parseTimeStringToDate(start_time.trim());
        if (!startDate)
            return NextResponse.json({ error: ValidationErrors.INVALID_TIME_FORMAT }, { status: 400 });

        const endDate = parseTimeStringToDate(end_time.trim());
        if (!endDate)
            return NextResponse.json({ error: ValidationErrors.INVALID_TIME_FORMAT }, { status: 400 });
        
        await prisma.shifts.update({
            where: { id: Number(id) },
            data: {
                title,
                start_time: startDate,
                end_time: endDate,
                updated_at: new Date()
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.SHIFT_UPDATED,
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
            return NextResponse.json({ error: ValidationErrors.INVALID_SHIFT_ID }, { status: 400 });

        const shift = await prisma.shifts.findUnique({ where: { id: Number(id) } });
        if (!shift)
            return NextResponse.json({ error: AuthErrors.SHIFT_NOT_FOUND }, { status: 401 });

        await prisma.shifts.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            {
                message: SuccessMessages.SHIFT_REMOVED,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}