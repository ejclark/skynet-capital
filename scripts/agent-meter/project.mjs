// Which transcript folders are this checkout's (#6689). Claude Code keeps a checkout's sessions under
// ~/.claude/projects/<folder>, the folder being the checkout's absolute path with every character
// that is not a letter or digit turned to "-". The meter used to fix that name to the laptop's
// checkout, so a cloud session (where sessions run by default) matched no folder and its sections
// printed "none in the window", the same line as a quiet week. The name now comes from the checkout
// the script sits in, and a reader that finds no folder says unknown, never zero.
//
// The checkout is the main one, read through git's common dir, so the meter run from a worktree
// still finds the main folder; each worktree's folder is the main name plus a suffix (a worktree
// under .claude/worktrees/x is "<main>--claude-worktrees-x"), so the prefix match keeps them.
// AGENT_CHECKOUT_DIR is the seam a spec uses to name a checkout that is not this one.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_CHECKOUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The folder name Claude Code gives a checkout's transcripts. */
export function projectFolder(checkout) {
  return checkout.replace(/[^a-zA-Z0-9]/g, "-");
}

/** The main checkout holding this script, or the one AGENT_CHECKOUT_DIR names. */
export function checkoutDir() {
  if (process.env.AGENT_CHECKOUT_DIR) return resolve(process.env.AGENT_CHECKOUT_DIR);
  try {
    const common = execFileSync(
      "git",
      ["-C", SCRIPT_CHECKOUT, "rev-parse", "--path-format=absolute", "--git-common-dir"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    // A checkout's common dir is <checkout>/.git; anything else (a bare repo) names no checkout.
    if (common.endsWith("/.git")) return dirname(common);
  } catch {
    // Not a git checkout (a copied script): the folder it sits in is the best name there is.
  }
  return SCRIPT_CHECKOUT;
}

/** This checkout's transcript folder name. */
export function currentProject() {
  return projectFolder(checkoutDir());
}

/** The checkout's own folder, or one of its worktrees'; never a sibling that only shares a prefix. */
export function isProjectFolder(name, project) {
  return name === project || name.startsWith(`${project}-`);
}

/** Every folder under `projectsDir` that holds this checkout's transcripts. */
export function projectFolders(projectsDir, project) {
  if (!existsSync(projectsDir)) return [];
  return readdirSync(projectsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isProjectFolder(e.name, project))
    .map((e) => join(projectsDir, e.name));
}

/**
 * The line every transcript-reading section prints when no folder matched. It can reach a public
 * comment (loop-check posts the worker's oracle from a runner), so it names no home path.
 */
export const NO_TRANSCRIPTS =
  "unknown: no transcripts for this checkout on this machine; run it where its sessions ran";
