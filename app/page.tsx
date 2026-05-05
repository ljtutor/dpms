import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/auth/login");
  }

  try {
    jwt.verify(token, secret);
    redirect("/timekeeping");
  } catch {
    redirect("/auth/login");
  }
}
