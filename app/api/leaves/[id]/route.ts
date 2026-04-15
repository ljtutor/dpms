import { NextResponse } from "next/server";

import { Period } from "@/app/generated/prisma/enums";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            type,
            accrualRateManager,
            accrualRateUser,
            accrualPeriod
        } = body;

        if (Number.isNaN(Number(id)))
            return NextResponse.json({ error: ValidationErrors.INVALID_LEAVE_ID }, { status: 400 });

        const leave = await prisma.leaves.findUnique({where: { id: Number(id) }});
        if (!leave)
            return NextResponse.json({ error: AuthErrors.LEAVE_NOT_FOUND }, { status: 401 });

        const leave_type = await prisma.leaves.findUnique({where: { type }});
        if (leave_type && leave_type.id !== Number(id))
            return NextResponse.json({ error: ValidationErrors.LEAVE_ALREADY_EXISTS }, { status: 400 });

        if (accrualRateManager && accrualRateManager < 0)
            return NextResponse.json({ error: ValidationErrors.INVALID_ACCRUAL_RATE }, { status: 400 });
        
        if (accrualRateUser && accrualRateUser < 0)
            return NextResponse.json({ error: ValidationErrors.INVALID_ACCRUAL_RATE }, { status: 400 });
        
        await prisma.leaves.update({
            where: { id: Number(id) },
            data: {
                type,
                accrualRateManager: accrualRateManager ? Number(accrualRateManager) : null,
                accrualRateUser: accrualRateUser ? Number(accrualRateUser) : null,
                accrualPeriod: accrualPeriod ? Period[accrualPeriod as keyof typeof Period] : null,
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.LEAVE_UPDATED,
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
            return NextResponse.json({ error: ValidationErrors.INVALID_LEAVE_ID }, { status: 400 });

        const leave = await prisma.leaves.findUnique({ where: { id: Number(id) } });
        if (!leave)
            return NextResponse.json({ error: AuthErrors.LEAVE_NOT_FOUND }, { status: 401 });

        /*const inUseCount = await prisma.companyInformation.count({
            where: { leaveId: Number(id) },
        });
        if (inUseCount > 0)
            return NextResponse.json({ error: ValidationErrors.POSITION_IN_USE }, { status: 400 });*/

        await prisma.leaves.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json(
            {
                message: SuccessMessages.LEAVE_REMOVED,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}