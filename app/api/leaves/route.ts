import { NextResponse } from "next/server";

import { Period } from "@/app/generated/prisma/enums";
import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            type,
            accrualRateManager,
            accrualRateUser,
            accrualPeriod
        } = body;

        if (type.trim() === "")
            return NextResponse.json({ error: ValidationErrors.LEAVE_TYPE_REQUIRED }, { status: 400 });

        const leave = await prisma.leaves.findUnique({where: { type }});
        if (leave)
            return NextResponse.json({ error: ValidationErrors.LEAVE_ALREADY_EXISTS }, { status: 400 });
        
        if (accrualRateManager && accrualRateManager < 0)
            return NextResponse.json({ error: ValidationErrors.INVALID_ACCRUAL_RATE }, { status: 400 });
        
        if (accrualRateUser && accrualRateUser < 0)
            return NextResponse.json({ error: ValidationErrors.INVALID_ACCRUAL_RATE }, { status: 400 });
        
        await prisma.leaves.create({
            data: {
                type,
                accrualRateManager: accrualRateManager ? Number(accrualRateManager) : null,
                accrualRateUser: accrualRateUser ? Number(accrualRateUser) : null,
                accrualPeriod: accrualPeriod ? Period[accrualPeriod as keyof typeof Period] : null,
            },
        });
        return NextResponse.json(
            {
                message: SuccessMessages.LEAVE_CREATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}