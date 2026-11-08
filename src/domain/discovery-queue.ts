/**
 * THE DISCOVERY QUEUE — a member's question about something no campaign covers waits here for the
 * research lane (#6952 slice 2b, criterion 7).
 *
 * The ask (Eric, 2026-11-07): "anyone should be able to help steer.. asking about a new sector
 * should promp discovery". A question becomes an explore-mode discovery: it joins this queue, and
 * the research lane takes from the front of it on its own pass. Findings go to the campaign's
 * lesson record (campaign-lessons.ts), which `startDiscovery` reads before any of it starts.
 *
 * THE QUEUE NEVER RAISES THE CEILING. Three rules keep that true, each pinned by a spec:
 *   1. It is bounded (`MAX_QUEUED`): a flood of questions fills a short list, never the lane.
 *   2. A drain takes at most the lane's per-pass ceiling (`npm run work-gate`'s `researchPerTick`)
 *      MINUS the slots event research already used that pass, and zero when the dial says halt.
 *   3. Asking twice is one ask: a second member asking about the same thing joins it, so a popular
 *      question costs one discovery, not one per asker.
 *
 * WHAT THIS MODULE DOES NOT DO. It starts nothing: no lane reads the queue yet (the lane's workflow
 * is envelope-protected, so wiring it is its own platter item) and the finding does not come back
 * as an article until #6948 slice 4 lands. `tellMember` promises only what is true today: the ask
 * is queued, and where it stands in line.
 *
 * Paper only; educational. A discovery never places an order and never sizes one.
 */
import type { Campaign } from "./campaigns.js";
import { castSymbols } from "./campaigns.js";

export const DISCOVERY_KINDS = ["sector", "market", "name"] as const;
export type DiscoveryKind = (typeof DISCOVERY_KINDS)[number];

/** Asks waiting at once. A bound on member text, not a game rule; the lane drains it per pass. */
export const MAX_QUEUED = 24;
/** The most members one ask remembers; a popular question stops counting, never grows the file. */
export const MAX_ASKERS = 20;

export interface DiscoveryAsk {
  /** `<kind>:<subject>` — one ask per thing asked about. */
  readonly id: string;
  readonly kind: DiscoveryKind;
  /** A GICS sector's label, a `market-catalog.ts` id, or an uppercase ticker. */
  readonly subject: string;
  /** When the first member asked (ISO). The queue is first in, first out. */
  readonly askedAt: string;
  /** Opaque member keys, never emails. */
  readonly askers: readonly string[];
}

export type DiscoveryQueue = readonly DiscoveryAsk[];

export type QueueOutcome =
  | {
      readonly status: "queued" | "joined";
      readonly queue: DiscoveryQueue;
      /** Asks ahead of this one, 0 when it is next. */
      readonly ahead: number;
    }
  | { readonly status: "covered"; readonly queue: DiscoveryQueue; readonly campaign: string }
  | { readonly status: "full"; readonly queue: DiscoveryQueue };

/** The house campaign that already covers the subject, if one does. A name counts when it is in a cast. */
export function coveringCampaign(
  kind: DiscoveryKind,
  subject: string,
  campaigns: readonly Campaign[],
): Campaign | undefined {
  return campaigns.find((c) =>
    kind === "sector"
      ? c.sector === subject
      : kind === "market"
        ? c.market === subject
        : castSymbols(c).includes(subject),
  );
}

export interface AskInput {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** The asking member's opaque key. */
  readonly by: string;
}

/**
 * Put one question on the queue. A subject a house campaign covers is `covered` (there is nothing to
 * discover, so the member is pointed at it); one already waiting is `joined`; a full queue is `full`
 * and unchanged. `campaigns` is the house list, and `researched` says a name already has a ledger.
 */
export function queueAsk(
  queue: DiscoveryQueue,
  input: AskInput,
  campaigns: readonly Campaign[],
  researched: (symbol: string) => boolean,
  at: Date = new Date(),
): QueueOutcome {
  const covering = coveringCampaign(input.kind, input.subject, campaigns);
  if (covering) return { status: "covered", queue, campaign: covering.id };
  if (input.kind === "name" && researched(input.subject)) {
    // The shelf already holds a ledger on this name; asking again would buy the same session twice.
    return { status: "covered", queue, campaign: "the research shelf" };
  }
  const id = `${input.kind}:${input.subject}`;
  const at0 = queue.findIndex((a) => a.id === id);
  if (at0 >= 0) {
    const prior = queue[at0] as DiscoveryAsk;
    const askers = prior.askers.includes(input.by)
      ? prior.askers
      : [...prior.askers, input.by].slice(0, MAX_ASKERS);
    const next = queue.map((a, i) => (i === at0 ? { ...prior, askers } : a));
    return { status: "joined", queue: next, ahead: at0 };
  }
  if (queue.length >= MAX_QUEUED) return { status: "full", queue };
  const ask: DiscoveryAsk = {
    id,
    kind: input.kind,
    subject: input.subject,
    askedAt: at.toISOString(),
    askers: [input.by],
  };
  return { status: "queued", queue: [...queue, ask], ahead: queue.length };
}

/**
 * What the lane takes on one pass: the front of the queue, at most the pass's ceiling less the slots
 * event research already spent. A ceiling of zero (halt) or an overspent pass takes nothing, and a
 * non-integer or negative number is read as zero — closed, the way `researchCapFor` fails.
 */
export function takeForPass(
  queue: DiscoveryQueue,
  ceiling: number,
  spentByEvents = 0,
): { readonly take: DiscoveryQueue; readonly rest: DiscoveryQueue } {
  const ok = (n: number): boolean => Number.isInteger(n) && n >= 0;
  const room = ok(ceiling) && ok(spentByEvents) ? Math.max(0, ceiling - spentByEvents) : 0;
  return { take: queue.slice(0, room), rest: queue.slice(room) };
}

/**
 * How many research passes until an ask at position `ahead` is taken, at `perPass` asks a pass. The
 * first pass is 1. A ceiling that is not a positive integer reads as one a pass: the longer wait,
 * so the estimate never promises sooner than the lane could deliver.
 */
export function passesUntil(ahead: number, perPass: number): number {
  const per = Number.isInteger(perPass) && perPass >= 1 ? perPass : 1;
  return Math.floor(Math.max(0, ahead) / per) + 1;
}

/** What the member is told: queued, where in line, and roughly when, in plain words. */
export function tellMember(outcome: QueueOutcome, perPass: number): string {
  if (outcome.status === "covered")
    return `The house already covers this in ${outcome.campaign}, so there is nothing new to look into.`;
  if (outcome.status === "full")
    return "The house has a full list of questions to look into right now. Ask again in a day or two.";
  const passes = passesUntil(outcome.ahead, perPass);
  const lead =
    outcome.status === "joined" ? "Someone already asked this; you're on it with them." : "Queued.";
  const when =
    passes === 1
      ? "It is next in line for the house's research pass, which runs whenever new work lands."
      : `${outcome.ahead} ahead of it, so about ${passes} research passes from now; a pass runs whenever new work lands.`;
  return `${lead} ${when} Nothing is bought or sold.`;
}
