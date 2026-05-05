"use client";

import { CheckCircle, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthUser } from "@/components/layout/LayoutClient";
import FlashMessage from "@/components/ui/FlashMessage";

type LeaveRequestProps = {
    request: {
        id: number;
        user: {
            id: number;
            employeeInformation: {
                firstName: string;
                lastName: string
            };
            companyInformation: {
                position: {
                    title: string
                }
            };
        };
        dateFiled: string;
        leaveType: {
            type: string
        };
        dateFrom: string;
        dateTo: string;
        noOfDays: number;
        reason: string;
        signatureDataUrl: string | null;
        approvedBy: {
            id: number;
            employeeInformation: {
                firstName: string;
                lastName: string
            }
        }[];
        receiver: {
            id: number;
            employeeInformation: {
                firstName: string;
                lastName: string
            }
        };
        isApproved: boolean;
        dateApproved: string | null;
        isAccepted: boolean;
        dateAccepted: string | null;
    };
};

export default function RequestLeaveDetailClient({ request }: LeaveRequestProps) {
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const user = useAuthUser();
    const router = useRouter();
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [acceptModalOpen, setAcceptModalOpen] = useState(false);

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

    const handleApproval = async (isApproved: boolean) => {
        setSuccess("");
        setError("");

        try {
            const res = await fetch(`/api/requests/leave/${request.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isApproved,
                    userId: user?.id,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setApprovalModalOpen(false);
            }
            else {
                setError(data.error);
            }

            router.refresh();
        }
        catch (error: any) {
            setError(error.message);
        }
    };

    const handleAcceptance = async (isAccepted: boolean) => {
        setSuccess("");
        setError("");

        try {
            const res = await fetch(`/api/requests/leave/${request.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isAccepted,
                    userId: user?.id,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setAcceptModalOpen(false);
            }
            else {
                setError(data.error);
            }

            router.refresh();
        }
        catch (error: any) {
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
                                <Link href="/timekeeping" className="inline-flex items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">
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
                                    <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">{request.id}</span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Leave Application Form</h1>
                    {success && <FlashMessage type="success" message={success}/>}
                    {error && <FlashMessage type="error" message={error}/>}
                </div>
                <div className="p-4 col-span-full bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="xl:col-span-full flex items-center justify-end gap-3">
                        {request.approvedBy.some((approvedBy) => approvedBy.id === user?.id) && !request.isAccepted ? (
                            <button type="button" onClick={() => setApprovalModalOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-500 dark:hover:bg-gray-600">
                                Approval
                            </button>
                        )
                        : request.approvedBy.some((approvedBy) => approvedBy.id === user?.id) && request.isAccepted && (
                            <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 dark:bg-gray-900 dark:border-gray-500">
                                Approval
                            </span>
                        )}
                        {request.receiver.id === user?.id && (
                            <button type="button" onClick={() => setAcceptModalOpen(true)} className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-500 dark:hover:bg-gray-600">
                                Accept
                            </button>
                        )}
                    </div>
                    <div className="mt-2 mb-4" style={{ fontStyle: "italic" }}>
                            {request.isAccepted && request.dateAccepted ? (
                                <>
                                    <span className="text-sm text-gray-600 bg-green-100 rounded-lg p-2.5 block">
                                        The approved leave request has been formally acknowledged by <span className="font-bold text-gray-600 dark:text-gray-600">{request.receiver?.employeeInformation?.firstName + " " + request.receiver?.employeeInformation?.lastName}</span> on <span className="font-bold">{formatDisplayDateTime(request.dateAccepted)}</span>. No further action is required.
                                    </span>
                                </>
                            ) : !request.isAccepted && request.dateAccepted ? (
                                <>
                                    <span className="text-sm text-gray-600 bg-red-100 rounded-lg p-2.5 block">
                                        The leave request has been reviewed and cannot be accommodated. Coordination with the concerned party may be done for further details or alternative arrangements.
                                    </span>
                                </>
                            ) : request.isApproved && request.dateApproved ? (
                                <>
                                    <span className="text-sm text-gray-600 bg-primary-100 rounded-lg p-2.5 block">
                                        This request has been reviewed and <span className="font-bold text-gray-600 dark:text-gray-600">Approved</span> by <span className="font-bold text-gray-600 dark:text-gray-600">{request.approvedBy.map((approvedBy) => approvedBy.employeeInformation.firstName + " " + approvedBy.employeeInformation.lastName).join(", ")}</span> on <span className="font-bold">{formatDisplayDateTime(request.dateApproved)}</span>. The approved schedule should be followed accordingly.
                                    </span>
                                </>
                            ) : !request.isApproved && request.dateApproved ? (
                                <>
                                    <span className="text-sm text-gray-600 bg-red-100 rounded-lg p-2.5 block">
                                        This request has been reviewed and <span className="font-bold text-gray-600 dark:text-gray-600">Denied</span> by <span className="font-bold text-gray-600 dark:text-gray-600">{request.approvedBy.map((approvedBy) => approvedBy.employeeInformation.firstName + " " + approvedBy.employeeInformation.lastName).join(", ")}</span>. Further clarification may be obtained from the concerned supervisor.
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-600 bg-orange-100 rounded-lg p-2.5 block">
                                        The leave request is currently under review. A decision will be provided once the evaluation is complete.
                                    </span>
                                </>
                            )}
                    </div>
                    <div className="mt-2 mb-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-bold">INSTRUCTIONS:</span> This form must be accomplished and submitted before an employee goes on leave. In case of sudden illness or emergency, this form must be accomplished and submitted upon reporting back to work.
                        </span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 xl:gap-4 mb-4">
                        <div className="col-span-2 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee Name</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {`${request.user?.employeeInformation?.firstName} ${request.user?.employeeInformation?.lastName}`}
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date filed</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {formatDisplayDate(request.dateFiled)}
                            </span>
                        </div>
                        <div className="col-span-2 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.user?.companyInformation?.position?.title ?? ""}
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                N/A
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Type of leave applied for</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.leaveType?.type ?? ""}
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <div>
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"><span className="font-bold">Inclusive dates</span> From</span>
                                <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                    {formatDisplayDate(request.dateFrom)}
                                </span>
                            </div>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <div>
                                <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">To</span>
                                <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                    {formatDisplayDate(request.dateTo)}
                                </span>
                            </div>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="days" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">No. of days</label>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.noOfDays}
                            </span>
                        </div>
                        <div className="col-span-2 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="reason" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Reason</label>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.reason !== "" || request.reason ? request.reason : "none"}
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <label htmlFor="signature" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employeee signature</label>
                            <input type="file" id="signature" name="signature" className="cursor-pointer bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full shadow-xs placeholder:text-body" accept="image/png, image/jpeg, image/jpg"/>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Approver/s</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.approvedBy.map((approvedBy) => approvedBy.employeeInformation.firstName + " " + approvedBy.employeeInformation.lastName).join(", ")}
                            </span>
                        </div>
                        <div className="col-span-1 xl:col-span-full mb-4 xl:mb-0">
                            <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Receiver</span>
                            <span className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                {request.receiver?.employeeInformation?.firstName + " " + request.receiver?.employeeInformation?.lastName}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {approvalModalOpen && (
                <>
                    <div className="fixed left-0 right-0 z-50 items-center justify-center overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full flex" role="dialog">
                        <div className="relative w-full h-full max-w-2xl px-4 md:h-auto">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start gap-4">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                            <CheckCircle className="w-6 h-6 text-gray-400 dark:text-gray-300"/>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200">Approval</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-start text-gray-500 dark:text-gray-400">Review the leave request and click Approve or Deny.</p>
                                            </div>
                                        </div>
                                    </div>
                                    {error && <div className="mt-4"><FlashMessage type="error" message={error}/></div>}
                                </div>
                                <div className="px-4 py-3 flex justify-end gap-4 sm:px-6">
                                    {request.isApproved && request.dateApproved ? (
                                        <button type="button" onClick={() => handleApproval(false)} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Deny</button>
                                    ) : !request.isApproved && request.dateApproved ? (
                                        <button type="button" onClick={() => handleApproval(true)} className="inline-flex w-full justify-center rounded-md bg-green-400 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Approve</button>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => handleApproval(true)} className="inline-flex w-full justify-center rounded-md bg-green-400 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Approve</button>
                                            <button type="button" onClick={() => handleApproval(false)} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Deny</button>
                                        </>
                                    )}
                                    <button type="button" onClick={() => setApprovalModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 sm:mt-0 sm:w-auto">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"></div>
                </>
            )}
            {acceptModalOpen && (
                <>
                    <div className="fixed left-0 right-0 z-50 items-center justify-center overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full flex" role="dialog">
                        <div className="relative w-full h-full max-w-2xl px-4 md:h-auto">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start gap-4">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                            <CheckCircle className="w-6 h-6 text-gray-400 dark:text-gray-300"/>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200">Acceptance</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-start text-gray-500 dark:text-gray-400">Review the leave request and click Accept or Decline.</p>
                                            </div>
                                        </div>
                                    </div>
                                    {error && <div className="mt-4"><FlashMessage type="error" message={error}/></div>}
                                </div>
                                <div className="px-4 py-3 flex justify-end gap-4 sm:px-6">
                                    {request.isAccepted && request.dateAccepted ? (
                                        <button type="button" onClick={() => handleAcceptance(false)} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Decline</button>
                                    ) : !request.isAccepted && request.dateAccepted ? (
                                        <button type="button" onClick={() => handleAcceptance(true)} className="inline-flex w-full justify-center rounded-md bg-green-400 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Accept</button>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => handleAcceptance(true)} className="inline-flex w-full justify-center rounded-md bg-green-400 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Accept</button>
                                            <button type="button" onClick={() => handleAcceptance(false)} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Decline</button>
                                        </>
                                    )}
                                    <button type="button" onClick={() => setAcceptModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 sm:mt-0 sm:w-auto">Cancel</button>
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