"use client";

import Link from "next/link";

import { Calendar, CalendarCheck, Globe, History, Settings } from "lucide-react";

export default function Aside({ sidebarOpen }: { sidebarOpen: boolean }) {
    return (
        <>
            <aside className={`fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 w-64 h-full pt-16 font-normal duration-75 lg:flex transition-width ${sidebarOpen ? "" : "hidden"}`} aria-label="Sidebar">
                <div className="relative flex flex-col flex-1 min-h-0 pt-0 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-1 px-3 space-y-1 bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            <ul className="pb-2 space-y-2">
                                <li>
                                    <Link href="/" className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700">
                                        <Calendar className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></Calendar>
                                        <span className="ml-3" sidebar-toggle-item="">Timekeeping</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/" className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700">
                                        <History className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></History>
                                        <span className="ml-3" sidebar-toggle-item="">Weekly Activity Report</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/" className="flex items-center p-2 text-base text-gray-900 rounded-lg hover:bg-gray-100 group dark:text-gray-200 dark:hover:bg-gray-700">
                                        <CalendarCheck className="w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"></CalendarCheck>
                                        <span className="ml-3" sidebar-toggle-item="">Leave Application</span>
                                    </Link>
                                </li>
                            </ul>
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