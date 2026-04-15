"use client";

import { ChevronLeft, ChevronRight, Home, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import FlashMessage from "@/components/ui/FlashMessage";

type LeaveRequestsClientProps = {
    leaveRequests: any[];
};

export default function LeaveRequestsClient({ leaveRequests }: LeaveRequestsClientProps) {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const formatDisplayDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDisplayDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const normalizedSearch = search.trim().toLowerCase();
    const filteredLeaveRequests = leaveRequests.filter((lr) => {
        if (!normalizedSearch) return true;
        const hay = [
            lr.leaveType.type ?? "",
            formatDisplayDate(lr.dateFiled) ?? "",
            formatDisplayDate(lr.dateFrom) ?? "",
            formatDisplayDate(lr.dateTo) ?? "",
            lr.noOfDays ?? "",
            lr.approvedBy.map((u: any) => u.employeeInformation.firstName + " " + u.employeeInformation.lastName).join(", ") ?? "",
            lr.receiver?.employeeInformation?.firstName + " " + lr.receiver?.employeeInformation?.lastName,
            lr.isApproved ? "Approved" : lr.dateApproved ? "Denied" : "Pending",
            lr.isAccepted ? "Accepted" : lr.dateAccepted ? "Declined" : "Pending",
        ].join(" ").toLowerCase();
        return hay.includes(normalizedSearch);
    });

    const total = filteredLeaveRequests.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, total);
    const paginatedLeaveRequests = filteredLeaveRequests.slice(startIndex, endIndex);

    return (
        <>
            <div className="p-4 bg-white block sm:flex items-center justify-between border-b border-gray-200 lg:mt-1.5 dark:bg-gray-800 dark:border-gray-700">
                <div className="w-full mb-1">
                    <div className="mb-4">
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
                                        <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Leave</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Leave Requests</h1>
                    </div>
                    <div className="sm:flex">
                        <div className="items-center hidden mb-3 sm:flex sm:divide-x sm:divide-gray-100 sm:mb-0 dark:divide-gray-700">
                            <form method="GET" className="lg:pr-3">
                                <label htmlFor="search" className="sr-only">Search</label>
                                <div className="relative mt-1 lg:w-64 xl:w-96">
                                    <input type="text" id="search" name="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Search" autoComplete="off"/>
                                </div>
                            </form>
                        </div>
                        <div className="flex items-center ml-auto space-x-2 sm:space-x-3">
                            <Link href="/requests/leave/create" className="inline-flex items-center justify-center w-1/2 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 sm:w-auto dark:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500 dark:focus:ring-primary-800">
                                <PlusCircle className="w-5 h-5 mr-2 -ml-1"/> Submit request
                            </Link>
                        </div>
                    </div>
                    {success && <FlashMessage type="success" message={success}/>}
                </div>
            </div>
            <div className="flex flex-col">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-600">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Leave Type</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Date Filed</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">From</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">To</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">No. of Days</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Approver</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Approval Status</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Receiver</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Acceptance Status</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {paginatedLeaveRequests.map((lr) => (
                                        <tr key={lr.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{lr.leaveType.type}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{formatDisplayDate(lr.dateFiled)}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{formatDisplayDate(lr.dateFrom)}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{formatDisplayDate(lr.dateTo)}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{lr.noOfDays}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{lr.approvedBy.map((u: any) => u.employeeInformation.firstName + " " + u.employeeInformation.lastName).join(", ")}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                                                {lr.isApproved ?
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-green-400 mr-1"></div> Approved
                                                    </div>
                                                : !lr.isApproved && lr.dateApproved ?
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div> Denied
                                                    </div>
                                                :
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-orange-300 mr-1"></div> Pending
                                                    </div>
                                                }
                                            </td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{lr.receiver.employeeInformation.firstName + " " + lr.receiver.employeeInformation.lastName}</td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                                                {lr.isAccepted ?
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-green-400 mr-1"></div> Accepted
                                                    </div>
                                                : !lr.isAccepted && lr.dateAccepted ?
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div> Declined
                                                    </div>
                                                :
                                                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                                        <div className="h-2 w-2 rounded-full bg-orange-300 mr-1"></div> Pending
                                                    </div>
                                                }
                                            </td>
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">
                                                <Link href={`/requests/leave/${lr.id}`} className="inline-flex items-center px-3 py-2 text-xs font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className="sticky bottom-0 right-0 items-center w-full p-4 bg-white border-t border-gray-200 sm:flex sm:justify-between dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center mb-4 sm:mb-0">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex justify-center p-1 text-gray-500 rounded hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" style={{ opacity: page <= 1 ? 0.5 : 1 }} disabled={page <= 1}>
                        <ChevronLeft className="w-7 h-7"/>
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex justify-center p-1 mr-2 text-gray-500 rounded hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" style={{ opacity: page >= totalPages ? 0.5 : 1 }} disabled={page >= totalPages}>
                        <ChevronRight className="w-7 h-7"/>
                    </button>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> of <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" style={{ opacity: page <= 1 ? 0.5 : 1 }} disabled={page <= 1}>
                        <ChevronLeft className="w-5 h-5 mr-1 -ml-1"/> Previous
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" style={{ opacity: page >= totalPages ? 0.5 : 1 }} disabled={page >= totalPages}>
                        Next <ChevronRight className="w-5 h-5 ml-1 -mr-1"/>
                    </button>
                </div>
            </div>
        </>
    );
}