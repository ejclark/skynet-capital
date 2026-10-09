// The pure half of scripts/study/pin.mjs (#4943) — argument parsing, the harness overlay's
// manifest, the install-clone fallback order, and the "may I touch this directory?" verdicts.
// pin.mjs measures the disk and runs the commands; every decision it acts on is made here, so it
// is specced without a git repo or a filesystem (tests/scripts/study-pin.spec.ts).
//
// Area-agnostic: it knows commits, directories and the harness folder, never a world or a surface.

import { createHash } from "node:crypto";

/** The one folder a pinned run takes from today's checkout. Everything else is the pin's own. */
export const HARNESS = "scripts/study/";

const USAGE =
  "usage: pin.mjs prepare --commit <sha> --dir <abs dir>  |  pin.mjs remove --dir <abs dir>";

/**
 * `prepare --commit <sha> --dir <abs>` or `remove --dir <abs>`. A commit is a hex object name
 * (7–40 chars) — never a branch, so a pin cannot move under a run. The directory is absolute, so
 * the worktree lands where the caller said whatever the working directory is.
 * @param {string[]} argv  process.argv.slice(2)
 */
export function pinArgs(argv) {
  const [command, ...rest] = argv;
  if (command !== "prepare" && command !== "remove") throw new Error(USAGE);
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    const [flag, value] = [rest[i], rest[i + 1]];
    if (flag !== "--commit" && flag !== "--dir") throw new Error(`pin: unknown flag ${flag}`);
    if (!value || value.startsWith("--")) throw new Error(`pin: ${flag} needs a value`);
    if (flags[flag]) throw new Error(`pin: ${flag} given twice`);
    flags[flag] = value;
  }
  const dir = flags["--dir"];
  if (!dir) throw new Error(`pin: --dir is required\n${USAGE}`);
  if (!dir.startsWith("/")) throw new Error(`pin: --dir must be absolute (got ${dir})`);
  const clean = dir.length > 1 ? dir.replace(/\/+$/, "") : dir;
  if (clean === "/") throw new Error("pin: --dir cannot be the filesystem root");
  if (command === "remove") {
    if (flags["--commit"]) throw new Error("pin: remove takes --dir only");
    return { command, dir: clean };
  }
  const commit = flags["--commit"];
  if (!commit) throw new Error(`pin: prepare needs --commit\n${USAGE}`);
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error(`pin: --commit must be a hex sha, not a ref (got ${commit})`);
  }
  return { command, commit: commit.toLowerCase(), dir: clean };
}

/** Is this repo-relative path part of the harness overlay? Only files under `scripts/study/`,
 *  never a path that climbs out of it, and never OS litter. */
export function isHarnessPath(path) {
  if (!path.startsWith(HARNESS) || path.length === HARNESS.length) return false;
  const parts = path.split("/");
  if (parts.some((p) => p === ".." || p === "." || p === "")) return false;
  return parts.at(-1) !== ".DS_Store";
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/**
 * The overlay's manifest: every harness file with its sha256, sorted by path, and one `tree`
 * hash over the lot — so two pinned runs can say in one line whether they ran the same harness.
 * Anything outside the harness is refused, not filtered: a caller that offered it has a bug.
 * @param {{path: string, sha256: string}[]} files
 */
export function overlayManifest(files) {
  const outside = files.filter((f) => !isHarnessPath(f.path)).map((f) => f.path);
  if (outside.length > 0) throw new Error(`pin: not harness files: ${outside.join(", ")}`);
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].path === sorted[i - 1].path) throw new Error(`pin: ${sorted[i].path} twice`);
  }
  if (sorted.length === 0) throw new Error("pin: the harness overlay is empty");
  const tree = sha256(sorted.map((f) => `${f.sha256}  ${f.path}\n`).join(""));
  return { files: sorted.map((f) => ({ path: f.path, sha256: f.sha256 })), tree };
}

/**
 * How to give the pin its own install, best first: an APFS clone (copy-on-write, near-instant),
 * a reflink where the filesystem has one, then a plain copy. Never a symlink — an `npm ci` run
 * through a linked install empties the install it points at (docs/LESSONS.md, 2026-10-09).
 */
export function cloneAttempts(from, to) {
  return [
    ["cp", "-cR", from, to],
    ["cp", "-R", "--reflink=auto", from, to],
    ["cp", "-R", from, to],
  ];
}

/**
 * May `prepare` use this directory? It creates a missing one, reuses a worktree already checked
 * out at the pin (a re-run), and refuses anything else — a directory holding other work is never
 * overwritten.
 * @param {{exists: boolean, worktreeHead?: string}} seen  worktreeHead: the HEAD of a registered
 *   worktree at exactly this path, if there is one
 * @param {string} commit  the full sha the pin resolves to
 */
export function prepareVerdict(seen, commit) {
  if (!seen.exists) return { action: "create" };
  if (!seen.worktreeHead) {
    return { action: "refuse", why: "it exists and is not a worktree of this repo" };
  }
  if (seen.worktreeHead.toLowerCase() !== commit.toLowerCase()) {
    return { action: "refuse", why: `it is a worktree at ${seen.worktreeHead.slice(0, 12)}` };
  }
  return { action: "reuse" };
}

/**
 * May `remove` delete this directory? Only a registered worktree of this repo that `prepare`
 * made (it carries `.study-pin.json`), and never the checkout running the command.
 * @param {{registered: boolean, isMain: boolean, isSelf: boolean, hasPinRecord: boolean}} seen
 */
export function removeVerdict(seen) {
  if (!seen.registered) return { ok: false, why: "it is not a worktree of this repo" };
  if (seen.isMain) return { ok: false, why: "it is the repo's main checkout" };
  if (seen.isSelf) return { ok: false, why: "it is the checkout running this command" };
  if (!seen.hasPinRecord)
    return { ok: false, why: "it has no .study-pin.json — pin.mjs did not make it" };
  return { ok: true };
}

/**
 * The worktree HEADs `git worktree list --porcelain` reports, by path.
 * @param {string} porcelain
 * @returns {Map<string, {head?: string, main: boolean}>}
 */
export function worktreesFrom(porcelain) {
  const out = new Map();
  let first = true;
  for (const block of porcelain.split(/\n\n+/)) {
    const lines = block.split("\n").filter(Boolean);
    const path = lines.find((l) => l.startsWith("worktree "))?.slice("worktree ".length);
    if (!path) continue;
    const head = lines.find((l) => l.startsWith("HEAD "))?.slice("HEAD ".length);
    out.set(path, { head, main: first });
    first = false;
  }
  return out;
}
