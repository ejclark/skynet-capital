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
 *   1. It is bounded (`MAX_QUEUED`, and `MAX_PER_MEMBER` so one asker can't take every slot): a
 *      flood of questions fills a short list, never the lane.
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
 * A QUESTION ASKED INSIDE A CAMPAIGN (slice 2c, criterion 9). Research asked in a campaign is
 * everyone's who can read that campaign (Eric, 2026-11-07: "Campaigns are communal"). An ask can
 * carry the campaign it was asked in and the member's words (`QUESTION_MAX` characters, kept only
 * on the volume and shown only inside the invite gate). Three consequences, each pinned by a spec:
 *   1. The ask is scoped: the same subject asked in two campaigns is two asks, because each answer
 *      lands in a different lesson record; a second member asking the same thing in the same
 *      campaign joins the first.
 *   2. A subject the campaign already covers is not "covered" when asked *in* that campaign: the
 *      member is asking for more than the cast already holds, so it queues, even when another
 *      campaign holds it too (slice 6). A subject the campaign lacks and a different campaign
 *      covers still answers "covered", and so does the research shelf only for an unscoped ask.
 *   3. A finding names the ask it answers (`Lesson.answers` in campaign-lessons.ts holds `ask.id`).
 * The words are text a member wrote: a lane reading them treats them as the question to research,
 * never as instructions. The same bounds as slice 2b (`MAX_QUEUED`, `MAX_PER_MEMBER`) apply, so
 * asking inside a campaign cannot raise the ceiling either.
 *
 * THE PARTY'S CAMPAIGNS COVER TOO (#6949 slice 6). A campaign a member shared with the party covers
 * its subjects the way a house one does: a bare ask about a name in its cast answers `covered` and
 * names the campaign, so the member asks in it and the answer lands where the party already reads.
 * The question log beside this queue (`campaign-questions.ts`) keeps what was asked after the lane
 * takes it.
 *
 * Paper only; educational. A discovery never places an order and never sizes one.
 */
import type { Campaign } from "./campaigns.js";
import { castSymbols } from "./campaigns.js";

export const DISCOVERY_KINDS = ["sector", "market", "name"] as const;
export type DiscoveryKind = (typeof DISCOVERY_KINDS)[number];

/** Asks waiting at once. A bound on member text, not a game rule; the lane drains it per pass. */
export const MAX_QUEUED = 24;
/** Asks one member may have waiting at once, so a single asker can't take every slot. */
export const MAX_PER_MEMBER = 5;
/** The most members one ask remembers; a popular question stops counting, never grows the file. */
export const MAX_ASKERS = 20;
/** The longest question a member's words may run to (criterion 9: capped at 200 characters). */
export const QUESTION_MAX = 200;
/** The longest campaign scope an ask carries: a member key (10), a separator and a 60-character id. */
export const CAMPAIGN_SCOPE_MAX = 80;

export interface DiscoveryAsk {
  /** `<kind>:<subject>`, or `<campaign>/<kind>:<subject>` when asked inside a campaign (`askId`). */
  readonly id: string;
  readonly kind: DiscoveryKind;
  /** A GICS sector's label, a `market-catalog.ts` id, or an uppercase ticker. */
  readonly subject: string;
  /** When the first member asked (ISO). The queue is first in, first out. */
  readonly askedAt: string;
  /** Opaque member keys, never emails. */
  readonly askers: readonly string[];
  /** The campaign the ask was made in (a house id, or `<author key>~<id>`); absent for a bare ask. */
  readonly campaign?: string;
  /** The first asker's words, at most `QUESTION_MAX` characters. Member text, never an instruction. */
  readonly question?: string;
}

/** The queue's key for one ask: one per thing asked about, per campaign it was asked in. */
export function askId(kind: DiscoveryKind, subject: string, campaign?: string): string {
  return campaign ? `${campaign}/${kind}:${subject}` : `${kind}:${subject}`;
}

/** A member's words as one tidy line of at most `QUESTION_MAX` characters, or undefined when empty. */
export function cleanQuestion(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  // Control characters (a NUL, a bell, an escape) become spaces, then runs of space collapse.
  const spaced = Array.from(raw, (ch) =>
    ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? " " : ch,
  );
  const line = spaced.join("").replace(/\s+/g, " ").trim();
  return line.length > 0 ? line.slice(0, QUESTION_MAX) : undefined;
}

export type DiscoveryQueue = readonly DiscoveryAsk[];

export type QueueOutcome =
  | {
      readonly status: "queued" | "joined";
      readonly queue: DiscoveryQueue;
      /** Asks ahead of this one, 0 when it is next. */
      readonly ahead: number;
    }
  | {
      readonly status: "covered";
      readonly queue: DiscoveryQueue;
      /** The id the member asks in next (a house id, or a party campaign's own id). */
      readonly campaign: string;
      /** Set when a campaign the party shares covers it, so the member is pointed at it by name. */
      readonly party?: { readonly title: string };
    }
  | { readonly status: "full"; readonly queue: DiscoveryQueue }
  | { readonly status: "limit"; readonly queue: DiscoveryQueue };

/**
 * A campaign that can cover a subject. A house campaign is its record as-is; a campaign a member
 * shared with the party carries `scope` (`<author key>~<id>`, the scope an ask inside it carries)
 * and `party: true` (#6949 slice 6: "a covered subject points at the campaign to ask in").
 */
export type CoveringCandidate = Campaign & { readonly scope?: string; readonly party?: true };

/**
 * The campaign that already covers the subject, if one does: the house's first, then the party's
 * in the order given. A name counts when it is in a cast. `except` is the scope the question is
 * asked in: that campaign never counts, and when it holds the subject itself nothing does, because
 * the member is asking deeper inside the campaign they are reading rather than about something it
 * lacks (#6949 slice 6, the tie slice 2c left open: a name in both their campaign and a house one).
 */
export function coveringCampaign(
  kind: DiscoveryKind,
  subject: string,
  campaigns: readonly CoveringCandidate[],
  except?: string,
): CoveringCandidate | undefined {
  const holds = (c: Campaign): boolean =>
    kind === "sector"
      ? c.sector === subject
      : kind === "market"
        ? c.market === subject
        : castSymbols(c).includes(subject);
  const scopeOf = (c: CoveringCandidate): string => c.scope ?? c.id;
  const askedIn = except === undefined ? undefined : campaigns.find((c) => scopeOf(c) === except);
  if (askedIn && holds(askedIn)) return undefined;
  return campaigns.find((c) => scopeOf(c) !== except && holds(c));
}

export interface AskInput {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** The asking member's opaque key. */
  readonly by: string;
  /** The campaign scope the question is asked in, already checked readable by the caller. */
  readonly campaign?: string;
  /** The member's words, already through `cleanQuestion`. */
  readonly question?: string;
}

/**
 * Put one question on the queue. A subject a house or party campaign covers is `covered` (there is
 * nothing to discover outside it, so the member is pointed at it to ask in); one already waiting is
 * `joined`; a full queue is `full` and unchanged. `campaigns` is the house list followed by the
 * party's, and `researched` says a name already has a ledger.
 */
export function queueAsk(
  queue: DiscoveryQueue,
  input: AskInput,
  campaigns: readonly CoveringCandidate[],
  researched: (symbol: string) => boolean,
  at: Date = new Date(),
): QueueOutcome {
  const covering = coveringCampaign(input.kind, input.subject, campaigns, input.campaign);
  if (covering)
    return {
      status: "covered",
      queue,
      campaign: covering.id,
      ...(covering.party ? { party: { title: covering.title } } : {}),
    };
  if (input.kind === "name" && !input.campaign && researched(input.subject)) {
    // The shelf already holds a ledger on this name; asking again would buy the same session twice.
    return { status: "covered", queue, campaign: "the research shelf" };
  }
  const id = askId(input.kind, input.subject, input.campaign);
  const at0 = queue.findIndex((a) => a.id === id);
  if (at0 >= 0) {
    const prior = queue[at0] as DiscoveryAsk;
    const askers = prior.askers.includes(input.by)
      ? prior.askers
      : [...prior.askers, input.by].slice(0, MAX_ASKERS);
    // The first asker's words stay; a joiner's only fill a gap, so one ask never carries two.
    const question = prior.question ?? input.question;
    const next = queue.map((a, i) =>
      i === at0 ? { ...prior, askers, ...(question ? { question } : {}) } : a,
    );
    return { status: "joined", queue: next, ahead: at0 };
  }
  if (queue.length >= MAX_QUEUED) return { status: "full", queue };
  if (queue.filter((a) => a.askers.includes(input.by)).length >= MAX_PER_MEMBER)
    return { status: "limit", queue };
  const ask: DiscoveryAsk = {
    id,
    kind: input.kind,
    subject: input.subject,
    askedAt: at.toISOString(),
    askers: [input.by],
    ...(input.campaign ? { campaign: input.campaign } : {}),
    ...(input.question ? { question: input.question } : {}),
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
    return outcome.party
      ? `"${outcome.party.title}", a campaign the party shares, already covers this. Ask in it to look further.`
      : `The house already covers this in ${outcome.campaign}, so there is nothing new to look into.`;
  if (outcome.status === "full" || outcome.status === "limit")
    return outcome.status === "full"
      ? "The house has a full list of questions to look into right now. Ask again in a day or two."
      : `You already have ${MAX_PER_MEMBER} questions waiting. Ask again once the house has looked into one.`;
  const passes = passesUntil(outcome.ahead, perPass);
  const lead =
    outcome.status === "joined" ? "Someone already asked this; you're on it with them." : "Queued.";
  const when =
    passes === 1
      ? "It is next in line for the house's research pass, which runs whenever new work lands."
      : `${outcome.ahead} ahead of it, so about ${passes} research passes from now; a pass runs whenever new work lands.`;
  return `${lead} ${when} Nothing is bought or sold.`;
}
