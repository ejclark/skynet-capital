import { createReadStream } from "node:fs";
import { appendFile, mkdir, open, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import { createGunzip, gunzip } from "node:zlib";
import { archivesOf, rotateJsonlFile, withoutGzippedTwins } from "./jsonl-rotation.js";

const gunzipAsync = promisify(gunzip);
const isGzipped = (file: string): boolean => file.endsWith(".gz");

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

/**
 * All `.jsonl` and rotated `.jsonl.gz` files directly under `dir`, sorted so each key's archives
 * come before its active file (`jsonl-rotation.ts`); empty array if `dir` doesn't exist (or any
 * other read error).
 */
async function listJsonlFiles(dir: string): Promise<string[]> {
  try {
    const names = await readdir(dir);
    const files = names.filter((n) => n.endsWith(".jsonl") || n.endsWith(".jsonl.gz")).sort();
    return withoutGzippedTwins(files.map((n) => join(dir, n)));
  } catch {
    return [];
  }
}

/** A whole JSONL file as text, gunzipped when it is a rotated `.gz` archive. */
async function readJsonlText(file: string): Promise<string> {
  if (!isGzipped(file)) return readFile(file, "utf8");
  return (await gunzipAsync(await readFile(file))).toString("utf8");
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
    contents = await readJsonlText(file);
  } catch (e) {
    // A missing file is the normal empty case; a corrupt archive is history that can't be read.
    if (isGzipped(file)) process.emitWarning(`[jsonl-store] unreadable archive ${file}: ${e}`);
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
 * Every well-formed entry of `file`, one line at a time — the whole file is never held in memory.
 * `readJsonlEntriesInto` reads the file as one string and parses all of it; the bots' audit trail
 * outgrew a 512 MB VM that way (32 MB of JSONL on 2026-10-09, a boot-time OOM crash loop by
 * 2026-10-22, #5992 thread), so a reader that only wants some of the rows streams instead. Same
 * torn-line tolerance; a missing file yields nothing. A rotated `.gz` archive is gunzipped on the
 * way through, and a corrupt one ends with a warning after its last readable line.
 */
async function* streamJsonlEntries<T>(file: string): AsyncGenerator<T> {
  const input = createReadStream(file);
  const opened = new Promise<boolean>((resolve) => {
    input.once("open", () => resolve(true));
    input.once("error", () => resolve(false));
  });
  if (!(await opened)) return;
  const source = isGzipped(file) ? input.pipe(createGunzip()) : input;
  const lines = createInterface({ input: source, crlfDelay: Number.POSITIVE_INFINITY });
  try {
    for await (const line of lines) {
      if (line.length === 0) continue;
      let entry: T;
      try {
        entry = JSON.parse(line) as T;
      } catch {
        process.emitWarning(`[jsonl-store] skipping malformed line in ${file}`);
        continue;
      }
      yield entry;
    }
  } catch (e) {
    process.emitWarning(`[jsonl-store] unreadable archive ${file}: ${e}`);
  } finally {
    lines.close();
    if (source !== input) source.destroy();
    input.destroy();
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

/** What `readJsonlEntriesSince` hands back: the new rows, where to resume, and whether to restart. */
export interface JsonlTail<T> {
  readonly entries: T[];
  /** Byte offset just past the last complete line read — the next call's `offset`. */
  readonly offset: number;
  /** True when the file is now shorter than `offset`: it was replaced, so fold it again from 0. */
  readonly reset: boolean;
}

/**
 * The entries appended to `file` since byte `offset` — the append-aware read a running fold uses
 * instead of re-parsing a whole growing ledger per request (#4612 slice 7, #4619). Only complete
 * lines count: a line still being written (no trailing newline yet) is left for the next call, so
 * `offset` never lands mid-line. A missing file reads as empty; a shrunken one as `reset`. Same
 * torn-line tolerance as `readJsonlEntriesInto`.
 */
async function readJsonlEntriesSince<T>(file: string, offset: number): Promise<JsonlTail<T>> {
  let handle: Awaited<ReturnType<typeof open>>;
  try {
    handle = await open(file, "r");
  } catch {
    return { entries: [], offset: 0, reset: offset > 0 };
  }
  try {
    const { size } = await handle.stat();
    if (size < offset) return { entries: [], offset: 0, reset: true };
    if (size === offset) return { entries: [], offset, reset: false };
    const buffer = Buffer.alloc(size - offset);
    await handle.read(buffer, 0, buffer.length, offset);
    const complete = buffer.lastIndexOf(0x0a) + 1;
    const entries: T[] = [];
    for (const line of buffer.toString("utf8", 0, complete).split("\n")) {
      if (line.length === 0) continue;
      try {
        entries.push(JSON.parse(line) as T);
      } catch {
        process.emitWarning(`[jsonl-store] skipping malformed line in ${file}`);
      }
    }
    return { entries, offset: offset + complete, reset: false };
  } finally {
    await handle.close();
  }
}

/**
 * One append-only JSONL file per key under `dir` — the shape shared by `JsonlAuditStore`,
 * `JsonlCycleReportStore`, and `JsonlHistoryStore`. Each of those keeps its own public API
 * (`record`/`save`, its own key-extraction) and composes this for the file-level mechanics, since
 * `fileFor` differs slightly between them (e.g. history sanitizes the key for filesystem safety).
 *
 * With `rotateAtBytes`, a key's file is closed and gzipped once it reaches that size and a fresh
 * one started (`jsonl-rotation.ts`); `list`/`stream` read the archives oldest-first, then the
 * active file. `since`/`latest` read only the active file. Appends per key are serialized so a
 * rotation never races a write into the file being compressed.
 */
export class JsonlKeyedStore<T> {
  private readonly tails = new Map<string, Promise<void>>();

  constructor(
    private readonly dir: string,
    private readonly fileFor: (key: string) => string,
    private readonly opts: { readonly rotateAtBytes?: number } = {},
  ) {}

  append(key: string, entry: T): Promise<void> {
    const cap = this.opts.rotateAtBytes;
    if (cap === undefined) return appendJsonlEntry(this.dir, this.fileFor(key), entry);
    const write = (this.tails.get(key) ?? Promise.resolve()).then(() =>
      this.rotateThenAppend(this.fileFor(key), cap, entry),
    );
    // A failed write must not wedge the queue behind it.
    this.tails.set(
      key,
      write.catch(() => undefined),
    );
    return write;
  }

  private async rotateThenAppend(file: string, cap: number, entry: T): Promise<void> {
    const size = (await stat(file).catch(() => undefined))?.size ?? 0;
    if (size >= cap) {
      // A failed rotation must not cost the record: warn and keep appending to the open file.
      await rotateJsonlFile(file).catch((e) =>
        process.emitWarning(`[jsonl-store] could not rotate ${file}: ${e}`),
      );
    }
    await appendJsonlEntry(this.dir, file, entry);
  }

  /** The files holding `key`'s entries, oldest first: its rotated archives (if any), then the active file. */
  private async filesFor(key: string): Promise<string[]> {
    const file = this.fileFor(key);
    return this.opts.rotateAtBytes === undefined ? [file] : [...(await archivesOf(file)), file];
  }

  async list(key?: string): Promise<T[]> {
    const files = key ? await this.filesFor(key) : await listJsonlFiles(this.dir);
    const entries: T[] = [];
    for (const file of files) {
      await readJsonlEntriesInto(file, entries);
    }
    return entries;
  }

  /** `list`, one entry at a time — for a reader that keeps only some rows (see `streamJsonlEntries`). */
  async *stream(key?: string): AsyncGenerator<T> {
    const files = key ? await this.filesFor(key) : await listJsonlFiles(this.dir);
    for (const file of files) yield* streamJsonlEntries<T>(file);
  }

  /** The entries appended for `key` since byte `offset` (see `readJsonlEntriesSince`). */
  since(key: string, offset: number): Promise<JsonlTail<T>> {
    return readJsonlEntriesSince<T>(this.fileFor(key), offset);
  }

  /** The newest entry appended for `key`, without reading the rest of its file (#4612 slice 7). */
  latest(key: string): Promise<T | undefined> {
    return readLastJsonlEntry<T>(this.fileFor(key));
  }
}
