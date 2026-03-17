"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthErrors } from "@/config/messages";

export default function Authorized({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            sessionStorage.setItem("error", AuthErrors.NOT_LOGGED_IN);
            router.push("/auth/login");
        }
        else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; 
    }

    return <>{children}</>;
}