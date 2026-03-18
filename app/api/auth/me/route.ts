import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { AuthErrors } from "@/config/messages";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const auth = req.headers.get("authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!token)
            return NextResponse.json({ error: AuthErrors.NOT_LOGGED_IN }, { status: 401 });

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

        const user = await prisma.users.findUnique({
            where: { id: Number(payload.id) },
            include: { position: true },
        });

        if (!user)
            return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 401 });

        if (!user.isActive)
            return NextResponse.json({ error: AuthErrors.USER_NOT_ACTIVE }, { status: 401 });

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    middle_name: user.middle_name,
                    last_name: user.last_name,
                    position: user.position?.title ?? null,
                    role: user.role,
                },
            },
            { status: 200 }
        );
    } catch {
        return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}