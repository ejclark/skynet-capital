import { createReadStream, createWriteStream } from "node:fs";
import { open, readdir, rename, rm, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

/**
 * Size-capped rotation for an append-only JSONL file: close it, gzip it in place, start a fresh
 * one — and delete no history (#6006). The bots' audit trail grew without bound on a 1 GB volume
 * shared with the SQLite stores (32 MB by 2026-10-09). Pruning old files is a retention call
 * reserved for Eric (`docs/IDEAS.md`, *Eric's governance calls*), and `decisions.db` is a lossy
 * projection of the trail, so this only compresses: JSONL gzips roughly 10×.
 *
 * `<stem>.jsonl` rotates to `<stem>.<UTC stamp>.jsonl`, which is then gzipped to
 * `<stem>.<UTC stamp>.jsonl.gz`. The stamp sorts lexically in time order, so a reader that sorts
 * the archives and reads the active file last sees every record in the order it was written.
 */

const STAMP = String.raw`\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z`;

const stem = (file: string): string => basename(file, ".jsonl");
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every closed archive of `file`, plain or gzipped, unsorted and unfiltered — empty if none. */
async function stampedFiles(file: string): Promise<string[]> {
  const pattern = new RegExp(`^${escapeRegex(stem(file))}\\.${STAMP}\\.jsonl(\\.gz)?$`);
  try {
    const names = await readdir(dirname(file));
    return names.filter((n) => pattern.test(n)).map((n) => join(dirname(file), n));
  } catch {
    return [];
  }
}

/**
 * The newest archive's stamp in epoch ms, or -Infinity with none. A new archive is always stamped
 * after it, so two rotations in one millisecond (or a clock stepped backwards) can neither
 * overwrite an archive nor sort out of write order.
 */
function newestStampMs(archives: readonly string[]): number {
  let newest = Number.NEGATIVE_INFINITY;
  for (const f of archives) {
    const m = /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.jsonl(\.gz)?$/.exec(
      basename(f),
    );
    if (m) newest = Math.max(newest, Date.parse(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`));
  }
  return newest;
}

/**
 * Drop a plain `x.jsonl` whose `x.jsonl.gz` also exists — a crash between the gzip landing and
 * the plain copy's removal leaves both, and reading both would double every row. The `.gz` only
 * ever appears by rename after a complete, fsynced write, so it is the trustworthy copy.
 */
export function withoutGzippedTwins(files: readonly string[]): string[] {
  const present = new Set(files);
  return files.filter((f) => !(f.endsWith(".jsonl") && present.has(`${f}.gz`)));
}

/** `file`'s closed archives in the order they were written (oldest first), each read once. */
export async function archivesOf(file: string): Promise<string[]> {
  return withoutGzippedTwins(await stampedFiles(file)).sort();
}

/**
 * Gzip `plain` to `plain.gz` via a temp file, fsync it, rename it into place, then remove the
 * plain copy. On any failure the plain file is left untouched (still readable, retried on the
 * next rotation) and a warning is emitted — a failed compression must never cost a record.
 */
async function gzipInPlace(plain: string): Promise<void> {
  const gz = `${plain}.gz`;
  const tmp = `${gz}.tmp`;
  try {
    await pipeline(createReadStream(plain), createGzip(), createWriteStream(tmp));
    const handle = await open(tmp, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tmp, gz);
    await unlink(plain);
  } catch (e) {
    await rm(tmp, { force: true });
    process.emitWarning(`[jsonl-rotation] could not gzip ${plain}: ${(e as Error).message}`);
  }
}

/**
 * Close `file` (rename it to a stamped archive) and gzip every plain archive it has — the new
 * one, plus any a crash or a full disk left uncompressed last time. The next append to `file`
 * starts a fresh one. A plain archive whose `.gz` already landed only needs its plain copy removed.
 */
export async function rotateJsonlFile(file: string, now: Date = new Date()): Promise<void> {
  const stamp = new Date(Math.max(now.getTime(), newestStampMs(await stampedFiles(file)) + 1));
  const name = `${stem(file)}.${stamp.toISOString().replace(/[:.]/g, "-")}.jsonl`;
  await rename(file, join(dirname(file), name));
  const all = await stampedFiles(file);
  const present = new Set(all);
  for (const plain of all.filter((f) => f.endsWith(".jsonl"))) {
    if (present.has(`${plain}.gz`)) await unlink(plain).catch(() => undefined);
    else await gzipInPlace(plain);
  }
}
