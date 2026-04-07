import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUserIdFromRequest(
  req: NextRequest,
): Promise<{ ok: true; userId: number } | { ok: false; response: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = (await cookies()).get("token")?.value;
  const token = cookieToken ?? headerToken;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Server configuration error" }, { status: 500 }),
    };
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: number };
    return { ok: true, userId: decoded.id };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}

