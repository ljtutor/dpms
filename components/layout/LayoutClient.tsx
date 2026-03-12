"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Aside from "@/components/layout/Aside";
import Footer from "@/components/layout/Footer";

export default function LayoutClient({ children, }: { children: React.ReactNode; }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
        <Header sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
        <div className="flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Aside sidebarOpen={sidebarOpen}/>
            <div id="main-content" className="relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900">
                <main>{children}</main>
                <Footer/>
            </div>
        </div>
    </>
  );
}