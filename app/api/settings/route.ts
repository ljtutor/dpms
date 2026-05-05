import { NextResponse } from "next/server";
import path from "path";

import { AuthErrors, SuccessMessages } from "@/config/messages";
import { saveUploadedFile } from "@/lib/attachmentUpload";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "employee");
export const UPLOAD_URL_PREFIX = "/uploads/employee";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const authHeader = req.headers.get("authorization") ?? "";
        const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const cookieToken = (await cookies()).get("token")?.value;
        const token = cookieToken ?? headerToken;
        if (!token) {
            return NextResponse.json({ error: AuthErrors.NOT_LOGGED_IN }, { status: 401 });
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        const userId = payload.id;

        const eSignature = formData.get("eSignature") as File | null;
        let eSignaturePath: string | undefined;
        if (eSignature && eSignature.size > 0) {
            eSignaturePath = await saveUploadedFile(UPLOAD_DIR, UPLOAD_URL_PREFIX, eSignature);
        }

        const employeeInformation = await prisma.employeeInformation.update({
            where: { userId: Number(userId) },
            data: {
                eSignature: eSignaturePath ?? null,
            },
        });

        return NextResponse.json(
            {
                employeeInformation: {
                    id: employeeInformation.id,
                    eSignature: employeeInformation.eSignature,
                },
                message: SuccessMessages.EMPLOYEE_INFORMATION_UPDATED,
                success: true,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}