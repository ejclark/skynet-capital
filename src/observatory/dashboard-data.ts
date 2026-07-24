import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { Participant } from "../participants/participant.js";
import { type ParticipantSnapshot, buildParticipantSnapshot } from "./participant-snapshot.js";

/** The whole centralized view the dashboard renders. */
export interface DashboardData {
  readonly generatedAt: string;
  readonly participants: ParticipantSnapshot[];
}

/** Builds the trading client for a participant. Injected so tests use fakes, no network. */
export type TradingClientFactory = (participant: Participant) => AlpacaTradingClient;

export interface BuildDashboardOptions {
  readonly clientFactory: TradingClientFactory;
  /** Injectable clock for `generatedAt` (fixed in tests). */
  readonly now?: () => Date;
}

/**
 * Read every participant into one centralized `DashboardData`. This is the single source
 * of truth the dashboard renders — bots and humans side by side. Snapshots are gathered
 * in parallel, and a failed account degrades to an error-tagged row rather than failing
 * the whole build.
 */
export async function buildDashboardData(
  participants: readonly Participant[],
  options: BuildDashboardOptions,
): Promise<DashboardData> {
  const snapshots = await Promise.all(
    participants.map((participant) =>
      buildParticipantSnapshot(participant, options.clientFactory(participant)),
    ),
  );
  const now = options.now ?? (() => new Date());
  return { generatedAt: now().toISOString(), participants: snapshots };
}
