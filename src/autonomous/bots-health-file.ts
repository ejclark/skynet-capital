/**
 * The bots process's own health stamp: a small JSON file on the volume that says, from INSIDE
 * the process, which commit is running and whether the cross-app controls bridge is reachable.
 *
 * Why a file and not a log line: `scripts/smoke-bots.sh` proved the bridge by grepping
 * `flyctl logs -n` for "[controls] bridge armed", and that one-shot log read lags Fly's
 * log-shipping pipeline by minutes (2026-08-27, widened to 150s; still false-negative on
 * 2026-09-04 19:3x — a healthy boot was rolled back, which dropped GIT_SHA and forced a second
 * deploy). A file on the volume is readable the instant it is written, over
 * `flyctl machine exec … cat`, with no pipeline in between — so the smoke reads the process's
 * own word instead of waiting for a log to arrive.
 *
 * Dark unless `SKYNET_BOTS_HEALTH_PATH` is set (fly.bots.toml points it at the volume), same
 * posture as `SKYNET_BOTS_DB_PATH`. Best-effort: a write failure warns and never touches boot.
 */
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { RestoredBotsState } from "./bots-state-db.js";

/** Mirrors the three boot lines in `bootMissionControl` (autonomous-live-wiring.ts). */
export type BridgeStatus = "armed" | "unreachable" | "unset";

export interface BotsHealth {
  /** `GIT_SHA` as the deploy stamped it into the machine env; null on a rollback (fly.toml only). */
  readonly gitSha: string | null;
  readonly pid: number;
  readonly bootedAt: string;
  readonly bridge: BridgeStatus;
  /** Last successful `/controls` poll — the liveness signal a silent holding day never prints. */
  readonly lastControlsPollAt: string | null;
  /**
   * What this boot rehydrated off the volume (issue #1181). `null` = durability is dark for this
   * run (`SKYNET_BOTS_DB_PATH` unset, or the DB failed to open); all-zeroes = the DB opened and
   * was empty. That distinction is the whole point — it separates "the volume isn't working" from
   * "nothing had accumulated yet", which a boot log line cannot.
   */
  readonly restored: RestoredBotsState | null;
  readonly updatedAt: string;
}

export interface BotsHealthFile {
  /** Where the stamp lands; absent on the dark no-op (so the caller can announce it, or not). */
  readonly path?: string;
  /** Call once `bootMissionControl` has resolved; `bridgeConfigured` = the client is enabled. */
  boot(bridgeConfigured: boolean): void;
  /** Wire to the controls client's `onFetched` hook — fires on the boot fetch and every poll. */
  controlsFetched(): void;
  /** Call once `restoreBotsState` has run; `null` records that durability was dark this run. */
  restored(state: RestoredBotsState | null): void;
}

const NOOP: BotsHealthFile = {
  boot: () => undefined,
  controlsFetched: () => undefined,
  restored: () => undefined,
};

export function resolveBotsHealthFile(
  env: NodeJS.ProcessEnv = process.env,
  now: () => Date = () => new Date(),
): BotsHealthFile {
  const path = env.SKYNET_BOTS_HEALTH_PATH;
  if (!path) return NOOP;
  return openBotsHealthFile(path, env.GIT_SHA ?? null, now);
}

export function openBotsHealthFile(
  path: string,
  gitSha: string | null,
  now: () => Date = () => new Date(),
): BotsHealthFile {
  const bootedAt = now().toISOString();
  let lastControlsPollAt: string | null = null;
  let restoredState: RestoredBotsState | null = null;
  let booted = false;
  let bridgeConfigured = false;

  const write = () => {
    const bridge: BridgeStatus = lastControlsPollAt
      ? "armed"
      : bridgeConfigured
        ? "unreachable"
        : "unset";
    const health: BotsHealth = {
      gitSha,
      pid: process.pid,
      bootedAt,
      bridge,
      lastControlsPollAt,
      restored: restoredState,
      updatedAt: now().toISOString(),
    };
    try {
      mkdirSync(dirname(path), { recursive: true });
      const tmp = `${path}.tmp`;
      writeFileSync(tmp, `${JSON.stringify(health, null, 2)}\n`, "utf8");
      renameSync(tmp, path); // atomic: a reader never sees a half-written stamp
    } catch (error) {
      process.emitWarning(`[health] stamp failed (non-fatal): ${String(error)}`);
    }
  };

  return {
    path,
    boot(configured) {
      bridgeConfigured = configured;
      booted = true;
      write();
    },
    controlsFetched() {
      lastControlsPollAt = now().toISOString();
      // The boot fetch fires this BEFORE boot() — remember it, and let boot() write the stamp.
      if (booted) write();
    },
    restored(state) {
      restoredState = state;
      // Restore runs after bootMissionControl, but hold to the same rule as controlsFetched:
      // never write a stamp that hasn't been through boot()'s bridge verdict.
      if (booted) write();
    },
  };
}
