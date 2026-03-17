"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import { Bell, Eye, Menu, Moon, Sun, X } from "lucide-react";

import Logout from "@/app/auth/logout/page";

export default function Header({
    children,
    sidebarOpen,
    toggleSidebar
}: {
    children: React.ReactNode;
    sidebarOpen: boolean;
    toggleSidebar: () => void
}) {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [user, setUser] = useState<{
        id: number;
        name: string;
        email: string;
    } | null>(null);

    useEffect(() => {
        const user = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (user) {
            try {
                setUser(JSON.parse(user));
            } catch (error) {
                setUser(null);
            }
        }
    }, []);

    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleNotification = () => {
        setNotificationOpen(!notificationOpen);
        if (!notificationOpen) setUserMenuOpen(false);
    };

    const toggleTheme = () => {
        setDarkMode(!darkMode);

        if (!darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("color-theme", "dark");
        }
        else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("color-theme", "light");
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("color-theme");

        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setDarkMode(true);
        }
        else {
            setDarkMode(false);
        }
    }, []);

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
        if (!userMenuOpen) setNotificationOpen(false);
    };

    return (
        <>
            <nav className="fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start">
                            <button onClick={toggleSidebar} aria-controls="sidebar" className="p-2 text-gray-600 rounded cursor-pointer lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                {sidebarOpen ? (
                                    <X className="w-6 h-6"/>
                                ) : (
                                    <Menu className="w-6 h-6"/>
                                )}
                            </button>
                            <Link href="/" className="flex ml-2 md:mr-24">
                                <Image src="/img/logo.png" alt="Data Plus Logo" className="h-auto w-auto mr-3" width={122} height={35} priority/>
                            </Link>
                        </div>
                        <div className="flex items-center" ref={notificationRef}>
                            <button type="button" onClick={toggleNotification} className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
                                <Bell className="w-6 h-6"/>
                            </button>
                            {notificationOpen && (
                                <div className="absolute right-0 z-50 max-w-sm overflow-hidden text-base list-none bg-white divide-y divide-gray-100 rounded shadow-lg dark:divide-gray-600 dark:bg-gray-700" style={{marginTop: "231px"}} data-popper-placement="bottom">
                                    <div className="block px-4 py-2 text-base font-medium text-center text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        Notifications
                                    </div>
                                    <div>
                                        <Link href="" className="flex px-4 py-3 border-b hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-600">
                                            <div className="flex-shrink-0">
                                                <Image src="/img/blank-profile.png" alt="Profile" className="rounded-full w-11 h-11" height={44} width={44}></Image>
                                            </div>
                                            <div className="w-full pl-3">
                                                <div className="text-gray-500 font-normal text-sm mb-1.5 dark:text-gray-400">
                                                    New message from <span className="font-semibold text-gray-900 dark:text-white">Bonnie Green</span>: "Hey, what's up? All set for the presentation?"
                                                </div>
                                                <div className="text-xs font-medium text-primary-700 dark:text-primary-400">a few moments ago</div>
                                            </div>
                                        </Link>
                                    </div>
                                    <Link href="" className="block py-2 text-base font-normal text-center text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:underline">
                                        <div className="inline-flex items-center ">
                                            <Eye className="w-5 h-5 mr-2"/>
                                            View all
                                        </div>
                                    </Link>
                                </div>
                            )}
                            <button id="theme-toggle" onClick={toggleTheme} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} data-tooltip-target="tooltip-toggle" type="button" className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5">
                                {darkMode ? (
                                    <Sun id="theme-toggle-dark-icon" className="w-5 h-5" />
                                ) : (
                                    <Moon id="theme-toggle-light-icon" className="w-5 h-5" />
                                )}
                            </button>
                            <div id="tooltip-toggle" role="tooltip" className={`absolute z-10 inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm tooltip ${showTooltip ? "opacity-100 visible" : "opacity-0 invisible"}`} data-popper-placement="bottom" style={{position: "absolute", inset: "0px auto auto 0px", margin: "0px", transform: "translate3d(1364px, 63.2px, 0px)"}}>
                                Toggle {darkMode ? "light" : "dark"} mode
                                <div className="tooltip-arrow" data-popper-arrow style={{position: "absolute", left: "0px", transform: "translate3d(68.8px, 0px, 0px)"}}></div>
                            </div>
                            <div className="flex items-center ml-3" ref={userMenuRef}>
                                <div>
                                    <button onClick={toggleUserMenu} type="button" id="user-menu-button-2" aria-expanded="false" data-dropdown-toggle="dropdown-2" className="flex text-sm rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                                        <span className="sr-only">Open user menu</span>
                                        <Image src="/img/blank-profile.png" alt="Profile" className="w-8 h-8 rounded-full" width={32} height={32}></Image>
                                    </button>
                                </div>
                                {userMenuOpen && (
                                    <div className="absolute right-0 z-50 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600" style={{marginTop: "195px"}} data-popper-placement="bottom">
                                        <div className="px-4 py-3" role="none">
                                            <p className="text-sm text-gray-900 dark:text-white" role="none">
                                                {user?.name || "Guest"}
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-300" role="none">
                                                {user?.email || "guest@example.com"}
                                            </p>
                                        </div>
                                        <ul className="py-1" role="none">
                                            <li>
                                                <Link href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">Settings</Link>
                                            </li>
                                            <li>
                                                <Logout>{children}</Logout>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}