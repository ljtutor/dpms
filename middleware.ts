import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AuthErrors } from "@/config/messages";

import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const authPath = "/auth/login";
    const token = req.cookies.get("token")?.value;
    const isAuthPage =
        pathname === "/auth/login" ||
        pathname === "/auth/forgot-password";

    // Auth page not logged in.
    if (isAuthPage && !token) {
        return NextResponse.next();
    }

    // Auth page already logged in.
    if (isAuthPage && token) {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error(AuthErrors.SERVER_ERROR);

            const payload = jwt.verify(token, secret);
            if (payload && typeof payload === "object" && "id" in payload) {
                return NextResponse.redirect(new URL("/", req.url));
            }
        } catch {
            return NextResponse.next();
        }

        return NextResponse.next();
    }
    
    if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error(AuthErrors.SERVER_ERROR);

        const payload = jwt.verify(token, secret);
        if (!payload || typeof payload !== "object" || !("id" in payload)) {
            throw new Error(AuthErrors.INVALID_TOKEN);
        }

        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }
}

export const config = {
    matcher: [
        // Auth pages
        "/auth/login",
        "/auth/forgot-password",

        // Protected pages
        "/positions/:path*",
        "/shifts/:path*",
        "/users/:path*",
        "/requests/leave/:path*",
        "/employee-calendar/:path*",
        "/timekeeping",
        "/weekly-activity",
        "/auth/change-password",
    ],
    runtime: "nodejs",
};