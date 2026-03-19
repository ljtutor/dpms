"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

type FlashMessageProps = {
    type: "success" | "error";
    message: string;
};

export default function FlashMessage({ type, message }: FlashMessageProps) {
    const [visible, setVisible] = useState(true);

    if (!visible || !message) return null;

    const handleClose = () => {
        setVisible(false);
        sessionStorage.removeItem(type);
    };

    const isSuccess = type === "success";

    return (
        <>
            {isSuccess
                ? <div className="flex items-center justify-between gap-2 mt-4 text-sm text-green-500 dark:text-green-700 bg-green-100 dark:bg-green-200 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4"/>
                        <span>{message}</span>
                    </div>
                    <button type="button" onClick={handleClose} className="p-1 rounded hover:bg-green-200/60 dark:hover:bg-green-300/40">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                : <div className="flex items-center justify-between gap-2 text-sm text-red-500 dark:text-red-700 bg-red-100 dark:bg-red-200 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4"/>
                        <span>{message}</span>
                    </div>
                    <button type="button" onClick={handleClose} className="p-1 rounded hover:bg-red-200/60 dark:hover:bg-red-300/40">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            }
        </>
    );
}