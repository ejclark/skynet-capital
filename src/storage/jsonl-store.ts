import { appendFile, mkdir, open, readdir, readFile } from "node:fs/promises";
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
 * The newest entry in `file` (its last well-formed line), read in bounded chunks from the end
 * rather than loading and parsing the whole file — a "what's the latest row" lookup must not cost
 * what a full `list()` costs. Undefined if the file is missing, empty, or has nothing parseable.
 *
 * Starts at 8 KiB and doubles until a usable line turns up or the file start is reached, so the
 * read is bounded by the size of the trailing garbage, never by the file's full size. Walks the
 * chunk's lines backwards and skips one that fails to parse (a crash or full disk tears the
 * *newest* line first) rather than giving up on the first try — the same "one torn byte must not
 * poison the read" bar `readJsonlEntriesInto` holds for a full list.
 */
async function readLastJsonlEntry<T>(file: string): Promise<T | undefined> {
  let handle: Awaited<ReturnType<typeof open>>;
  try {
    handle = await open(file, "r");
  } catch {
    return undefined;
  }
  try {
    const { size } = await handle.stat();
    if (size === 0) return undefined;
    for (let chunkSize = Math.min(size, 8192); ; chunkSize = Math.min(size, chunkSize * 4)) {
      const start = size - chunkSize;
      const buffer = Buffer.alloc(chunkSize);
      await handle.read(buffer, 0, chunkSize, start);
      const parts = buffer.toString("utf8").split("\n");
      // parts[0] may be a line the chunk cut in half — only trust it once the chunk reaches byte 0.
      const candidates = (start === 0 ? parts : parts.slice(1))
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      for (let i = candidates.length - 1; i >= 0; i--) {
        try {
          return JSON.parse(candidates[i] as string) as T;
        } catch {
          process.emitWarning(`[jsonl-store] skipping malformed line near the end of ${file}`);
        }
      }
      if (start === 0) return undefined;
    }
  } finally {
    await handle.close();
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

  /** The newest entry appended for `key`, without reading the rest of its file (#4612 slice 7). */
  latest(key: string): Promise<T | undefined> {
    return readLastJsonlEntry<T>(this.fileFor(key));
  }
}
