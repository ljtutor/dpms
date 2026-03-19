"use client";

import FlashMessage from "@/components/ui/FlashMessage";
import { Eye, EyeOff } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const searchParams = useSearchParams();

    useEffect(() => {
        const success = sessionStorage.getItem("success");
        const error = sessionStorage.getItem("error");
        if (success) {
            setSuccess(success);
            sessionStorage.removeItem("success");
        }
        if (error) {
            setError(error);
        }

        const queryError = searchParams.get("error");
        if (queryError) {
            setError(queryError);
            // Remove the query param so it doesn't persist on refresh.
            window.history.replaceState({}, "", window.location.pathname);
        }

        const storedEmail = localStorage.getItem("email");
        if (storedEmail) {
            setEmail(storedEmail);
            setRemember(true);
        }
    }, [searchParams]);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setSuccess("");
        setError("");

        const response = await fetch("/api/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {

            if (remember) {
                localStorage.setItem("token", data.token);
                sessionStorage.removeItem("token");
            }
            else {
                sessionStorage.setItem("token", data.token);
                localStorage.removeItem("token");
            }

            if (remember) {
                localStorage.setItem("email", email);
            }
            else {
                localStorage.removeItem("email");
            }
            
            sessionStorage.removeItem("success");
            sessionStorage.removeItem("error");

            setSuccess(data.message);
            window.location.href = "/";
        }
        else {
            setError(data.error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen pt:mt-0 dark:bg-gray-900">
            <Link href="/" className="flex items-center justify-center mb-4 text-2xl font-semibold dark:text-white">
                <Image src="/img/logo.png" alt="Data Plus Logo" className="w-auto" width={135} height={50} loading="eager"/>
            </Link>
            <div className="w-full max-w-xl p-6 space-y-8 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to platform</h2>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    {success && <FlashMessage type="success" message={success}/>}
                    {error && <FlashMessage type="error" message={error}/>}
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                        <input type="email" id="email" name="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="name@dataplus.com.ph" required/>
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                        <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="******" autoComplete="off" required/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute text-gray-400 hover:text-gray-500" style={{top: "41px", right: "15px"}}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input type="checkbox" id="remember" name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="remember" className="font-medium text-gray-900 dark:text-white">Remember me</label>
                        </div>
                        <Link href="/auth/forgot-password" className="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500">Forgot Password</Link>
                    </div>
                    <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Login to your account</button>
                </form>
            </div>
        </div>
    );
}