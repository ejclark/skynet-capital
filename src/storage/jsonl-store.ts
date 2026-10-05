import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared file-level primitives for the "one append-only JSONL file per key under `dir`" pattern used
 * by `JsonlAuditStore`, `JsonlCycleReportStore`, and `JsonlHistoryStore`. Append-only keeps writes cheap
 * and the history immutable; each store keeps its own key→filename mapping (they differ slightly) and
 * composes these primitives rather than reimplementing append/read/list.
 */

/** Append one JSON-serialized entry as a line to `file`, creating `dir` first if needed. */
async function appendJsonlEntry(dir: string, file: string, entry: unknown): Promise<void> {
  await mkdir(dir, { recursive: true });
  await appendFile(file, `${JSON.stringify(entry)}\n`, "utf8");
}

/** All `.jsonl` files directly under `dir`; empty array if `dir` doesn't exist (or any other read error). */
async function listJsonlFiles(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    return names.filter((n) => n.endsWith(".jsonl")).map((n) => join(dir, n));
  } catch {
    return [];
  }
}

/**
 * Parse every non-empty line of `file` as JSON and append each to `entries`; appends nothing if
 * `file` doesn't exist (or any read error). A malformed line is skipped and logged rather than
 * thrown: a crash or a full disk mid-append leaves a torn final line, and that newest line is exactly
 * what history rehydration reads at boot — one torn byte must not fail a startup, a profile page, or
 * a board-wide metric.
 *
 * It appends into the caller's array one row at a time rather than returning a batch to spread:
 * `entries.push(...rows)` passes every row as an argument, and V8 throws RangeError past ~121k of
 * them. One history file that long made every boot exit 1 — a crash loop (#4612 slice 3, #4615).
 */
async function readJsonlEntriesInto<T>(file: string, entries: T[]): Promise<void> {
  let contents: string;
  try {
    contents = await readFile(file, "utf8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    if (line.length === 0) continue;
    try {
      entries.push(JSON.parse(line) as T);
    } catch {
      // `process.emitWarning`, not `console` — this is library code (the repo reserves console for
      // scripts), and a skipped line must still be *visible*: silent data loss is the failure mode
      // this guard exists to avoid, not one it should introduce.
      process.emitWarning(`[jsonl-store] skipping malformed line in ${file}`);
    }
  }
}

/**
 * One append-only JSONL file per key under `dir` — the shape shared by `JsonlAuditStore`,
 * `JsonlCycleReportStore`, and `JsonlHistoryStore`. Each of those keeps its own public API
 * (`record`/`save`, its own key-extraction) and composes this for the file-level mechanics, since
 * `fileFor` differs slightly between them (e.g. history sanitizes the key for filesystem safety).
 */
export class JsonlKeyedStore<T> {
  constructor(
    private readonly dir: string,
    private readonly fileFor: (key: string) => string,
  ) {}

  async append(key: string, entry: T): Promise<void> {
    await appendJsonlEntry(this.dir, this.fileFor(key), entry);
  }

  async list(key?: string): Promise<T[]> {
    const files = key ? [this.fileFor(key)] : await listJsonlFiles(this.dir);
    const entries: T[] = [];
    for (const file of files) {
      await readJsonlEntriesInto(file, entries);
    }
    return entries;
  }
}
