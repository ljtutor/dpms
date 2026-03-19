"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";
import Aside from "@/components/layout/Aside";
import Footer from "@/components/layout/Footer";

export default function LayoutClient({ children, }: { children: React.ReactNode; }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!res.ok) {
      setUser(null);
      return;
    }

    const data = await res.json();
    setUser(data.user);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    const savedTheme = localStorage.getItem("color-theme");

    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
    }
    else {
        document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <>
      {isAuthPage ? (
        <main className="bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      ) : (
        <>
          <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} user={user}/>
          <div className="flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900">
              <Aside sidebarOpen={sidebarOpen} user={user}/>
              <div id="main-content" className="relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900">
                  <main>{children}</main>
                  <Footer/>
              </div>
          </div>
        </>
      )}
    </>
  );
}