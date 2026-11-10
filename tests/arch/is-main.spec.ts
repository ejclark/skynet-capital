import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "@rstest/core";
import { isMain } from "../../scripts/is-main.mjs";

/**
 * #7046: a script's "was I run directly?" check compared `import.meta.url` with `process.argv[1]`
 * as raw strings. Node resolves the first through symlinks and leaves the second as typed, so run
 * through a symlinked path (every `/tmp` and `/var` path on macOS) the check failed, `main()` never
 * ran, and the script exited 0 having printed nothing. On 2026-11-07 that failed every local verify
 * on a Mac. scripts/is-main.mjs compares real paths. This spec proves that through a real symlink
 * (Linux reproduces it), and fails if a script goes back to a raw comparison.
 */

const ROOT = process.cwd();
const SCRIPTS = join(ROOT, "scripts");
const tmp = mkdtempSync(join(tmpdir(), "is-main-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("isMain — compares real paths", () => {
  const helper = join(SCRIPTS, "is-main.mjs");
  const url = pathToFileURL(helper).href;
  const link = join(tmp, "scripts-link");
  symlinkSync(SCRIPTS, link);

  it("is true for the entry file named by its real path", () => {
    expect(isMain(url, helper)).toBe(true);
  });

  it("is true for the entry file named through a symlinked folder", () => {
    expect(isMain(url, join(link, "is-main.mjs"))).toBe(true);
  });

  it("is false for a different entry file, a missing argv[1], and a path that names nothing", () => {
    expect(isMain(url, join(SCRIPTS, "code-lines.mjs"))).toBe(false);
    expect(isMain(url, "")).toBe(false);
    expect(isMain(url, join(tmp, "no-such-file.mjs"))).toBe(false);
  });

  it("runs a real script's main() when it is launched through a symlinked path", () => {
    // Before #7046 this exited 0 with empty output; issue-lint with no input prints its usage, exit 1.
    const run = spawnSync(process.execPath, [join(link, "issue-lint.mjs")], { encoding: "utf8" });
    expect(`${run.stdout}${run.stderr}`).toContain("issue-lint:");
    expect(run.status).toBe(1);
  });

  it("does not run main() when the script is imported as a module", () => {
    const entry = join(tmp, "importer.mjs");
    writeFileSync(
      entry,
      `import ${JSON.stringify(pathToFileURL(join(SCRIPTS, "issue-lint.mjs")).href)};\n`,
    );
    const run = spawnSync(process.execPath, [entry], { encoding: "utf8" });
    expect(`${run.stdout}${run.stderr}`).not.toContain("issue-lint:");
    expect(run.status).toBe(0);
  });
});

describe("the study harness on a pin older than scripts/is-main.mjs", () => {
  it("falls back to its own copy, names the fallback, and still follows a symlink", () => {
    // scripts/study/pin.mjs overlays only scripts/study/ onto an older commit (#4943), so the
    // harness reaches isMain through compat.mjs, which survives the helper's FILE being absent.
    const pin = join(tmp, "pin");
    mkdirSync(join(pin, "scripts/study"), { recursive: true });
    mkdirSync(join(pin, "scripts/crawl"), { recursive: true });
    copyFileSync(join(SCRIPTS, "study/compat.mjs"), join(pin, "scripts/study/compat.mjs"));
    copyFileSync(join(SCRIPTS, "crawl/steps.mjs"), join(pin, "scripts/crawl/steps.mjs"));
    writeFileSync(
      join(pin, "scripts/study/probe.mjs"),
      'import { FALLBACKS, isMain } from "./compat.mjs";\n' +
        "if (isMain(import.meta.url)) console.log(JSON.stringify(FALLBACKS));\n",
    );
    symlinkSync(pin, join(tmp, "pin-link"));
    const run = spawnSync(process.execPath, [join(tmp, "pin-link/scripts/study/probe.mjs")], {
      encoding: "utf8",
    });
    expect(run.stderr).toBe("");
    expect(JSON.parse(run.stdout)).toEqual([expect.stringMatching(/^isMain: .*#7046/)]);
  });
});

// A protected file (envelope.json) cannot be edited by an autonomous lane, so its swap boards the
// platter. Each one leaves this list in the same commit that swaps it; the spec fails while a
// listed file is already fixed, so the list only shrinks. The last seven were swapped together on
// the platter (#7046), so it is empty: a new protected script uses isMain from the start.
const AWAITING_PLATTER: string[] = [];

// Written out, not imported, for one reason each. RAW matches any equality between the two values,
// so these are named here, and the last describe proves each compares real paths on both sides.
const INLINED = {
  // pipeline.yml runs the base commit's copy of this file alone, so it imports node built-ins only.
  "scripts/envelope-scan.mjs":
    /realpathSync\(resolve\(process\.argv\[1\]\)\) === realpathSync\(fileURLToPath\(import\.meta\.url\)\)/,
};

/** A line that compares the entry path to this module's URL or path with a raw string equality. */
const RAW =
  /process\.argv\[1\][^\n]*[!=]==?[^\n]*import\.meta\.url|import\.meta\.url[^\n]*[!=]==?[^\n]*process\.argv\[1\]/;

function scriptFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === "node_modules") return [];
    const p = join(dir, e.name);
    if (e.isDirectory()) return scriptFiles(p);
    return /\.m?js$/.test(e.name) ? [relative(ROOT, p)] : [];
  });
}

describe("every script uses isMain for its direct-run check", () => {
  const raw = scriptFiles(SCRIPTS).filter((f) => RAW.test(readFileSync(join(ROOT, f), "utf8")));

  it("no script outside the platter list compares argv[1] to import.meta.url as raw strings", () => {
    expect(raw.filter((f) => !(AWAITING_PLATTER.includes(f) || f in INLINED))).toEqual([]);
  });

  it("every file on the platter list still needs its swap (remove it once swapped)", () => {
    expect(AWAITING_PLATTER.filter((f) => !raw.includes(f))).toEqual([]);
  });

  it("the pattern catches each raw form the swap replaced", () => {
    for (const line of [
      "if (import.meta.url === `file://${process.argv[1]}`) main();",
      "if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {",
      'if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {',
      "if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();",
      "if (process.argv[1] && dirname(fileURLToPath(import.meta.url)) === dirname(process.argv[1])) {",
    ])
      expect(RAW.test(line)).toBe(true);
    expect(RAW.test("if (isMain(import.meta.url)) main();")).toBe(false);
  });
});

describe("the protected scripts run their main() through a symlinked path (#7046)", () => {
  const link = join(tmp, "scripts-link-protected");
  symlinkSync(SCRIPTS, link);

  it("envelope-scan.mjs imports node built-ins only, since pipeline.yml runs the base copy alone", () => {
    // pipeline.yml's envelope gate copies scripts/envelope-scan.mjs (and envelope.json) out of the
    // base commit into a scratch folder and runs it there. A relative import would crash the gate,
    // which fails closed: no PR would arm. So this file writes isMain's comparison out in full.
    const source = readFileSync(join(SCRIPTS, "envelope-scan.mjs"), "utf8");
    const specifiers = [...source.matchAll(/^import\s[^;]*?from\s+"([^"]+)"/gms)].map(
      (m) => m[1] ?? "",
    );
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.filter((s) => !s.startsWith("node:"))).toEqual([]);
    expect(source).not.toMatch(/\bimport\(/);
  });

  it("each inlined direct-run check compares real paths on both sides", () => {
    for (const [file, shape] of Object.entries(INLINED)) {
      expect(readFileSync(join(ROOT, file), "utf8")).toMatch(shape);
    }
  });

  it("envelope-scan.mjs answers --check when launched through the symlink", () => {
    const run = spawnSync(
      process.execPath,
      [join(link, "envelope-scan.mjs"), "--check", "--", "envelope.json"],
      { cwd: ROOT, encoding: "utf8" },
    );
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual([expect.objectContaining({ path: "envelope.json" })]);
  });

  it("the Bash guard hook still refuses when launched through the symlink", () => {
    // Before #7046 a session whose path ran through a symlink got no guard at all: main() never
    // ran, so every command passed. `git stash` is refused outright (exit 2).
    const input = JSON.stringify({ tool_name: "Bash", tool_input: { command: "git stash" } });
    const run = spawnSync(process.execPath, [join(link, "hooks/guard-bash.mjs")], {
      input,
      encoding: "utf8",
    });
    expect(run.status).toBe(2);
  });
});
