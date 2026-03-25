"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Link from "next/link";

import { Role } from "@/app/generated/prisma/enums";

import { Briefcase, Calendar, CalendarDays, ClipboardList, ChevronDown, Clock, Globe, History, Settings, Users } from "lucide-react";

export default function Aside({
    sidebarOpen,
    user
}: {
    sidebarOpen: boolean;
    user: any | null;
}) {
    const pathname = usePathname() ?? "";

    const [openRequests, setOpenRequests] = useState(() => pathname.startsWith("/requests"));

    const navBase = "flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700";
    const activeClass = "bg-gray-100 dark:bg-gray-700";
    const linkClass = (href: string) => `${navBase} ${pathname === href || pathname.startsWith(href + "/") ? activeClass : ""}`;
    
    return (
        <>
            <aside className={`fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 w-64 h-full pt-16 font-normal duration-75 lg:flex transition-width ${sidebarOpen ? "" : "hidden"}`} aria-label="Sidebar">
                <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-1 px-3 space-y-1 bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            <ul className="pb-2 space-y-2">
                            <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">User</h3>
                                <li>
                                    <Link href="/timekeeping" className={linkClass("/timekeeping")}>
                                        <Calendar className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Calendar>
                                        <span className="ml-3" sidebar-toggle-item="">Timekeeping</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/weekly-activity" className={linkClass("/weekly-activity")}>
                                        <History className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></History>
                                        <span className="ml-3" sidebar-toggle-item="">Weekly Activity Report</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/employee-calendar" className={linkClass("/employee-calendar")}>
                                        <CalendarDays className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></CalendarDays>
                                        <span className="ml-3" sidebar-toggle-item="">Employee Calendar</span>
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={() => setOpenRequests(!openRequests)} className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                                        <ClipboardList className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></ClipboardList>
                                        <span className="flex-1 ml-3 text-left whitespace-nowrap">Requests</span>
                                        <ChevronDown className={`w-6 h-6 ${openRequests ? "rotate-180" : ""}`}></ChevronDown>
                                    </button>
                                    {openRequests && (
                                        <ul className="space-y-2 py-2">
                                            <li>
                                                <Link href="/requests/leave" className={`text-base text-gray-900 rounded-lg flex items-center p-2 group hover:bg-gray-100 transition duration-75 pl-11 dark:text-gray-200 dark:hover:bg-gray-700 ${pathname === "/requests/leave" ? activeClass : ""}`}>Leave</Link>
                                            </li>
                                            <li>
                                                <Link href="/requests/reimbursement" className={`text-base text-gray-900 rounded-lg flex items-center p-2 group hover:bg-gray-100 transition duration-75 pl-11 dark:text-gray-200 dark:hover:bg-gray-700 ${pathname === "/requests/reimbursement" ? activeClass : ""}`}>Reimbursement</Link>
                                            </li>
                                        </ul>
                                    )}
                                </li>
                            </ul>
                            {user?.role === Role.ADMIN && (
                                <ul className="pt-2 pb-2 space-y-2">
                                    <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Admin</h3>
                                    <li>
                                        <Link href="/positions" className={linkClass("/positions")}>
                                            <Briefcase className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Briefcase>
                                            <span className="ml-3" sidebar-toggle-item="">Positions</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/shifts" className={linkClass("/shifts")}>
                                            <Clock className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Clock>
                                            <span className="ml-3" sidebar-toggle-item="">Shifts</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/users" className={linkClass("/users")}>
                                            <Users className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Users>
                                            <span className="ml-3" sidebar-toggle-item="">Users</span>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                            <div className="pt-2 space-y-2">
                                <Link href="https://www.dataplus.com.ph/" className="flex items-center p-2 text-base text-gray-900 transition duration-75 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700" target="_blank">
                                    <Globe className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Globe>
                                    <span className="ml-3" sidebar-toggle-item="">Support</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 justify-center hidden w-full p-4 space-x-4 bg-white lg:flex dark:bg-gray-800" sidebar-bottom-menu="true">
                        <Link href="#" data-tooltip-target="tooltip-settings" className="inline-flex justify-center p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                            <Settings className="w-6 h-6"/>
                        </Link>
                    </div>
                </div>
            </aside>
            <div className={`fixed inset-0 z-10 bg-gray-900/50 dark:bg-gray-900/90 ${sidebarOpen ? "" : "hidden"}`}></div>
        </>
    );
}