import { NextResponse } from "next/server";
import { AuthErrors, SuccessMessages } from "@/config/messages";

export async function POST() {
    try {
        const response = NextResponse.json(
            {
                message: SuccessMessages.LOGOUT_SUCCESS,
                success: true
            },
            { status: 200 }
        );

        response.cookies.set("token", "", {
            httpOnly: true,
            path: "/",
            expires: new Date(0)
        });

        return response;
    } catch (error) {
        return NextResponse.json({ message: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}