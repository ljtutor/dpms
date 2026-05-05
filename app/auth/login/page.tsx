import { Metadata } from "next";
import { Suspense } from "react";

import LoginClient from "@/components/auth/login/client";

export const metadata: Metadata = {
    title: "Login",
};

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginClient/>
        </Suspense>
    );
}