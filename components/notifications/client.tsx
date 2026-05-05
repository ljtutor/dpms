"use client";

import { Check, CheckCircle, ChevronRight, Home, Send, X, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { NotificationType } from "@/app/generated/prisma/enums";

type NotoficationsClientProps = {
    notifications: any[];
    userId: number;
};

function formatNotificationDateTime(iso: string) {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const timePart = d
        .toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
        .toLowerCase();
    return `${datePart} ${timePart}`;
}

export default function NotoficationsClient({ notifications, userId }: NotoficationsClientProps) {
    return (
        <>
            <div className="p-4 bg-white block sm:flex items-center justify-between border-b border-gray-200 lg:mt-1.5 dark:bg-gray-800 dark:border-gray-700">
                <div className="w-full mb-1">
                    <div className="mb-4">
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
                                        <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Notifications</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">Notifications</h1>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <Link key={notification.id} href={`/notifications/${notification.id}`} className={`flex px-4 py-3 border-b ${!notification.isRead && "bg-gray-100 dark:bg-gray-600"} hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-600`}>
                                        <div className="flex-shrink-0">
                                            <Image src="/img/blank-profile.png" alt="Profile" className="rounded-full w-11 h-11" height={44} width={44}/>
                                                {notification.type === NotificationType.SUBMIT ? (
                                                    <div className="absolute flex items-center justify-center w-5 h-5 ml-6 -mt-5 border border-white rounded-full bg-orange-300 dark:border-gray-700">
                                                        <Send className="w-3 h-3 text-white"/>
                                                    </div>
                                                ) : notification.type === NotificationType.APPROVE ? (
                                                    <div className="absolute flex items-center justify-center w-5 h-5 ml-6 -mt-5 border border-white rounded-full bg-primary-700 dark:border-gray-700">
                                                        <CheckCircle className="w-3 h-3 text-white"/>
                                                    </div>
                                                ) : notification.type === NotificationType.DENY ? (
                                                    <div className="absolute flex items-center justify-center w-5 h-5 ml-6 -mt-5 border border-white rounded-full bg-red-500 dark:border-gray-700">
                                                        <XCircle className="w-3 h-3 text-white"/>
                                                    </div>
                                                ) : notification.type === NotificationType.ACCEPT ? (
                                                    <div className="absolute flex items-center justify-center w-5 h-5 ml-6 -mt-5 border border-white rounded-full bg-green-400 dark:border-gray-700">
                                                        <Check className="w-3 h-3 text-white"/>
                                                    </div>
                                                ) : notification.type === NotificationType.DECLINE ? (
                                                    <div className="absolute flex items-center justify-center w-5 h-5 ml-6 -mt-5 border border-white rounded-full bg-red-500 dark:border-gray-700">
                                                        <X className="w-3 h-3 text-white"/>
                                                    </div>
                                                ) : null}
                                        </div>
                                        <div className="w-full pl-3">
                                            <div className="text-gray-500 font-normal text-sm mb-1.5 dark:text-gray-400">
                                                
                                                {Number(notification.fromUser.id) === userId ? (
                                                    <>You</>
                                                ) : (
                                                    <span className="font-semibold text-gray-900 dark:text-white">{notification.fromUser.employeeInformation.firstName} {notification.fromUser.employeeInformation.lastName}</span>
                                                )}
                                                {notification.type === NotificationType.SUBMIT ? (
                                                    <> submitted a </>
                                                ) : notification.type === NotificationType.APPROVE ? (
                                                    <> approved a </>
                                                ) : notification.type === NotificationType.DENY ? (
                                                    <> denied a </>
                                                ) : notification.type === NotificationType.ACCEPT ? (
                                                    <> accepted a </>
                                                ) : notification.type === NotificationType.DECLINE ? (
                                                    <> declined a </>
                                                ) : null}
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {notification.leaveRequest.leaveType.type} Leave
                                                </span> request
                                                {notification.type === NotificationType.SUBMIT && Number(notification.fromUser.id) === userId ? (
                                                    <> and is waiting for approval.</>
                                                ) : notification.type === NotificationType.SUBMIT && Number(notification.fromUser.id) !== userId ? (
                                                    <> and needs your approval.</>
                                                ) : (notification.type === NotificationType.APPROVE || notification.type === NotificationType.DENY || notification.type === NotificationType.ACCEPT || notification.type === NotificationType.DECLINE) && !notification.toUsers.some((u: any) => Number(u.id) === userId) ? (
                                                    <> submitted by <span className="font-semibold text-gray-900 dark:text-white">{notification.toUsers[0].employeeInformation.firstName} {notification.toUsers[0].employeeInformation.lastName}</span> {notification.ccUsers.some((u: any) => Number(u.id) === userId) && " and needs your acceptance"}.</>
                                                ) : (notification.type === NotificationType.APPROVE || notification.type === NotificationType.DENY || notification.type === NotificationType.ACCEPT || notification.type === NotificationType.DECLINE) && notification.toUsers.some((u: any) => Number(u.id) === userId) ? (
                                                    <> you submitted.</>
                                                ) : null} Click to review.
                                            </div>
                                            <div className="text-xs font-medium text-primary-700 dark:text-primary-400">
                                                {formatNotificationDateTime(notification.createdAt)}
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    No notifications found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}