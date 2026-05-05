"use client";

import { ChevronRight, Home, Lock} from "lucide-react";
import Link from "next/link";

import { getEarnedLeaves, getRemainingLeaves, getUsedLeaves } from "@/lib/leaveBalances";
import { FormEvent,useState } from "react";

import FlashMessage from "@/components/ui/FlashMessage";

type SettingsClientProps = {
    user: any;
    leaves: any[];
    leaveRequests: any[];
};

export default function SettingsClient({
    user,
    leaves,
    leaveRequests
}: SettingsClientProps) {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const attachmentFileLabel = (url: string) =>
        url.split("/").filter(Boolean).pop() ?? url;

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccess("");
        setError("");

        const form = e.currentTarget;
        const formData = new FormData(form);

        if (user?.id)
            formData.append("userId", String(user.id));
        formData.append("dateFiled", new Date().toISOString());

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
            }
            else {
                setError(data.error);
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 px-4 xl:grid-cols-3 xl:gap-4 dark:bg-gray-900" style={{paddingTop: "22px"}}>
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
                                    <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Settings</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Settings</h1>
                </div>
                <div className="col-span-2">
                    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-xl font-semibold dark:text-white">User Information</h3>
                        <div className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.email}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.role}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Status</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.isActive ? "Active" : "Inactive"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-xl font-semibold dark:text-white">Employee Information</h3>
                        {error && <div className="mb-4"><FlashMessage type="error" message={error}/></div>}
                        {success && <div className="mb-4"><FlashMessage type="success" message={success}/></div>}
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.employeeInformation?.firstName}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Middle Name</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.employeeInformation?.middleName}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.employeeInformation?.lastName}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Birthday</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{formatDate(user.employeeInformation?.birthday)}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <label htmlFor="eSignature" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Signature</label>
                                <input type="file" id="eSignature" name="eSignature" className="cursor-pointer bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full shadow-xs placeholder:text-body" accept="image/png, image/jpeg, image/jpg"/>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">png, jpg or jpeg files only.</p>
                                {user.employeeInformation?.eSignature && (
                                    <a href={user.employeeInformation?.eSignature} className="text-primary-600 sm:text-sm block w-full py-2.5 hover:underline" target="_blank" rel="noopener noreferrer">
                                        {attachmentFileLabel(user.employeeInformation?.eSignature)}
                                    </a>
                                )}
                            </div>
                            <div className="col-span-6 sm:col-full">
                                <button type="submit" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Save</button>
                            </div>
                        </form>
                    </div>
                    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-xl font-semibold dark:text-white">Company Information</h3>
                        <div className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">{user.companyInformation?.position?.title}</span>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</span>
                                <span className="shadow-sm bg-gray-100 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">N/A</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-full xl:col-auto">
                    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                        <div className="flow-root">
                            <h3 className="text-xl font-semibold dark:text-white">Leave Credits</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {leaves.map((leave) => (
                                    <li key={leave.id} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-base font-semibold text-gray-900 truncate dark:text-white">{leave.type}</span>
                                                <span className="block text-sm font-normal text-gray-500 truncate dark:text-gray-400">Earned: {getEarnedLeaves(user, leave)}, Used: {getUsedLeaves(user, leave, leaveRequests)}</span>
                                            </div>
                                            <div className="inline-flex items-center">
                                                <span className="text-sm font-medium text-center text-gray-900 dark:text-gray-400">Remaining: {getRemainingLeaves(user, leave, leaveRequests)}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                        <div className="flow-root">
                            <h3 className="text-xl font-semibold dark:text-white">Password Information</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                <li className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <Lock className="w-5 h-5 dark:text-white"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-base font-semibold text-gray-900 truncate dark:text-white">Change Password</span>
                                            <span className="block text-sm font-normal text-gray-500 truncate dark:text-gray-400">Change your account password.</span>
                                        </div>
                                        <div className="inline-flex items-center">
                                            <Link href="/auth/change-password" className="px-3 py-2 mb-3 mr-3 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Change</Link>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}