"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import { AnimatePresence, motion } from "motion/react";

import { Bell, Eye, Menu, Moon, Sun, X } from "lucide-react";

import Logout from "@/app/auth/logout/page";
import { usePopoverMotion, usePopoverSpring, useSpringHover, useSpringTap } from "@/lib/motion-presets";

import NotificationMenu from "@/components/layout/NotificationMenu";

export default function Header({
    sidebarOpen,
    toggleSidebar,
    user
}: {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    user: any | null;
}) {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const pop = usePopoverMotion();
    const popTransition = usePopoverSpring();
    const tap = useSpringTap();
    const hoverScale = useSpringHover();

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

    useEffect(() => {
        if (!user?.id) {
            setUnreadNotificationCount(0);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/notifications/leave-requests", {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;
                setUnreadNotificationCount(
                    typeof data.unreadCount === "number" ? data.unreadCount : 0,
                );
            } catch {
                if (!cancelled) setUnreadNotificationCount(0);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.id, notificationOpen]);

    const toggleNotification = () => {
        setNotificationOpen((open) => !open);
        setUserMenuOpen(false);
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
        setUserMenuOpen((open) => !open);
        setNotificationOpen(false);
    };

    const panelRing =
        "rounded-xl border border-gray-200/80 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-600 dark:bg-gray-800 dark:ring-white/10";

    return (
        <>
            <nav className="fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start">
                            <motion.button type="button" onClick={toggleSidebar} whileTap={tap} whileHover={{ scale: hoverScale }} className="p-2 text-gray-600 rounded-lg cursor-pointer lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                {sidebarOpen ? (
                                    <X className="w-6 h-6"/>
                                ) : (
                                    <Menu className="w-6 h-6"/>
                                )}
                            </motion.button>
                            <Link href="/" className="flex ml-2 md:mr-24">
                                <Image src="/img/logo.png" alt="Data Plus Logo" className="h-auto w-auto mr-3" width={122} height={35} priority/>
                            </Link>
                        </div>
                        <div ref={notificationRef} className="flex items-center">
                            <motion.button type="button" onClick={toggleNotification} aria-expanded={notificationOpen} aria-haspopup="true" aria-controls="notifications-panel" whileTap={tap} whileHover={{ scale: hoverScale }} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                <Bell className="w-6 h-6"/>
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-800" style={{fontSize: unreadNotificationCount > 9 ? "9px" : "10px"}}>
                                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                                    </span>
                                )}
                            </motion.button>
                            <AnimatePresence>
                                {notificationOpen && (
                                    <motion.div initial={pop.initial} animate={pop.animate} exit={pop.exit} transition={popTransition} className="absolute right-0 z-50 max-w-sm overflow-hidden text-base list-none border border-gray-200 dark:border-gray-600 bg-white divide-y divide-gray-100 rounded shadow-lg dark:divide-gray-600 dark:bg-gray-700" style={{top: "65px", right: "0", minWidth: "384px"}}>
                                        <div className="block px-4 py-2 text-base font-medium text-center text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                            Notifications
                                        </div>
                                        <div>
                                            <NotificationMenu user={user}/>
                                        </div>
                                        <Link href="/notifications" className="block py-2 text-base font-normal text-center text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:underline">
                                            <div className="inline-flex items-center ">
                                                <Eye className="w-5 h-5 mr-2"/>
                                                View all
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.button type="button" onClick={toggleTheme} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} whileTap={tap} whileHover={{ scale: hoverScale }} id="theme-toggle" className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5">
                                {darkMode ? (
                                    <Sun id="theme-toggle-dark-icon" className="w-5 h-5" />
                                ) : (
                                    <Moon id="theme-toggle-light-icon" className="w-5 h-5" />
                                )}
                            </motion.button>
                            <div id="tooltip-toggle" className={`absolute z-10 inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm tooltip ${showTooltip ? "opacity-100 visible" : "opacity-0 invisible"}`} style={{position: "absolute", inset: "0px auto auto 0px", margin: "0px", transform: "translate3d(1364px, 63.2px, 0px)"}}>
                                Toggle {darkMode ? "light" : "dark"} mode
                                <div className="tooltip-arrow" style={{position: "absolute", left: "0px", transform: "translate3d(68.8px, 0px, 0px)"}}></div>
                            </div>
                            <div className="ml-1 sm:ml-2" ref={userMenuRef}>
                                <motion.button type="button" onClick={toggleUserMenu} aria-expanded={userMenuOpen} aria-haspopup="true" aria-controls="user-menu-panel" whileTap={tap} whileHover={{ scale: hoverScale }} className="flex rounded-full text-sm ring-offset-2 ring-offset-white focus:outline-none focus:ring-4 focus:ring-gray-300 dark:ring-offset-gray-800 dark:focus:ring-gray-600">
                                    <Image src="/img/blank-profile.png" alt="" className="h-8 w-8 rounded-full" width={32} height={32} />
                                </motion.button>
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div role="menu" initial={pop.initial} animate={pop.animate} exit={pop.exit} transition={popTransition} className="absolute right-0 z-50 text-base list-none bg-white divide-y divide-gray-100 rounded shadow border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:divide-gray-600" style={{top: "65px", minWidth: "250px"}}>
                                            <div className="px-4 py-3">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {user?.firstName} {user?.lastName}
                                                </p>
                                                <p className="text-sm text-gray-700 truncate dark:text-gray-300">
                                                    {user?.position ?? user?.role}
                                                </p>
                                            </div>
                                            <ul className="py-1">
                                                <li>
                                                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white">Settings</Link>
                                                </li>
                                                <li>
                                                    <Logout/>
                                                </li>
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
