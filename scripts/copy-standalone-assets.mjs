/**
 * Next.js `output: "standalone"` does not copy Prisma engine binaries from a custom
 * `output` path, or `public` / `.next/static`, into `.next/standalone`. Azure runs
 * `node .next/standalone/server.js`, so those files must exist under standalone.
 *
 * Also copies `node_modules/.prisma` — the query engine is often resolved from there
 * even when using a custom client `output` path.
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
    console.warn("copy-standalone-assets: no .next/standalone; skipping.");
    process.exit(0);
}

function copyDir(from, to) {
    if (!existsSync(from)) return;
    mkdirSync(join(to, ".."), { recursive: true });
    cpSync(from, to, { recursive: true });
}

// Prisma client + query engines (custom output path)
const prismaSrc = join(root, "app", "generated", "prisma");
const prismaDest = join(standalone, "app", "generated", "prisma");
if (existsSync(prismaSrc)) {
    mkdirSync(join(standalone, "app", "generated"), { recursive: true });
    cpSync(prismaSrc, prismaDest, { recursive: true });
    // Flat copy of engine binaries for preload scripts (see scripts/prisma-query-engine-path.cjs)
    const enginesDest = join(standalone, "prisma-engines");
    mkdirSync(enginesDest, { recursive: true });
    for (const name of readdirSync(prismaSrc)) {
        if (!name.endsWith(".node")) continue;
        copyFileSync(join(prismaSrc, name), join(enginesDest, name));
    }
}

// Default Prisma engine / client metadata (needed for query engine resolution on Linux)
const nmPrisma = join(root, "node_modules", ".prisma");
const standaloneNm = join(standalone, "node_modules");
if (existsSync(nmPrisma)) {
    mkdirSync(standaloneNm, { recursive: true });
    cpSync(nmPrisma, join(standaloneNm, ".prisma"), { recursive: true });
}

// Static assets expected by Next standalone
copyDir(join(root, "public"), join(standalone, "public"));
copyDir(join(root, ".next", "static"), join(standalone, ".next", "static"));

// Sanity check (helps CI logs if something is still missing)
const checkDirs = [prismaDest, join(standaloneNm, ".prisma")];
for (const d of checkDirs) {
    if (!existsSync(d)) continue;
    const names = readdirSync(d);
    const engines = names.filter((n) => n.includes("query_engine") || n.endsWith(".node"));
    console.log(`copy-standalone-assets: in ${d} -> ${engines.length} engine-related file(s)`);
}

console.log("copy-standalone-assets: done.");
