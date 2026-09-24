import { deskLedger } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { indexPlaybookTags, playbookTagsFromOutcomes } from "../trading/playbook-attribution.js";
import type { RoundTrip } from "../trading/round-trips.js";
import { type PlaybookStats, statsByPlaybook } from "../trading/trade-stats.js";
import { type AccountDecisionsDeps, readAccountDecisions } from "./decision-account-view.js";

/**
 * HOUSE-WIDE PLAYBOOK PERFORMANCE — closes the gap `playbook-attribution.ts`'s own module doc
 * named: the join it provides was never actually wired into `deskLedger`'s one production call
 * site (`desk-json-routes.ts`), so `RoundTrip.playbookId` has never been populated and #885's
 * per-playbook metrics had nowhere to read from. This is that wiring, at the one place it needs to
 * run house-wide rather than per-desk: every participant's closed trips, tagged and pooled, so a
 * playbook run by two different bot personas (or a bot and a subscribed human) scores as one line.
 *
 * Deliberately no weighting or benchmark layer — `trade-stats.ts`'s existing `tradeStats` family
 * (win rate, profit factor, expectancy, streaks) applied per playbook is the whole of this slice;
 * those refinements are additive and can layer on later without changing this shape.
 *
 * A manual desk trade never carries a `playbookId` today (`trade-service.ts`/`option-trade-
 * service.ts` don't tag one) — only a bot's `OrderIntent.playbookId` does, via `DecisionRecord`
 * outcomes. So in practice this pools bot-executed plays across personas; a human's own manual
 * trades simply don't attribute to a playbook yet, which `statsByPlaybook` already handles
 * honestly by excluding untagged trips rather than inventing a "human" bucket.
 */

export type PlaybookPerformanceDeps = AccountDecisionsDeps;

/** One participant's contribution to the house-wide trip pool — playbook-tagged when the
 *  participant is a bot with a decision audit trail wired, untagged otherwise. Tags come from every
 *  persona that traded on this ledger, not just its owner: beta-scout fills land on Sauron's broker
 *  but file their decisions under "beta-scout", so an owner-only read left every BETA-SCOUT trip
 *  untagged and missing from the stats. */
async function tripsFor(
  participant: ParticipantSnapshot,
  deps: PlaybookPerformanceDeps,
): Promise<readonly RoundTrip[]> {
  const durable = await deps.readTradeActivity?.(participant.id);
  if (!durable) return [];
  const decisions =
    participant.kind === "bot" ? await readAccountDecisions(participant.id, deps) : undefined;
  const tags = decisions
    ? indexPlaybookTags(playbookTagsFromOutcomes(decisions.flatMap((d) => d.outcomes)))
    : undefined;
  return deskLedger(participant, durable, tags).trips;
}

/** Every closed trade across every live participant, grouped by playbook and scored with the
 *  standard `tradeStats` family. A participant with no durable ledger wired simply contributes
 *  nothing — never a partial or fabricated read. */
export async function playbookPerformance(
  participants: readonly ParticipantSnapshot[],
  deps: PlaybookPerformanceDeps,
): Promise<PlaybookStats[]> {
  return (await playbookPerformanceView(participants, [], deps)).house;
}

/**
 * The two groupings Eric asked for (#3665), kept apart: the house-wide collective and the viewer's
 * own accounts. They are separate lists on purpose — a surface showing both must never be able to
 * blend "how everyone did" into "how I did".
 */
export interface PlaybookPerformanceView {
  readonly house: PlaybookStats[];
  /** Null when no scoped account is live — an absence, not an empty list posing as zero trades. */
  readonly mine: PlaybookStats[] | null;
  /** The accounts `mine` actually covers, so a reader can see what "mine" means. */
  readonly accounts: readonly string[];
}

/** Each participant's ledger is read and tagged once; both groupings slice the same trips. */
export async function playbookPerformanceView(
  participants: readonly ParticipantSnapshot[],
  scope: readonly string[],
  deps: PlaybookPerformanceDeps,
): Promise<PlaybookPerformanceView> {
  const live = participants.filter((p) => !p.error);
  const tripLists = await Promise.all(live.map((p) => tripsFor(p, deps)));
  const accounts = live.map((p) => p.id).filter((id) => scope.includes(id));
  const mine = live.flatMap((p, i) => (accounts.includes(p.id) ? (tripLists[i] ?? []) : []));
  return {
    house: statsByPlaybook(tripLists.flat()),
    mine: accounts.length > 0 ? statsByPlaybook(mine) : null,
    accounts,
  };
}

/**
 * Which accounts "mine" covers: the viewer's owned accounts, optionally narrowed by a
 * comma-separated `?accounts=` selection. A selection can only narrow, never widen — naming an
 * account the viewer doesn't own is silently dropped, not honored.
 */
export function selectAccounts(owned: readonly string[], requested: string | null): string[] {
  if (!requested) return [...owned];
  const picked = new Set(requested.split(",").map((id) => id.trim()));
  return owned.filter((id) => picked.has(id));
}
