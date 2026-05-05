import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import jwt from "jsonwebtoken";

function isLoggedIn(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret);
    return payload !== null && typeof payload === "object" && "id" in payload;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and public files (served from /public or similar)
  if (
    pathname.startsWith("/css/") ||
    pathname.startsWith("/img/") ||
    /\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const loggedIn = isLoggedIn(token);

  const isPublicAuthPage =
    pathname === "/auth/login" || pathname === "/auth/forgot-password";

  if (isPublicAuthPage) {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/timekeeping", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/timekeeping", req.url));
    }
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (!loggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};
