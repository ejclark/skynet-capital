import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { Participant } from "../participants/participant.js";
import { type AccountCollision, findAccountCollisions } from "./account-collisions.js";
import { buildParticipantSnapshot, type ParticipantSnapshot } from "./participant-snapshot.js";

/** The whole centralized view the dashboard renders. */
export interface DashboardData {
  readonly generatedAt: string;
  readonly participants: ParticipantSnapshot[];
  /** Two-or-more participants that resolved to the SAME Alpaca account — see account-collisions.ts. */
  readonly collisions: AccountCollision[];
}

/** Builds the trading client for a participant. Injected so tests use fakes, no network. */
export type TradingClientFactory = (participant: Participant) => AlpacaTradingClient;

/**
 * Per-account deadline on this build's broker reads.
 *
 * Load-bearing, because this build gates the HTTP listener: `serve-dashboard.ts` awaits it before
 * `.listen()`, so an account read that never returns is a release that never serves. That is the
 * 2026-10-03 outage (#4516) — one stalled Alpaca read, six smoke attempts each reporting
 * `curl: (28) … 0 bytes received`, and a rollback that put `main`'s tip back to the previous image
 * while Fly reported the machine healthy (it has no HTTP check to disagree with). `fetchJson`
 * passes no `AbortSignal` and undici's own defaults are measured in minutes, so the deadline has
 * to live on this side of the seam. 20s is comfortably under the smoke test's 115s retry budget
 * (`scripts/smoke.sh`), and a degraded row is repaired on the next broker re-sync tick
 * (`broker-sync.ts`) — so the cost of expiring early is one stale row for seconds, against a
 * failed release for not expiring at all.
 */
export const SNAPSHOT_READ_TIMEOUT_MS = 20_000;

export interface BuildDashboardOptions {
  readonly clientFactory: TradingClientFactory;
  /** Injectable clock for `generatedAt` (fixed in tests). */
  readonly now?: () => Date;
  /** Per-account read deadline; defaults to `SNAPSHOT_READ_TIMEOUT_MS`. */
  readonly timeoutMs?: number;
}

/**
 * Read every participant into one centralized `DashboardData`. This is the single source
 * of truth the dashboard renders — bots and humans side by side. Snapshots are gathered
 * in parallel, and an account that fails OR stalls degrades to an error-tagged row rather
 * than failing — or indefinitely delaying — the whole build.
 */
export async function buildDashboardData(
  participants: readonly Participant[],
  options: BuildDashboardOptions,
): Promise<DashboardData> {
  const timeoutMs = options.timeoutMs ?? SNAPSHOT_READ_TIMEOUT_MS;
  const snapshots = await Promise.all(
    participants.map((participant) =>
      buildParticipantSnapshot(participant, options.clientFactory(participant), { timeoutMs }),
    ),
  );
  const now = options.now ?? (() => new Date());
  return {
    generatedAt: now().toISOString(),
    participants: snapshots,
    collisions: findAccountCollisions(snapshots),
  };
}
