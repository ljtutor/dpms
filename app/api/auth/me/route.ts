import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthErrors } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization") ?? "";
        const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const cookieToken = (await cookies()).get("token")?.value;

        const token = cookieToken ?? headerToken;
        if (!token) {
            return NextResponse.json({ error: AuthErrors.NOT_LOGGED_IN }, { status: 401 });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

        const user = await prisma.users.findUnique({
            where: { id: Number(payload.id) },
            include: {
                employeeInformation: true,
                companyInformation: { include: { position: true } },
            },
        });

        if (!user)
            return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 401 });

        if (!user.isActive)
            return NextResponse.json({ error: AuthErrors.USER_NOT_ACTIVE }, { status: 401 });

        const employeeInformation = user.employeeInformation;

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    firstName: employeeInformation?.firstName ?? null,
                    middleName: employeeInformation?.middleName ?? null,
                    lastName: employeeInformation?.lastName ?? null,
                    position: user.companyInformation?.position?.title ?? null,
                    role: user.role,
                    scheduleStartMinutes: user.scheduleStartMinutes,
                    canEditEmployeeSchedules: canEditEmployeeSchedules(user.position?.title),
                    canApproveTimeLogEdits: canApproveTimeLogEdits(user.position?.title),
                },
            },
            { status: 200 }
        );
    } catch {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}