// Reading a member-study round's files (#4943) — shared by grade.mjs and readout.mjs. The layout,
// the finding record and the class vocabulary are round-contract.mjs's; this only reads them.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseSessionDir, SESSIONS } from "./round-contract.mjs";

export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** JSON lines, blanks skipped; a bad line throws naming the file and line. */
export function readJsonl(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line, i) => [line.trim(), i + 1])
    .filter(([line]) => line)
    .map(([line, n]) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`${path}:${n} is not JSON`);
      }
    });
}

/** The file's JSON, or `fallback` when the file is absent. */
export const readOptional = (path, fallback) => (existsSync(path) ? readJson(path) : fallback);

/** A list file: a JSON array, or one entry per line (blanks and #comments dropped). */
export function readList(path) {
  const raw = readFileSync(path, "utf8").trim();
  if (raw.startsWith("[")) return JSON.parse(raw);
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/**
 * Every member session of a round: {dir, rel, member, world, viewport, task, run, summary}, in path
 * order. A summary.json under the sessions folder but outside the contract's layout throws — a
 * session the readers cannot place means the writer and the readers no longer agree.
 */
export function findSessions(round) {
  const root = join(round, SESSIONS);
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true })
    .map(String)
    .filter((f) => f === "summary.json" || f.endsWith(`${sep}summary.json`))
    .sort()
    .map((f) => {
      const dir = join(root, f.slice(0, -"summary.json".length));
      const rel = relative(round, dir);
      const parts = parseSessionDir(rel);
      if (!parts) {
        throw new Error(
          `${rel} is not a session folder (${SESSIONS}/<member>/<world>/<viewport>/<task>/run-<n>)`,
        );
      }
      return { dir, rel, ...parts, summary: readJson(join(root, f)) };
    });
}
