import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Replace `path` with `data` so that a reader — or the next boot — sees the old file or the new
 * one, never half of either: write a sibling `.tmp`, then rename it over the target (a rename
 * within one directory is atomic on POSIX filesystems). Creates the directory first.
 *
 * Why it is shared: an OOM kill or a full volume mid-`writeFileSync` truncates the file it was
 * writing. For the sealed member stores (participants, the saved GitHub token) that is a corrupt
 * credential file on the next boot, on any host (#4612 slice 9, the audit's host-coupling table).
 * `JsonFileStore` already wrote this way; this is that pattern, once.
 */
export function writeFileAtomicSync(path: string, data: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data, "utf8");
  renameSync(tmp, path);
}
