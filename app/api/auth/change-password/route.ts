import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { AuthErrors, SuccessMessages, ValidationErrors } from "@/config/messages";
import { getUserIdFromRequest } from "@/lib/auth-request";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await getUserIdFromRequest(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (currentPassword.trim() === "") {
      return NextResponse.json({ error: ValidationErrors.PASSWORD_REQUIRED }, { status: 400 });
    }
    if (newPassword.trim() === "") {
      return NextResponse.json({ error: ValidationErrors.NEW_PASSWORD_REQUIRED }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: ValidationErrors.NEW_PASSWORD_MUST_DIFFER }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: AuthErrors.USER_NOT_FOUND }, { status: 404 });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: AuthErrors.INCORRECT_PASSWORD }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ message: SuccessMessages.PASSWORD_CHANGED }, { status: 200 });
  } catch (error) {
    console.error("[auth/change-password] Failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
  }
}
