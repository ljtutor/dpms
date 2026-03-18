"use client";

import Authorized from "@/components/Authorized";
import FlashMessage from "@/components/ui/FlashMessage";
import { useState, useEffect } from "react";

import Link from "next/link";
import { ChevronRight, Home} from "lucide-react";

export default function HomePage() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const error = sessionStorage.getItem("error");
    if (error) {
      setError(error);
    }
  }, []);

  return (
    <Authorized>
      <div className="p-4 bg-white block sm:flex items-center justify-between border-b border-gray-200 lg:mt-1.5 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-full mb-1">
              <div className="mb-4">
                  <nav className="flex mb-5">
                      <ol className="inline-flex items-center space-x-1 text-sm font-medium md:space-x-2">
                          <li className="inline-flex items-center">
                              <Link href="/" className="inline-flex items-center text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">
                                  <Home className="w-5 h-5 mr-2.5"/> Data Plus Management System
                              </Link>
                          </li>
                          <li>
                              <div className="flex items-center">
                                  <ChevronRight className="w-6 h-6 text-gray-400"/>
                                  <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Home</span>
                              </div>
                          </li>
                      </ol>
                  </nav>
              </div>
              {success && <FlashMessage type="success" message={success}/>}
              {error && <FlashMessage type="error" message={error}/>}
          </div>
      </div>
    </Authorized>
  );
}