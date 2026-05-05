/**
 * Runs before the Next standalone server loads (see package.json "start").
 * Points Prisma at a real query-engine binary on disk. Oryx replaces
 * node_modules with a symlink, and bundled paths from CI do not match Azure.
 */
const { existsSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const cwd = process.cwd();
/** Project root when start runs as `node -r ./scripts/...` from package.json (cwd is usually wwwroot). */
const rootFromScript = join(__dirname, "..");

function scoreEngineName(name) {
    if (!name.includes("query_engine")) return -1;
    if (name.endsWith(".dll") || name.includes("windows")) return 0;
    if (name.includes("debian-openssl-3.0.x") || name.includes("debian-openssl-3")) return 100;
    if (name.startsWith("libquery_engine") && name.endsWith(".so.node")) return 80;
    if (name.endsWith(".node")) return 50;
    return -1;
}

function findEngineFile(dir) {
    if (!existsSync(dir)) return null;
    const stack = [dir];
    let best = null;
    let bestScore = -1;
    while (stack.length) {
        const d = stack.pop();
        let entries;
        try {
            entries = readdirSync(d, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const ent of entries) {
            const full = join(d, ent.name);
            if (ent.isDirectory()) {
                stack.push(full);
            } else {
                const sc = scoreEngineName(ent.name);
                if (sc > bestScore) {
                    bestScore = sc;
                    best = full;
                }
            }
        }
    }
    return bestScore >= 0 ? best : null;
}

// Order: cwd-relative (Azure wwwroot), then paths anchored at repo root from this script's location.
const dirs = [
    join(cwd, "app", "generated", "prisma"),
    join(cwd, ".next", "standalone", "app", "generated", "prisma"),
    join(cwd, ".next", "standalone", "prisma-engines"),
    join(cwd, "node_modules", ".prisma", "client"),
    join(cwd, ".next", "standalone", "node_modules", ".prisma", "client"),
    join(rootFromScript, "app", "generated", "prisma"),
    join(rootFromScript, ".next", "standalone", "app", "generated", "prisma"),
    join(rootFromScript, ".next", "standalone", "prisma-engines"),
    join(rootFromScript, "node_modules", ".prisma", "client"),
];

for (const dir of dirs) {
    const p = findEngineFile(dir);
    if (p) {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = p;
        console.log("[prisma-query-engine-path] PRISMA_QUERY_ENGINE_LIBRARY=" + p);
        break;
    }
}

if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    console.error(
        "[prisma-query-engine-path] WARN: no libquery_engine*.node found. cwd=" +
            cwd +
            " scriptRoot=" +
            rootFromScript
    );
}
