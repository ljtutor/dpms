import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Header from "@/components/layout/Header";
import Aside from "@/components/layout/Aside";
//import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Data Plus Management System",
    template: "%s | Data Plus Management System",
  },
  description: "",
  icons: {
    icon: [
      {
        url: "/img/icon.png",
        type: "img/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
        <link rel="stylesheet" href="css/app.css"/>
        <link rel="stylesheet" href="css/main.css"/>
      </head>
      <body className="bg-gray-50 dark:bg-gray-800">
        <Header/>
        <div className="flex pt-16 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Aside/>
          <div id="sidebarBackdrop" className="fixed inset-0 z-10 hidden bg-gray-900/50 dark:bg-gray-900/90"></div>
          <div id="main-content" className="relative w-full h-full overflow-y-auto bg-gray-50 lg:ml-64 dark:bg-gray-900">
            <main>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
