/**
 * SCREENSHOTS ATTACHED IN MONEYPENNY'S CHAT (#6007 slice 1) — one file per screenshot plus a small
 * JSON index (id, the attacher's opaque member id, type, bytes, time), on the volume under the
 * derived-store root (`DERIVED_STORES` in `runtime/volume-guard.ts`, so no `fly.toml` line).
 *
 * WHO SEES ONE (Eric, 2026-11-10): any signed-in member, the same as account and trade data —
 * "screenshots of money penny are not private". So `load` takes an id only and checks no owner;
 * the bar is the signed-in session the route checks. Never public, never before sign-in, and never
 * copied to the public repo: the `/feedback` image path (`feedback-images.ts`) commits to GitHub,
 * so this store shares its shape rules, never its upload.
 *
 * THE CAPS DO THE CLEAN-UP, not an age: 1.5 MB an image (the route's check), 20 MB a member and
 * 100 MB in all, oldest removed first. The volume is 1 GB shared by every store, so the whole-store
 * cap is what keeps one feature from starving the guest list.
 *
 * Writes are serialized in-process (one server owns the volume). The image is written first and
 * the index after, so a failed write (a full disk) leaves the index as it was and removes nothing.
 */
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { storePath } from "../runtime/volume-guard.js";
import { JsonFileStore } from "../storage/json-file-store.js";

export type ScreenshotType = "image/png" | "image/jpeg";

export interface ScreenshotEntry {
  readonly id: string;
  readonly opaqueMemberId: string;
  readonly type: ScreenshotType;
  readonly bytes: number;
  readonly at: string;
}

export interface StoredScreenshot {
  readonly type: ScreenshotType;
  readonly data: Buffer;
}

/** Where chat screenshots are kept. Interface-first, so route specs stay I/O-free. */
export interface CompanionScreenshotStore {
  /** Keep one screenshot and return its id, removing the oldest first when a cap would be passed.
   *  Throws when the write itself fails (a full disk, an I/O error): nothing is kept then. */
  save(opaqueMemberId: string, type: ScreenshotType, data: Buffer): Promise<{ id: string }>;
  /** The screenshot, whoever attached it — or undefined when the id is unknown or was removed. */
  load(id: string): Promise<StoredScreenshot | undefined>;
}

export const MAX_SCREENSHOT_BYTES_PER_MEMBER = 20 * 1_048_576;
export const MAX_SCREENSHOT_BYTES_TOTAL = 100 * 1_048_576;

/** 32 lowercase hex characters — 128 random bits, so an id cannot be guessed or walked. */
export const SCREENSHOT_ID = /^[0-9a-f]{32}$/;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

/** The type the bytes' own header names (criterion 11), never the type the client declared. */
export function sniffScreenshotType(data: Buffer): ScreenshotType | undefined {
  if (data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return "image/png";
  if (data.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) return "image/jpeg";
  return undefined;
}

/**
 * Which entries to remove so one more of `incoming` bytes fits: the member's own oldest until they
 * are under their cap, then the oldest across everyone until the store is under its cap. Pure, so
 * the two caps are specified without a disk.
 */
export function evictionsFor(
  entries: readonly ScreenshotEntry[],
  member: string,
  incoming: number,
  caps = { perMember: MAX_SCREENSHOT_BYTES_PER_MEMBER, total: MAX_SCREENSHOT_BYTES_TOTAL },
): readonly ScreenshotEntry[] {
  const oldestFirst = [...entries].sort((a, b) => a.at.localeCompare(b.at));
  const removed = new Set<ScreenshotEntry>();
  let mine = oldestFirst
    .filter((e) => e.opaqueMemberId === member)
    .reduce((s, e) => s + e.bytes, 0);
  for (const e of oldestFirst) {
    if (mine + incoming <= caps.perMember) break;
    if (e.opaqueMemberId !== member) continue;
    removed.add(e);
    mine -= e.bytes;
  }
  let total = oldestFirst.filter((e) => !removed.has(e)).reduce((s, e) => s + e.bytes, 0);
  for (const e of oldestFirst) {
    if (total + incoming <= caps.total) break;
    if (removed.has(e)) continue;
    removed.add(e);
    total -= e.bytes;
  }
  return oldestFirst.filter((e) => removed.has(e));
}

function parseIndex(raw: unknown): ScreenshotEntry[] | undefined {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { entries?: unknown }).entries))
    return undefined;
  return ((raw as { entries: unknown[] }).entries ?? []).filter(
    (e): e is ScreenshotEntry =>
      !!e &&
      typeof e === "object" &&
      typeof (e as ScreenshotEntry).id === "string" &&
      SCREENSHOT_ID.test((e as ScreenshotEntry).id) &&
      typeof (e as ScreenshotEntry).opaqueMemberId === "string" &&
      ((e as ScreenshotEntry).type === "image/png" ||
        (e as ScreenshotEntry).type === "image/jpeg") &&
      typeof (e as ScreenshotEntry).bytes === "number" &&
      typeof (e as ScreenshotEntry).at === "string",
  );
}

const fileFor = (dir: string, entry: Pick<ScreenshotEntry, "id" | "type">): string =>
  join(dir, `${entry.id}.${entry.type === "image/png" ? "png" : "jpg"}`);

/** File-backed store: `<dir>/<id>.png|jpg` plus `<dir>/index.json`. */
export class FileCompanionScreenshotStore implements CompanionScreenshotStore {
  private readonly index: JsonFileStore<{ entries: ScreenshotEntry[] }>;
  private entries: ScreenshotEntry[] | undefined;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly dir: string,
    private readonly caps = {
      perMember: MAX_SCREENSHOT_BYTES_PER_MEMBER,
      total: MAX_SCREENSHOT_BYTES_TOTAL,
    },
    onReadError: (message: string) => void = (m) => process.emitWarning(m),
  ) {
    this.index = new JsonFileStore({
      path: join(dir, "index.json"),
      parse: (raw) => {
        const entries = parseIndex(raw);
        return entries ? { entries } : undefined;
      },
      empty: { entries: [] },
      label: "companion-screenshots",
      onReadError,
    });
  }

  private loaded(): ScreenshotEntry[] {
    this.entries ??= [...this.index.load().entries];
    return this.entries;
  }

  save(opaqueMemberId: string, type: ScreenshotType, data: Buffer): Promise<{ id: string }> {
    const run = this.queue.then(() => this.saveNow(opaqueMemberId, type, data));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async saveNow(
    opaqueMemberId: string,
    type: ScreenshotType,
    data: Buffer,
  ): Promise<{ id: string }> {
    const entries = this.loaded();
    const entry: ScreenshotEntry = {
      id: randomBytes(16).toString("hex"),
      opaqueMemberId,
      type,
      bytes: data.length,
      at: new Date().toISOString(),
    };
    const evicted = evictionsFor(entries, opaqueMemberId, data.length, this.caps);
    const kept = [...entries.filter((e) => !evicted.includes(e)), entry];
    try {
      await mkdir(this.dir, { recursive: true });
      await writeFile(fileFor(this.dir, entry), data);
      this.index.write({ entries: kept });
    } catch (error) {
      // A partly written image is removed with the failure; the index still names only what is kept.
      await unlink(fileFor(this.dir, entry)).catch(() => undefined);
      throw error;
    }
    this.entries = kept;
    for (const gone of evicted) await unlink(fileFor(this.dir, gone)).catch(() => undefined);
    return { id: entry.id };
  }

  async load(id: string): Promise<StoredScreenshot | undefined> {
    if (!SCREENSHOT_ID.test(id)) return undefined;
    const entry = this.loaded().find((e) => e.id === id);
    if (!entry) return undefined;
    try {
      return { type: entry.type, data: await readFile(fileFor(this.dir, entry)) };
    } catch {
      return undefined; // indexed but gone from disk — the same as removed
    }
  }
}

/** Build the store under the derived-store root (`SKYNET_COMPANION_SCREENSHOTS_DIR` overrides). */
export function createCompanionScreenshotStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): CompanionScreenshotStore {
  return new FileCompanionScreenshotStore(
    storePath(env, "SKYNET_COMPANION_SCREENSHOTS_DIR"),
    undefined,
    onReadError,
  );
}
