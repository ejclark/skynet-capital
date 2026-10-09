import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The unclean-restart marker (#4618, slice 6 of #4612). An OOM kill fails no workflow run and the
 * post-deploy smoke passes once the machine is back, so `incident-scan`'s only signal (a red run on
 * main) never saw either OOM: one ran 69 days unnoticed. The fix is the oldest trick there is — a
 * file that says "I am running", written at boot, refreshed by the gauge, and removed only by an
 * exit this process chose (the SIGTERM drain, `graceful-shutdown.ts`). If the next boot finds the
 * file, the last run ended some other way: an OOM kill, an uncaught crash, or a SIGKILL after the
 * drain overran Fly's `kill_timeout`. The last gauge reading rides in the file, so the incident can
 * say how much memory the process held a minute before it died.
 *
 * Lives beside the stores on the volume — `dirname(SKYNET_HISTORY_DIR)`, `/data` in production —
 * so it survives the restart it describes, with no new env var to pin in `fly.toml`. It is not a
 * store (nothing reads it but the next boot), which is why `PERSISTED_STORES` does not list it.
 */
export const RUN_MARKER_FILE = "run-marker.json";

type Env = Readonly<Record<string, string | undefined>>;

export function runMarkerPath(env: Env): string {
  return join(dirname(env.SKYNET_HISTORY_DIR ?? "data/history"), RUN_MARKER_FILE);
}

/** What the marker holds — enough for an incident to say which run died and in what state. */
export interface RunMarker {
  bootedAt: string;
  gitSha: string | null;
  pid: number;
  /** The last moment the process proved it was alive (boot, then every gauge reading). */
  lastSeenAt: string;
  /** The last gauge line's numbers, when one has been taken. */
  lastRssMb?: number;
  peakRssMb?: number;
  lastLoopMaxMs?: number;
  /** When an incident was last reported for an unclean exit — carried across a crash loop so a
   *  machine dying every minute files one report, not one per boot. */
  reportedAt?: string;
}

export interface RunMarkerHandle {
  /** The previous run's marker if it never exited cleanly; `undefined` after a clean exit. */
  previous: RunMarker | undefined;
  /** Refresh `lastSeenAt` and the memory numbers. Best-effort — never throws. */
  touch: (reading?: { rssMb: number; peakRssMb: number; loopMaxMs: number }) => void;
  /** Remove the marker: call only from an exit this process chose. */
  clear: () => void;
  /** Record that this run reported the previous run's unclean exit (see `reportedAt`). */
  reported: (at: Date) => void;
}

function parseMarker(text: string): RunMarker | undefined {
  try {
    const raw = JSON.parse(text) as Partial<RunMarker>;
    if (typeof raw.bootedAt !== "string" || typeof raw.lastSeenAt !== "string") return undefined;
    return raw as RunMarker;
  } catch {
    return undefined;
  }
}

/**
 * Read what the last run left behind, then claim the marker for this run. A marker that exists but
 * does not parse (a write torn by the very kill it records) still counts as an unclean exit.
 */
export function openRunMarker(
  path: string,
  gitSha: string | null,
  now: () => Date = () => new Date(),
  warn: (line: string) => void = () => undefined,
): RunMarkerHandle {
  let previous: RunMarker | undefined;
  try {
    const text = readFileSync(path, "utf8");
    const at = now().toISOString();
    previous = parseMarker(text) ?? { bootedAt: "unknown", gitSha: null, pid: 0, lastSeenAt: at };
  } catch {
    previous = undefined; // no file: the last run exited cleanly, or this is the first boot
  }

  const marker: RunMarker = {
    bootedAt: now().toISOString(),
    gitSha,
    pid: process.pid,
    lastSeenAt: now().toISOString(),
    // A crash loop keeps its last report time; a clean exit removed the file, ending the loop.
    ...(previous?.reportedAt ? { reportedAt: previous.reportedAt } : {}),
  };
  const write = (): void => {
    try {
      mkdirSync(dirname(path), { recursive: true });
      const tmp = `${path}.tmp`;
      writeFileSync(tmp, `${JSON.stringify(marker)}\n`, "utf8");
      renameSync(tmp, path); // atomic: a kill mid-write leaves the old marker, never half of one
    } catch (error) {
      warn(`[run-marker] write failed (non-fatal): ${String(error)}`);
    }
  };
  write();

  return {
    previous,
    touch: (reading) => {
      marker.lastSeenAt = now().toISOString();
      if (reading) {
        marker.lastRssMb = reading.rssMb;
        marker.peakRssMb = reading.peakRssMb;
        marker.lastLoopMaxMs = reading.loopMaxMs;
      }
      write();
    },
    reported: (at) => {
      marker.reportedAt = at.toISOString();
      write();
    },
    clear: () => {
      try {
        rmSync(path, { force: true });
      } catch (error) {
        warn(`[run-marker] clear failed: ${String(error)}`);
      }
    },
  };
}
