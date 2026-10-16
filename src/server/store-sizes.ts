import { readdirSync, statfsSync, statSync } from "node:fs";
import { join } from "node:path";
import { PERSISTED_STORES } from "../runtime/volume-guard.js";

/**
 * How big each durable store is, and how much room the volume has left (#4618, slice 6 of #4612).
 * The stability audit had to *estimate* production's sizes — history lines, decisions.db, free
 * volume space — because nothing ever logged them and Fly secrets/volumes are not readable from a
 * session. One line at boot and one an hour turns those estimates into facts in the log buffer.
 *
 * Hourly, not every minute: the stores grow on a 5-minute sampler, so a minute's line would be 59
 * repeats; the per-minute signal is the gauge (RSS, heap, event loop) in `process-gauge.ts`.
 */
export const STORE_SIZES_INTERVAL_MS = 60 * 60_000;

type Env = Readonly<Record<string, string | undefined>>;

/** Bytes under `path` — a file's size, or a directory's files summed recursively; 0 if absent. */
export function pathBytes(path: string): number {
  try {
    const stat = statSync(path);
    if (!stat.isDirectory()) return stat.size;
    return readdirSync(path).reduce((sum, name) => sum + pathBytes(join(path, name)), 0);
  } catch {
    return 0; // a store that has never written yet is a 0, not a failed boot
  }
}

export interface StoreSizes {
  /** `history` for SKYNET_HISTORY_DIR, and so on — the env var minus its `SKYNET_` prefix. */
  stores: Array<{ name: string; bytes: number }>;
  /** Free and total bytes on the filesystem holding `mount`, when it can be read. */
  volume?: { freeBytes: number; totalBytes: number };
}

const storeName = (envVar: string): string =>
  envVar
    .replace(/^SKYNET_/, "")
    .replace(/_(DIR|FILE|STORE)$/, "")
    .toLowerCase()
    .replaceAll("_", "-");

/** Measure every store `PERSISTED_STORES` declares, at the path this process actually uses. */
export function measureStores(env: Env, mount?: string): StoreSizes {
  const stores = Object.entries(PERSISTED_STORES).map(([envVar, fallback]) => ({
    name: storeName(envVar),
    bytes: pathBytes(env[envVar] ?? fallback),
  }));
  if (!mount) return { stores };
  try {
    const fs = statfsSync(mount);
    return {
      stores,
      volume: { freeBytes: fs.bavail * fs.bsize, totalBytes: fs.blocks * fs.bsize },
    };
  } catch {
    return { stores };
  }
}

const mb = (bytes: number): string => (bytes / 1_048_576).toFixed(1);

/** `[stores] history 12.3 MB · activity 4.1 MB · … · volume 312.0 of 1024.0 MB free`, largest first. */
export function formatStoreSizes(sizes: StoreSizes): string {
  const parts = [...sizes.stores]
    .filter((s) => s.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes)
    .map((s) => `${s.name} ${mb(s.bytes)} MB`);
  const total = sizes.stores.reduce((sum, s) => sum + s.bytes, 0);
  const volume = sizes.volume
    ? ` · volume ${mb(sizes.volume.freeBytes)} of ${mb(sizes.volume.totalBytes)} MB free`
    : "";
  return `[stores] total ${mb(total)} MB${parts.length ? ` · ${parts.join(" · ")}` : ""}${volume}`;
}
