"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ChangePasswordClient() {
    const [acceptTerms, setAcceptTerms] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen pt:mt-0 dark:bg-gray-900">
        <Link href="/" className="flex items-center justify-center mb-4 text-2xl font-semibold dark:text-white">
            <Image src="/img/logo.png" alt="Data Plus Logo" className="w-auto" width={135} height={50}/>
        </Link>
        <div className="w-full max-w-xl p-6 space-y-8 bg-white rounded-lg shadow sm:p-8 dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change your password</h2>
            <form action="" className="mt-8 space-y-6">
                <div>
                    <label htmlFor="current-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Current Password</label>
                    <input type="password" id="current-password" name="current-password" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="******" required/>
                </div>
                <div>
                    <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New Password</label>
                    <input type="password" id="new-password" name="new-password" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="******" required/>
                </div>
                <div>
                    <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm New Password</label>
                    <input type="password" id="confirm-password" name="confirm-password" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="******" required/>
                </div>
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} id="remember" name="remember" aria-describedby="remember" className="w-4 h-4 border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="remember" className="font-medium text-gray-900 dark:text-white">
                            I accept the <Link href="#" className="text-primary-700 hover:underline dark:text-primary-500">Terms and Conditions</Link>
                        </label>
                    </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {acceptTerms ? (
                        <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Change password</button>
                    ) : (
                        <span className="w-full px-5 py-3 text-base font-medium text-center text-gray-500 bg-gray-100 rounded-lg sm:w-auto dark:bg-gray-600 dark:text-gray-400">Change password</span>
                    )}
                    <Link href="/settings" className="px-5 py-3 font-medium text-gray-900 text-center sm:text-right dark:text-gray-400 sm:shrink-0 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-600 dark:hover:text-white">Back to settings</Link>
                </div>
            </form>
        </div>
    </div>
  );
}