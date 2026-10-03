import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Parse the research corpus once per process, not once per request.
 *
 * Why: `/api/research` re-read and re-parsed every markdown file under docs/research (1,334 files,
 * 35 MB on 2026-10-01) four separate ways per request — the listing, the ledger calls, the ledger
 * digests, the symbol cards — allocating ~250 MB of short-lived strings each time. V8 grows the
 * heap rather than collect promptly, so ONE visit to /app/research took the dashboard from 115 MB
 * to 780 MB RSS, and the 512 MB Fly machine was OOM-killed whenever a member bounced through it.
 * What each parse KEEPS is tiny (slugs, titles, a few call rows), so remembering it costs ~nothing.
 *
 * Invalidation is a fingerprint, not a TTL: every shelved file's name, size and mtime. In
 * production the corpus is baked into the image (.dockerignore ships docs/research) and never
 * changes, so it parses once; in dev an edited doc shows up on the next request; specs that write
 * temp corpora get fresh answers. One entry per name — a different root simply replaces it, so a
 * spec run cycling through temp dirs cannot grow this without bound.
 */

/** The directories the shelf reads (see `listResearch`): studies, weekly studies, event ledgers,
 *  and the forward-test register's fragments (see `composeRegister`). */
const SHELVED_DIRS = ["", "weeks", "events", "forward-tests"] as const;

/** Cheap stand-in for the corpus contents: stat calls only, no file reads. */
export function corpusFingerprint(root: string): string {
  const parts: string[] = [];
  for (const sub of SHELVED_DIRS) {
    const dir = join(root, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const s = statSync(join(dir, f));
      parts.push(`${sub}/${f}:${s.size}:${s.mtimeMs}`);
    }
  }
  return parts.join("|");
}

const memo = new Map<string, { root: string; fingerprint: string; value: unknown }>();

/** `compute()` once per (name, root, corpus state); the cached value is shared, so treat it as read-only. */
export function memoByCorpus<T>(name: string, root: string, compute: () => T): T {
  const fingerprint = corpusFingerprint(root);
  const hit = memo.get(name);
  if (hit && hit.root === root && hit.fingerprint === fingerprint) return hit.value as T;
  // structuredClone detaches every string from the file it was matched out of. A regex match is a
  // V8 *sliced* string that keeps its whole parent alive, so caching a 40-char title raw pinned the
  // entire markdown file — the memo retained ~170 MB, i.e. the whole corpus (measured 2026-10-02).
  const value = structuredClone(compute());
  memo.set(name, { root, fingerprint, value });
  return value;
}
