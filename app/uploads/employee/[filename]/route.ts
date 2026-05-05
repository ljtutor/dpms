import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { UPLOAD_DIR } from "@/app/api/settings/route";

const MIME: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename: raw } = await params;
    const filename = path.basename(raw);
    if (!filename || filename !== raw) {
        return new NextResponse(null, { status: 400 });
    }
    const resolvedRoot = path.resolve(UPLOAD_DIR);
    const resolvedFile = path.resolve(path.join(UPLOAD_DIR, filename));
    const relative = path.relative(resolvedRoot, resolvedFile);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new NextResponse(null, { status: 400 });
    }
    try {
        const buf = await readFile(resolvedFile);
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME[ext] ?? "application/octet-stream";
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
            },
        });
    } catch {
        return new NextResponse(null, { status: 404 });
    }
}