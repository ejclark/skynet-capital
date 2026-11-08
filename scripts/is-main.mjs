// The one direct-run check every script under scripts/ uses (#7046): "was this file run as
// `node <file>`, rather than imported?"
//
// Why it compares REAL paths: Node resolves the main module's `import.meta.url` through symlinks,
// while `process.argv[1]` keeps the path as typed. On macOS `/tmp` and `/var` are symlinks into
// `/private`, so a raw string comparison of the two (a `file://` template, or any
// `resolve`/`fileURLToPath` equality) never matched there. `main()` was skipped, and the script
// exited 0 having printed nothing. For a gate that meant no answer at all. On 2026-11-07 it made
// every local verify on a Mac fail (#7045 fixed the one spec that showed it). A basename check
// (`argv[1].endsWith("x.mjs")`) survives a symlink but can match the wrong file, so this is the shape.
// tests/arch/is-main.spec.ts fails if a script goes back to a raw comparison.
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * True when the module whose `import.meta.url` is `metaUrl` is the process's entry script.
 * Usage: `if (isMain(import.meta.url)) main();`
 */
export function isMain(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false; // `node -e`, a REPL, or an embedding host: never the entry script
  try {
    return realpathSync(resolve(argv1)) === realpathSync(fileURLToPath(metaUrl));
  } catch {
    return false; // argv[1] names no file on disk (e.g. a loader's virtual entry)
  }
}
