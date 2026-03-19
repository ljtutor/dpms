"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import { LeaveType } from "@/app/generated/prisma/enums";
import { AuthErrors } from "@/config/messages";
import FlashMessage from "@/components/ui/FlashMessage";

import { ChevronRight, Home} from "lucide-react";

export default function LeaveRequest() {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState<any | null>(null);

    function formatLongDate(value?: string | null) {
        const d = value ? new Date(value) : new Date();
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    useEffect(() => {
        const error = sessionStorage.getItem("error");
        if (error) setError(error);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        fetch("/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setCurrentUser(data.user ?? null);
        })
        .catch(() => setError(AuthErrors.UNABLE_TO_LOAD_USER));
    }, []);

    return (
        <div className="grid grid-cols-1 p-4 mt-1.5 xl:grid-cols-3 xl:gap-4 dark:bg-gray-900">
            <div className="mb-4 col-span-full xl:mb-2">
                <nav className="flex mb-5">
                    <ol className="inline-flex items-center space-x-1 text-sm font-medium md:space-x-2">
                        <li className="inline-flex items-center">
                            <Link href="/" className="inline-flex items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">
                                <Home className="w-5 h-5 mr-2.5"/> Data Plus Management System
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <ChevronRight className="w-6 h-6 text-gray-400"/>
                                <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Requests</span>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <ChevronRight className="w-6 h-6 text-gray-400"/>
                                <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Leave</span>
                            </div>
                        </li>
                    </ol>
                </nav>
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Leave Application</h1>
                {success && <FlashMessage type="success" message={success}/>}
                {error && <FlashMessage type="error" message={error}/>}
            </div>
            <div className="col-span-full xl:col-auto">
                <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                    <h3 className="mb-4 text-xl font-semibold dark:text-white">Employee Information</h3>
                    <div className="mb-4">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                        <input type="text" id="name" value={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ""} className="bg-gray-100 border-gray-300 text-gray-600 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="position" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position</label>
                        <input type="text" id="position" value={currentUser ? currentUser.position : ""} className="bg-gray-100 border-gray-300 text-gray-600 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="date_filed" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date Filed</label>
                        <input type="text" id="date_filed" value={formatLongDate(currentUser?.date_filed)} className="bg-gray-100 border-gray-300 text-gray-600 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                    </div>
                </div>
            </div>
            <div className="col-span-2">
                <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                    <h3 className="mb-4 text-xl font-semibold dark:text-white">Leave Information</h3>
                    <form>
                        <div className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="leave_type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Leave Type</label>
                                <select id="leave_type" name="leave_type" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required>
                                    {Object.values(LeaveType).map((val) => (
                                        <option key={val} value={val}>
                                            {val.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-6 mt-6">
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="date_from" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">From</label>
                                <input type="date" id="date_from" name="date_from" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required/>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="date_to" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">To</label>
                                <input type="date" id="date_to" name="date_to" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required/>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-6 mt-6">
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="days" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">No. of Days</label>
                                <input type="number" id="days" name="days" className="shadow-sm bg-gray-100 border-gray-300 text-gray-600 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:placeholder-gray-400" disabled/>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-6 mt-6">
                            <div className="col-span-6 sm:col-span-6">
                                <label htmlFor="reason" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Reason</label>
                                <textarea id="reason" name="reason" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required></textarea>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}