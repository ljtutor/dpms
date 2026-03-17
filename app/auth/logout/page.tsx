"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { SuccessMessages } from "@/config/messages";

export default function Logout() {
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });

            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            
            sessionStorage.removeItem("success");
            sessionStorage.removeItem("error");

            setLogoutModalOpen(false);

            sessionStorage.setItem("success", SuccessMessages.LOGOUT_SUCCESS);
            window.location.href = "/auth/login";
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <button type="button" onClick={() => setLogoutModalOpen(true)} className="block px-4 py-2 w-full text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">Sign out</button>
            {logoutModalOpen && (
                <>
                    <div className="fixed left-0 right-0 z-50 items-center justify-center overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full flex" role="dialog">
                        <div className="relative w-full h-full max-w-2xl px-4 md:h-auto">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start gap-4">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100">
                                            <LogOut className="w-6 h-6 text-primary-600"/>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200">Sign out account</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-start text-gray-500 dark:text-gray-400">Are you sure you want to sign out of your account? You will need to log in again to access your data.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex justify-end gap-4 sm:px-6">
                                    <button type="button" onClick={handleLogout} className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Sign Out</button>
                                    <button type="button" onClick={() => setLogoutModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 sm:mt-0 sm:w-auto">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"></div>
                </>
            )}
        </>
    );
}