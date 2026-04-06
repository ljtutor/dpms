"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import { AnimatePresence, motion } from "motion/react";

import { Bell, Eye, Menu, Moon, Sun, X } from "lucide-react";

import Logout from "@/app/auth/logout/page";
import { usePopoverMotion, usePopoverSpring, useSpringHover, useSpringTap } from "@/lib/motion-presets";

const menuItemClass =
    "block w-full px-4 py-2.5 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100 active:bg-gray-200/80 dark:text-gray-200 dark:hover:bg-gray-600/80 dark:active:bg-gray-600";

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
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setNotificationOpen(false);
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

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
                            <motion.button
                                type="button"
                                onClick={toggleSidebar}
                                whileTap={tap}
                                whileHover={{ scale: hoverScale }}
                                className="p-2 text-gray-600 rounded-lg cursor-pointer lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            >
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
                        <div className="flex items-center gap-1 sm:gap-2">
                            <div className="relative" ref={notificationRef}>
                                <motion.button
                                    type="button"
                                    onClick={toggleNotification}
                                    aria-expanded={notificationOpen}
                                    aria-haspopup="true"
                                    aria-controls="notifications-panel"
                                    whileTap={tap}
                                    whileHover={{ scale: hoverScale }}
                                    className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                >
                                    <Bell className="h-6 w-6" aria-hidden />
                                </motion.button>
                                <AnimatePresence>
                                    {notificationOpen && (
                                        <motion.div
                                            id="notifications-panel"
                                            role="menu"
                                            initial={pop.initial}
                                            animate={pop.animate}
                                            exit={pop.exit}
                                            transition={popTransition}
                                            style={{ transformOrigin: "top right" }}
                                            className={`absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,22rem)] max-w-sm overflow-hidden ${panelRing}`}
                                        >
                                            <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                                                Notifications
                                            </div>
                                            <div>
                                                <Link
                                                    href=""
                                                    className="flex border-b border-gray-100 px-4 py-3 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700/50 dark:active:bg-gray-700"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <Image src="/img/blank-profile.png" alt="" className="h-11 w-11 rounded-full" height={44} width={44} />
                                                    </div>
                                                    <div className="w-full pl-3">
                                                        <div className="mb-1.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                            New message from <span className="font-semibold text-gray-900 dark:text-white">Bonnie Green</span>: &quot;Hey, what&apos;s up? All set for the presentation?&quot;
                                                        </div>
                                                        <div className="text-xs font-medium text-primary-700 dark:text-primary-400">a few moments ago</div>
                                                    </div>
                                                </Link>
                                            </div>
                                            <Link
                                                href=""
                                                className="flex items-center justify-center gap-2 bg-gray-50/90 py-2.5 text-sm font-normal text-gray-900 transition-colors duration-150 hover:bg-gray-100 active:bg-gray-200/80 dark:bg-gray-700/50 dark:text-white dark:hover:bg-gray-600"
                                            >
                                                <Eye className="h-5 w-5" />
                                                View all
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="relative">
                                <motion.button
                                    type="button"
                                    onClick={toggleTheme}
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    id="theme-toggle"
                                    whileTap={tap}
                                    whileHover={{ scale: hoverScale }}
                                    className="rounded-lg p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                                >
                                    {darkMode ? (
                                        <Sun id="theme-toggle-dark-icon" className="h-5 w-5" />
                                    ) : (
                                        <Moon id="theme-toggle-light-icon" className="h-5 w-5" />
                                    )}
                                </motion.button>
                                <div
                                    id="tooltip-toggle"
                                    role="tooltip"
                                    className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg transition-opacity duration-200 dark:bg-gray-700 ${showTooltip ? "opacity-100" : "pointer-events-none opacity-0"}`}
                                >
                                    Toggle {darkMode ? "light" : "dark"} mode
                                </div>
                            </div>

                            <div className="relative ml-1 sm:ml-2" ref={userMenuRef}>
                                <motion.button
                                    type="button"
                                    onClick={toggleUserMenu}
                                    id="user-menu-button-2"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                    aria-controls="user-menu-panel"
                                    whileTap={tap}
                                    whileHover={{ scale: hoverScale }}
                                    className="flex rounded-full text-sm ring-offset-2 ring-offset-white focus:outline-none focus:ring-4 focus:ring-gray-300 dark:ring-offset-gray-800 dark:focus:ring-gray-600"
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <Image src="/img/blank-profile.png" alt="" className="h-8 w-8 rounded-full" width={32} height={32} />
                                </motion.button>
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            id="user-menu-panel"
                                            role="menu"
                                            initial={pop.initial}
                                            animate={pop.animate}
                                            exit={pop.exit}
                                            transition={popTransition}
                                            style={{ transformOrigin: "top right" }}
                                            className={`absolute right-0 top-full z-50 mt-2 min-w-[250px] ${panelRing}`}
                                        >
                                            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-600">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {user?.first_name} {user?.last_name}
                                                </p>
                                                <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                                                    {user?.position ||
                                                        (typeof user?.role === "string"
                                                            ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
                                                            : "")}
                                                </p>
                                            </div>
                                            <ul className="py-1">
                                                <li>
                                                    <Link href="#" className={`${menuItemClass} rounded-none`}>
                                                        Settings
                                                    </Link>
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
