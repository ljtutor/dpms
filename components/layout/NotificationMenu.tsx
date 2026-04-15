"use client";

import { Check, CheckCircle, Send, X, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { NotificationType } from "@/app/generated/prisma/enums";

type Notification = {
    id: number;
    type: NotificationType;
    isRead: boolean;
    fromUser: {
        id: number;
        employeeInformation: {
            firstName: string;
            lastName: string;
        };
    };
    toUsers: {
        id: number;
        employeeInformation: {
            firstName: string;
            lastName: string;
        };
    }[];
    ccUsers: {
        id: number;
        employeeInformation: {
            firstName: string;
            lastName: string;
        };
    }[];
    leaveRequest: {
        id: number;
        leaveType: {
            type: string;
        };
    };
    createdAt: string;
};

type NotificationMenuProps = {
    user: { id: number } | null;
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

export default function NotificationMenu({ user }: NotificationMenuProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await fetch("/api/notifications/leave-requests", {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;
                setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            } catch {
                setNotifications([]);
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, []);
    
    return (
        <>
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
                                
                                {Number(notification.fromUser.id) === Number(user?.id) ? (
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
                                {notification.type === NotificationType.SUBMIT && Number(notification.fromUser.id) === Number(user?.id) ? (
                                    <> and is waiting for approval.</>
                                ) : notification.type === NotificationType.SUBMIT && Number(notification.fromUser.id) !== Number(user?.id) ? (
                                    <> and needs your approval.</>
                                ) : (notification.type === NotificationType.APPROVE || notification.type === NotificationType.DENY || notification.type === NotificationType.ACCEPT || notification.type === NotificationType.DECLINE) && !notification.toUsers.some((u) => Number(u.id) === Number(user?.id)) ? (
                                    <> submitted by <span className="font-semibold text-gray-900 dark:text-white">{notification.toUsers[0].employeeInformation.firstName} {notification.toUsers[0].employeeInformation.lastName}</span> {notification.ccUsers.some((u) => Number(u.id) === Number(user?.id)) && " and needs your acceptance"}.</>
                                ) : (notification.type === NotificationType.APPROVE || notification.type === NotificationType.DENY || notification.type === NotificationType.ACCEPT || notification.type === NotificationType.DECLINE) && notification.toUsers.some((u) => Number(u.id) === Number(user?.id)) ? (
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
        </>
    );
}