"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuthUser } from "@/components/layout/LayoutClient";
import FlashMessage from "@/components/ui/FlashMessage";
import {
    getAvailableLeaves,
    getEarnedLeaves,
    getRemainingLeaves,
    getUsedLeaves
} from "@/lib/leaveBalances";

type RequestLeaveClientProps = {
    users: any[];
    leaves: any[];
    leaveRequests: any[];
};

export default function RequestLeaveClient({ users, leaves, leaveRequests }: RequestLeaveClientProps) {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const user = useAuthUser();
    const router = useRouter();

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

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
            const res = await fetch("/api/requests/leave", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/requests/leave/${data.leaveRequest.id}`);
            }
            else {
                setError(data.error);
            }

            router.refresh();
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <>
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
                                    <Link href="/requests" className="ml-1 text-gray-700 hover:text-primary-600 md:ml-2 dark:text-gray-300 dark:hover:text-white">Requests</Link>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <ChevronRight className="w-6 h-6 text-gray-400"/>
                                    <Link href="/requests/leave" className="ml-1 text-gray-700 hover:text-primary-600 md:ml-2 dark:text-gray-300 dark:hover:text-white">Leave</Link>
                                </div>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <ChevronRight className="w-6 h-6 text-gray-400"/>
                                    <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Create</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Leave Application Form</h1>
                    {success && <FlashMessage type="success" message={success}/>}
                    {error && <FlashMessage type="error" message={error}/>}
                </div>
                <div className="p-4 col-span-full bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-bold">INSTRUCTIONS:</span> This form must be accomplished and submitted before an employee goes on leave. In case of sudden illness or emergency, this form must be accomplished and submitted upon reporting back to work.
                        </span>
                    </div>
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4">
                        <div className="col-span-2 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee Name</label>
                            <input id="name" defaultValue={`${user?.firstName} ${user?.lastName}`} className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="date_filed" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date filed</label>
                            <input type="text" id="date_filed" value={todayFormatted} className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                        </div>
                        <div className="col-span-2 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="position" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position</label>
                            <input id="position" defaultValue={user?.position ?? ""} className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="department" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</label>
                            <input type="text" id="department" className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" disabled/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Type of leave applied for <span className="text-red-500">*</span></label>
                            <select id="type" name="type" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required>
                                <option value="">none</option>
                                {leaves.map((leave) => (
                                    <option key={leave.id} value={leave.id}>
                                        {leave.type.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <div>
                                <label htmlFor="dateFrom" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"><span className="font-bold">Inclusive dates</span> From <span className="text-red-500">*</span></label>
                                <input type="date" id="dateFrom" name="dateFrom" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required/>
                            </div>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <div>
                                <label htmlFor="dateTo" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">To <span className="text-red-500">*</span></label>
                                <input type="date" id="dateTo" name="dateTo" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required/>
                            </div>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="noOfDays" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">No. of days</label>
                            <input type="number" id="noOfDays" name="noOfDays" className="shadow-sm bg-gray-500 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="reason" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Reason</label>
                            <textarea id="reason" name="reason" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Reason"/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="attachment" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Attachment</label>
                            <input type="file" id="attachment" name="attachment" className="cursor-pointer bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full shadow-xs placeholder:text-body" accept="image/png, image/jpeg, image/jpg, application/pdf, application/doc, application/docx"/>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">png, jpg or jpeg, pdf, doc or docx files only.</p>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="signature" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employeee signature</label>
                            {user?.employeeInformation?.eSignature ? (
                                <Image
                                    src={user.employeeInformation.eSignature}
                                    alt="eSignature"
                                    height={200}
                                    width={200}
                                    unoptimized
                                />
                            ) : (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Please upload your eSignature in your profile settings to be able to sign this leave request.</p>
                            )}
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="approvedBy" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Approved by <span className="text-red-500">*</span></label>
                            <select id="approvedBy" name="approvedBy[]" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" multiple required>
                                {users.filter((listedUser: any) => listedUser.id !== user?.id).map((listedUser) => (
                                    <option key={listedUser.id} value={listedUser.id}>
                                        {listedUser.employeeInformation?.firstName} {listedUser.employeeInformation?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="receivedBy" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Received by <span className="text-red-500">*</span></label>
                            <select id="receivedBy" name="receivedBy" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required>
                                {users.filter((listedUser) => listedUser.id !== user?.id).map((listedUser) => (
                                    <option key={listedUser.id} value={listedUser.id}>
                                        {listedUser.employeeInformation?.firstName} {listedUser.employeeInformation?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-full mt-4 mb-4 xl:mb-0">
                            <i className="text-sm text-gray-500 dark:text-gray-300">For Accounting use only</i>
                            <table className="mt-2 min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-600">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Type</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Earned</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Available</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Used</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Remaining</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {user && leaves.map((leave) => {
                                        const earned = getEarnedLeaves(user, leave);
                                        const available = getAvailableLeaves(user, leave, leaveRequests);
                                        const used = getUsedLeaves(user, leave, leaveRequests);
                                        const remaining = getRemainingLeaves(user, leave, leaveRequests);

                                        return (
                                            <tr key={leave.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{leave.type.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}</td>
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{Number(earned).toFixed(2)}</td>
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{Number(available).toFixed(2)}</td>
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{Number(used).toFixed(2)}</td>
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{Number(remaining).toFixed(2)}</td>
                                                <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">-</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="col-span-full mt-4 flex">
                            <button type="submit" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                                Submit application
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}