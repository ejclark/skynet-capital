import type { OptionOrderLeg } from "../autonomous/decision-db-leg-orders.js";
import { deskLedger } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { initiatorOf } from "../playbooks/initiator.js";
import {
  indexPlaybookTags,
  type PlaybookTag,
  type PlaybookTagsByOrder,
  playbookTagsFromOutcomes,
} from "../trading/playbook-attribution.js";
import type { RoundTrip } from "../trading/round-trips.js";
import {
  type InitiatorSplit,
  type PlaybookStats,
  statsByInitiator,
  statsByPlaybook,
} from "../trading/trade-stats.js";
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

export interface PlaybookPerformanceDeps extends AccountDecisionsDeps {
  /** A spread leg's own order id → its spread's order (`DecisionDb.findSpreadLeg`): a leg's fill
   *  carries the leg's id, which `findByOrderId` never matches. */
  readonly findSpreadLeg?: (legOrderId: string) => OptionOrderLeg | undefined;
}

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
  if (participant.kind !== "bot") return deskLedger(participant, durable).trips;
  if (deps.findByOrderId) {
    const tags = tagsByOrder(durable, deps.findByOrderId, deps.findSpreadLeg);
    return deskLedger(participant, durable, tags).trips;
  }
  // Legacy path, for a deployment without the order-id join: only the decisions a page-less read
  // returns can tag, so older trips go untagged there.
  const decisions = await readAccountDecisions(participant.id, deps);
  const tags = decisions
    ? indexPlaybookTags(playbookTagsFromOutcomes(decisions.flatMap((d) => d.outcomes)))
    : undefined;
  return deskLedger(participant, durable, tags).trips;
}

/** Each fill tagged by its OWN order id (found 2026-09-24): an indexed lookup per order, so a trip
 *  opened months ago is attributed as surely as today's. Reading decisions and indexing their
 *  outcomes only ever covered the store's newest page, a few minutes of a busy bot's passes.
 *  Looked up once per unique order id, not once per fill — a partial fill posts several journal
 *  lines for the same order (#4612 slice 7, defect #8). Every order a decision accounts for gets
 *  its initiator (#4450 slice 4), playbook or not; one none does stays untagged.
 *
 *  A spread leg reaches its decision through its spread's order (`findSpreadLeg`) and takes the
 *  initiator only, never the playbook id: per-playbook stats keep leaving legs out, as they always
 *  have (`DecisionDb.findSpreadLeg`'s note), while the initiator split counts them the way the
 *  account's own trade list does — one trip per leg. */
function tagsByOrder(
  fills: readonly { readonly orderId: string }[],
  findByOrderId: NonNullable<PlaybookPerformanceDeps["findByOrderId"]>,
  findSpreadLeg: PlaybookPerformanceDeps["findSpreadLeg"],
): PlaybookTagsByOrder {
  const tags: PlaybookTag[] = [];
  const orderIds = new Set(fills.map((f) => f.orderId));
  for (const orderId of orderIds) {
    const found = findByOrderId(orderId);
    if (found) {
      const { intent, record } = found;
      tags.push({
        orderId,
        ...(intent.playbookId ? { playbookId: intent.playbookId } : {}),
        ...(intent.playbookMode ? { playbookMode: intent.playbookMode } : {}),
        initiator: initiatorOf(intent.playbookId, record.personaId),
      });
      continue;
    }
    const parentOrderId = findSpreadLeg?.(orderId)?.parentOrderId;
    const spread = parentOrderId ? findByOrderId(parentOrderId) : undefined;
    if (spread) {
      tags.push({
        orderId,
        initiator: initiatorOf(spread.intent.playbookId, spread.record.personaId),
      });
    }
  }
  return indexPlaybookTags(tags);
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
  /** Who started the bots' closed trades (#4450 slice 4), the same two groupings kept apart.
   *  Bot accounts only: a member's own orders carry no decision, and counting them as untraced
   *  would bury the number this split exists to show — so `mine` is null with no bot account in
   *  scope. The whole split is null where the order-id join isn't wired: without it no trip can
   *  be traced, and three zero rows would be a false answer, not an absent one. */
  readonly byInitiator: {
    readonly house: InitiatorSplit;
    readonly mine: InitiatorSplit | null;
  } | null;
}

/** Each participant's ledger is read and tagged once; every grouping slices the same trips. */
export async function playbookPerformanceView(
  participants: readonly ParticipantSnapshot[],
  scope: readonly string[],
  deps: PlaybookPerformanceDeps,
): Promise<PlaybookPerformanceView> {
  const live = participants.filter((p) => !p.error);
  const tripLists = await Promise.all(live.map((p) => tripsFor(p, deps)));
  const accounts = live.map((p) => p.id).filter((id) => scope.includes(id));
  const inScope = (p: ParticipantSnapshot) => accounts.includes(p.id);
  const tripsOf = (keep: (p: ParticipantSnapshot) => boolean) =>
    live.flatMap((p, i) => (keep(p) ? (tripLists[i] ?? []) : []));
  const isBot = (p: ParticipantSnapshot) => p.kind === "bot";
  const myBot = (p: ParticipantSnapshot) => isBot(p) && inScope(p);
  const mine = tripsOf(inScope);
  return {
    house: statsByPlaybook(tripLists.flat()),
    mine: accounts.length > 0 ? statsByPlaybook(mine) : null,
    accounts,
    byInitiator: deps.findByOrderId
      ? {
          house: statsByInitiator(tripsOf(isBot)),
          mine: live.some(myBot) ? statsByInitiator(tripsOf(myBot)) : null,
        }
      : null,
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
