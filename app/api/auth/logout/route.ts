import { NextResponse } from "next/server";
import { AuthErrors, SuccessMessages } from "@/config/messages";

export async function POST() {
    try {
        return NextResponse.json(
            {
                message: SuccessMessages.LOGOUT_SUCCESS,
                success: true
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: AuthErrors.SERVER_ERROR }, { status: 500 });
    }
}