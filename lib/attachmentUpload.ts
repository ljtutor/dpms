import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function sanitizeBaseName(fileName: string): string {
    const base = path.basename(fileName, path.extname(fileName)).replace(/[^a-zA-Z0-9._-]/g, "_");
    const trimmed = base.slice(0, 100);
    return trimmed || "file";
}

export async function saveUploadedFile(
    directory: string,
    urlPrefix: string,
    file: File
): Promise<string> {
    const rawExt = path.extname(file.name).toLowerCase();
    const ext = /^\.[a-z0-9]{1,10}$/.test(rawExt) ? rawExt : "";
    const base = sanitizeBaseName(file.name);
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${base}${ext}`;

    const dir = directory;
    await mkdir(dir, { recursive: true });

    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buf);

    return `${urlPrefix}/${filename}`;
}
