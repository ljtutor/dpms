import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

import { AuthErrors, ValidationErrors, SuccessMessages } from "@/config/messages";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (email.trim() === "")
      return NextResponse.json({ error: ValidationErrors.EMAIL_REQUIRED }, { status: 400 });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: ValidationErrors.INVALID_EMAIL_FORMAT }, { status: 400 });

    const user = await prisma.users.findUnique({where: { email }});
    if (!user)
      return NextResponse.json({ error: AuthErrors.EMAIL_NOT_FOUND }, { status: 401 });

    if (!user.isActive)
      return NextResponse.json({ error: AuthErrors.USER_NOT_ACTIVE }, { status: 401 });

    if (password .trim() === "")
      return NextResponse.json({ error: ValidationErrors.PASSWORD_REQUIRED }, { status: 400 });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return NextResponse.json({ error: AuthErrors.INCORRECT_PASSWORD }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[auth/login] Missing JWT_SECRET");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      secret,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json(
      {
        message: SuccessMessages.LOGIN_SUCCESS,
        token,
      },
      { status: 200 }
    );
    
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      //secure: false,
      sameSite: "strict",
      //sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    });

    return response;
  } catch (error) {
    console.error("[auth/login] Login failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: AuthErrors.SERVER_ERROR }, { status: 500 });
  }
}