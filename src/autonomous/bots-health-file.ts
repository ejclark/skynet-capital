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
 * The same record is the process's vitals (#4220, slice 1 of #1307): it also tracks when the price
 * stream last ticked and when each bot last evaluated and placed an order, and `vitals()` hands
 * that pulse to the controls client, which carries it to the dashboard on every poll
 * (`bots-vitals-wire.ts`). One record, not two, so the stamp and the push never disagree.
 *
 * The file is dark unless `SKYNET_BOTS_HEALTH_PATH` is set (fly.bots.toml points it at the volume),
 * same posture as `SKYNET_BOTS_DB_PATH`; the vitals are tracked either way, because the push needs
 * no volume. Best-effort: a write failure warns and never touches boot. Ticks and decisions only
 * move in-memory marks; the file is rewritten on the poll, never once per tick.
 */
import { writeFileAtomicSync } from "../storage/atomic-write.js";
import type { RestoredBotsState } from "./bots-state-db.js";
import {
  type BotsVitals,
  type BotVitals,
  type BridgeStatus,
  MAX_VITALS_BOTS,
} from "./bots-vitals-wire.js";

export type { BridgeStatus } from "./bots-vitals-wire.js";

export interface BotsHealth extends BotsVitals {
  readonly pid: number;
  /**
   * What this boot rehydrated off the volume (issue #1181). `null` = durability is dark for this
   * run (`SKYNET_BOTS_DB_PATH` unset, or the DB failed to open); all-zeroes = the DB opened and
   * was empty. That distinction is the whole point — it separates "the volume isn't working" from
   * "nothing had accumulated yet", which a boot log line cannot.
   */
  readonly restored: RestoredBotsState | null;
  readonly updatedAt: string;
}

/** The slice of a `DecisionRecord` the vitals read: who decided, when, and whether it placed. */
export interface DecisionPulse {
  readonly at: number;
  readonly personaId: string;
  readonly outcomes: readonly { readonly action: string }[];
}

export interface BotsHealthFile {
  /** Where the stamp lands; absent on the dark file (so the caller can announce it, or not). */
  readonly path?: string;
  /** Call once `bootMissionControl` has resolved; `bridgeConfigured` = the client is enabled. */
  boot(bridgeConfigured: boolean): void;
  /** Wire to the controls client's `onFetched` hook — fires on the boot fetch and every poll. */
  controlsFetched(): void;
  /** Call once `restoreBotsState` has run; `null` records that durability was dark this run. */
  restored(state: RestoredBotsState | null): void;
  /** A price event arrived on the shared market-data stream. Cheap: one number, no write. */
  ticked(): void;
  /** A bot emitted a decision record — one per cycle, idle or not. Cheap: no write. */
  decided(pulse: DecisionPulse): void;
  /** The pulse as of now, for the controls poll to carry; undefined until the boot verdict is in,
   *  so the boot fetch never reports a bridge verdict nobody has reached yet. */
  vitals(): BotsVitals | undefined;
}

export function resolveBotsHealthFile(
  env: NodeJS.ProcessEnv = process.env,
  now: () => Date = () => new Date(),
): BotsHealthFile {
  return openBotsHealthFile(env.SKYNET_BOTS_HEALTH_PATH || undefined, env.GIT_SHA ?? null, now);
}

const iso = (ms: number | null): string | null => (ms === null ? null : new Date(ms).toISOString());

const newest = (values: readonly (number | null)[]): number | null =>
  values.reduce<number | null>(
    (max, v) => (v !== null && (max === null || v > max) ? v : max),
    null,
  );

/** `path` undefined = track the vitals, write no file. */
export function openBotsHealthFile(
  path: string | undefined,
  gitSha: string | null,
  now: () => Date = () => new Date(),
): BotsHealthFile {
  const bootedAt = now().toISOString();
  let lastControlsPollAt: string | null = null;
  let restoredState: RestoredBotsState | null = null;
  let booted = false;
  let bridgeConfigured = false;
  let lastTickMs: number | null = null;
  const perBot = new Map<string, { evalMs: number; orderMs: number | null }>();

  const pulse = (): BotsVitals => {
    const bridge: BridgeStatus = lastControlsPollAt
      ? "armed"
      : bridgeConfigured
        ? "unreachable"
        : "unset";
    // The most recently evaluated first, so a roster past the cap keeps the bots that are alive.
    const marks = [...perBot.entries()]
      .sort(([, a], [, b]) => b.evalMs - a.evalMs)
      .slice(0, MAX_VITALS_BOTS);
    const bots: BotVitals[] = marks.map(([id, m]) => ({
      id,
      lastEvalAt: iso(m.evalMs),
      lastOrderAt: iso(m.orderMs),
    }));
    return {
      gitSha,
      bootedAt,
      bridge,
      lastControlsPollAt,
      lastTickAt: iso(lastTickMs),
      lastEvalAt: iso(newest(marks.map(([, m]) => m.evalMs))),
      lastOrderAt: iso(newest(marks.map(([, m]) => m.orderMs))),
      bots,
    };
  };

  const write = () => {
    if (!path) return;
    const health: BotsHealth = {
      ...pulse(),
      pid: process.pid,
      restored: restoredState,
      updatedAt: now().toISOString(),
    };
    try {
      // atomic: a reader never sees a half-written stamp
      writeFileAtomicSync(path, `${JSON.stringify(health, null, 2)}\n`);
    } catch (error) {
      process.emitWarning(`[health] stamp failed (non-fatal): ${String(error)}`);
    }
  };

  return {
    ...(path ? { path } : {}),
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
    ticked() {
      lastTickMs = now().getTime();
    },
    decided({ at, personaId, outcomes }) {
      const prior = perBot.get(personaId);
      const placed = outcomes.some((o) => o.action === "placed");
      perBot.set(personaId, {
        evalMs: Math.max(at, prior?.evalMs ?? at),
        orderMs: placed ? Math.max(at, prior?.orderMs ?? at) : (prior?.orderMs ?? null),
      });
    },
    vitals: () => (booted ? pulse() : undefined),
  };
}
