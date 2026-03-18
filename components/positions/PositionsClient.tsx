"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import FlashMessage from "@/components/ui/FlashMessage";
import Link from "next/link";

import { ChevronLeft, ChevronRight, Home, PlusCircle, SquarePen, Trash2, X } from "lucide-react";

type PositionsClientProps = {
    positions: any[];
};

export default function PositionsClient({ positions }: PositionsClientProps) {
    const [positionModalOpen, setPositionModalOpen] = useState(false);
    const [positionModalMode, setPositionModalMode] = useState<"insert" | "update">("insert");
    const [editingPosition, setEditingPosition] = useState<any | null>(null);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [removePosition, setRemovePosition] = useState<any | null>(null);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const router = useRouter();

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSuccess("");
        setError("");

        const form = e.currentTarget;
        const formData = new FormData(form);

        const title = formData.get("title") as string;

        try {
            const res = await fetch(
                positionModalMode === "insert"
                    ? "/api/positions"
                    : `/api/positions/${editingPosition?.id}`,
                {
                    method: positionModalMode === "insert" ? "POST" : "PUT",
                    body: JSON.stringify({
                        title
                    })
                }
            );
            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                setPositionModalOpen(false);
            }
            else {
                setError(data.error);
                setPositionModalOpen(true);
            }

            setEditingPosition(null);
            router.refresh();
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleRemovePosition = async () => {
        if (!removePosition?.id) return;
        setSuccess("");
        setError("");

        try {
            const res = await fetch(`/api/positions/${removePosition?.id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
            }
            else {
                setError(data.error);
            }

            setRemoveModalOpen(false);
            setRemovePosition(null);
            router.refresh();
        }
        catch (error: any) {
            setError(error.message);
        }
    };

    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const total = positions.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, total);
    const paginatedPositions = positions.slice(startIndex, endIndex);

    return (
        <>
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
                                        <span className="ml-1 text-gray-400 md:ml-2 dark:text-gray-500">Positions</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All positions</h1>
                    </div>
                    <div className="sm:flex">
                        <div className="items-center hidden mb-3 sm:flex sm:divide-x sm:divide-gray-100 sm:mb-0 dark:divide-gray-700">
                            <form method="GET" className="lg:pr-3">
                                <label htmlFor="search" className="sr-only">Search</label>
                                <div className="relative mt-1 lg:w-64 xl:w-96">
                                    <input type="text" id="search" name="search" placeholder="Search" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"/>
                                </div>
                            </form>
                        </div>
                        <div className="flex items-center ml-auto space-x-2 sm:space-x-3">
                            <button type="button" onClick={() => { setPositionModalOpen(true); setPositionModalMode("insert"); setEditingPosition(null); }} className="inline-flex items-center justify-center w-1/2 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 sm:w-auto dark:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500 dark:focus:ring-primary-800">
                                <PlusCircle className="w-5 h-5 mr-2 -ml-1"/> Add position
                            </button>
                        </div>
                    </div>
                    {success && <FlashMessage type="success" message={success}/>}
                </div>
            </div>
            <div className="flex flex-col">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-600">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Title</th>
                                        <th scope="col" className="p-4 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {paginatedPositions.map((position) => (
                                        <tr key={position.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <td className="p-2 text-sm text-gray-900 whitespace-nowrap dark:text-white">{position.title}</td>
                                            <td className="p-2 space-x-2 whitespace-nowrap">
                                                <button type="button" onClick={() => { setPositionModalOpen(true); setPositionModalMode("update"); setEditingPosition(position); }} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                                                    <SquarePen className="w-4 h-4"/>
                                                </button>
                                                <button type="button" onClick={() => { setRemovePosition(position); setRemoveModalOpen(true); }} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-900">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className="sticky bottom-0 right-0 items-center w-full p-4 bg-white border-t border-gray-200 sm:flex sm:justify-between dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center mb-4 sm:mb-0">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex justify-center p-1 text-gray-500 rounded hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" style={{ opacity: page <= 1 ? 0.5 : 1 }} disabled={page <= 1}>
                        <ChevronLeft className="w-7 h-7"/>
                    </button>
                    <button onClick={() => setPage((p) => Math.max(1, p + 1))} className="inline-flex justify-center p-1 mr-2 text-gray-500 rounded hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" style={{ opacity: page <= totalPages ? 0.5 : 1 }} disabled={page <= totalPages}>
                        <ChevronRight className="w-7 h-7"/>
                    </button>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> of <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" style={{ opacity: page <= 1 ? 0.5 : 1 }} disabled={page <= 1}>
                        <ChevronLeft className="w-5 h-5 mr-1 -ml-1"/> Previous
                    </button>
                    <button onClick={() => setPage((p) => Math.max(1, p + 1))} className="inline-flex items-center justify-center flex-1 px-3 py-2 text-sm font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" style={{ opacity: page <= totalPages ? 0.5 : 1 }} disabled={page <= totalPages}>
                        Next <ChevronRight className="w-5 h-5 ml-1 -mr-1"/>
                    </button>
                </div>
            </div>
            {positionModalOpen && (
                <>
                    <div className="fixed left-0 right-0 z-50 items-center justify-center overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full flex">
                        <div className="relative w-full h-full max-w-2xl px-4 md:h-auto">
                            <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-700">
                                    <h3 className="text-xl font-semibold dark:text-white">
                                        {positionModalMode === "insert" ? "Add new position" : "Edit position"}
                                    </h3>
                                    <button type="button" onClick={() => setPositionModalOpen(false)} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white">
                                        <X className="w-5 h-5"/>
                                    </button>
                                </div>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="p-6 space-y-6">
                                        {error && <FlashMessage type="error" message={error}/>}
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="col-span-1">
                                                <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title <span className="text-red-500">*</span></label>
                                                <input type="text" id="title" name="title" defaultValue={editingPosition?.title ?? ""} className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Title" autoComplete="off" required/>
                                            </div>
                                        </div>
                                    </div>
                                    {positionModalMode === "update"
                                        ? <div className="p-6 space-y-6 border-t border-gray-200 rounded-b dark:border-gray-700">
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="col-span-1">
                                                    <label htmlFor="created_at" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Created at</label>
                                                    <input type="text" id="created_at" defaultValue={editingPosition?.created_at ? editingPosition?.created_at.toISOString().slice(0, 19).replace("T", " ") : ""} className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-400" disabled/>
                                                </div>
                                                <div className="col-span-1">
                                                    <label htmlFor="updated_at" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Updated at</label>
                                                    <input type="text" id="updated_at" defaultValue={editingPosition?.updated_at ? editingPosition?.updated_at.toISOString().slice(0, 19).replace("T", " ") : ""} className="shadow-sm bg-gray-200 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-400" disabled/>
                                                </div>
                                            </div>
                                        </div>
                                        : ""
                                    }
                                    <div className="items-center p-6 flex justify-end gap-4 border-t border-gray-200 rounded-b dark:border-gray-700">
                                        {positionModalMode === "insert"
                                            ? <button type="submit" className="text-white bg-green-400 hover:bg-green-500 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 text-center dark:bg-green-400 dark:hover:bg-green-500 dark:focus:ring-green-800">Add position</button>
                                            : <button type="submit" className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-3 py-2 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Save changes</button>
                                        }
                                        <button type="button" onClick={() => setPositionModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 sm:mt-0 sm:w-auto">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"></div>
                </>
            )}
            {removeModalOpen && (
                <>
                    <div className="fixed left-0 right-0 z-50 items-center justify-center overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full flex" role="dialog">
                        <div className="relative w-full h-full max-w-2xl px-4 md:h-auto">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start gap-4">
                                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
                                            <Trash2 className="w-6 h-6 text-red-600"/>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200">Remove position</h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-start text-gray-500 dark:text-gray-400">Are you sure you want to remove this position? This action cannot be undone.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex justify-end gap-4 sm:px-6">
                                    <button type="button" onClick={handleRemovePosition} className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-500 sm:ml-3 sm:w-auto">Remove</button>
                                    <button type="button" onClick={() => setRemoveModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 sm:mt-0 sm:w-auto">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40"></div>
                </>
            )}
        </>
    );
}