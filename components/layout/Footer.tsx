import Link from "next/link";

import { Facebook, Linkedin } from 'lucide-react';

export default function Footer() {
    const url = "https://www.dataplus.com.ph";
    return (
        <>
            <footer className="p-4 my-6 mx-4 bg-white rounded-lg shadow md:flex md:items-center md:justify-between md:p-6 xl:p-8 dark:bg-gray-800">
                <ul className="flex flex-wrap items-center mb-6 space-y-1 md:mb-0">
                    <li>
                        <Link href={`${url}/about`} className="mr-4 text-sm font-normal text-gray-500 hover:underline md:mr-6 dark:text-gray-400" target="_blank">About</Link>
                    </li>
                    <li>
                        <Link href={`${url}/services`} className="mr-4 text-sm font-normal text-gray-500 hover:underline md:mr-6 dark:text-gray-400" target="_blank">Services</Link>
                    </li>
                    <li>
                        <Link href={`${url}/trainings`} className="mr-4 text-sm font-normal text-gray-500 hover:underline md:mr-6 dark:text-gray-400" target="_blank">Trainings</Link>
                    </li>
                    <li>
                        <Link href={`${url}/products`} className="mr-4 text-sm font-normal text-gray-500 hover:underline md:mr-6 dark:text-gray-400" target="_blank">Products</Link>
                    </li>
                    <li>
                        <Link href={`${url}/contact`} className="text-sm font-normal text-gray-500 hover:underline md:mr-6 dark:text-gray-400" target="_blank">Contact</Link>
                    </li>
                </ul>
                <div className="flex space-x-6 sm:justify-center">
                    <Link href="https://www.facebook.com/profile.php?id=100057449229495" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" target="_blank">
                        <Facebook className="w-5 h-5"></Facebook>
                    </Link>
                    <Link href="https://www.linkedin.com/in/data-plus-it-solutions-7752861a2/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" target="_blank">
                        <Linkedin className="w-5 h-5"></Linkedin>
                    </Link>
                </div>
            </footer>
            <p className="my-10 text-sm text-center text-gray-500">
                © 2026 <Link href="https://www.dataplus.com.ph/" className="hover:underline" target="_blank">Data Plus I.T. Solutions</Link>. All rights reserved.
            </p>
        </>
    );
}