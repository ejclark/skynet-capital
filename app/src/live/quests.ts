import type { Quest, QuestBaseRate } from "../../../src/domain/quest";
import { signedPercent } from "../ui/numbers";
import { dayLabel } from "./book-events";
import type { EditionStory } from "./edition";

/**
 * A MEMBER'S QUESTS, CLIENT SIDE (#7077 slice 3, #7028 slice 5). `GET /api/quests` answers with the
 * signed-in member's own quests, already ranked (`src/domain/quest.ts` → `rankQuests`); this file
 * places them by their source and says each one in words. Eric's pick (#7018 round 1, "Each by its
 * source"): a market quest sits under the story it came from, and the member's account quests (a
 * position worth changing, their cash under today's market) sit in one part after the news.
 *
 * Honesty is carried in words here, never a colour (BRAND.md → Accessibility; CLAUDE.md "never let
 * a flourish imply something false"): every base rate says its sample, a study too small to claim an
 * edge says so, an untested one says "untested", and nothing calls a time good to buy.
 */

export type { Quest };

export type QuestsAnswer =
  | { readonly available: false; readonly reason: string; readonly quests: readonly Quest[] }
  | {
      readonly available: true;
      readonly asOf: string;
      readonly quests: readonly Quest[];
      /** What was not judged this read: an underlying, or `conditions`. */
      readonly unread: readonly string[];
    };

/** The signed-in member's quests, or `null` when the session owns no account to read. */
export async function fetchQuests(): Promise<QuestsAnswer | null> {
  const res = await fetch("/api/quests", { credentials: "same-origin" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`quests ${res.status}`);
  return (await res.json()) as QuestsAnswer;
}

/** A quest's row on the page (`quest-<id>`): the Eye lands on a new one (#7487 slice 5). */
export const questAnchor = (id: string): string => `quest-${id}`;

/** At 390 the ranking is the product (#7028 objection 3): this many show, the rest fold. */
export const QUESTS_SHOWN = 3;

/** Where each quest sits on the page. Both lists keep the route's rank order. */
export interface PlacedQuests {
  /** Market quests under the story whose names include the quest's symbol, by story id. */
  readonly byStory: ReadonlyMap<string, readonly Quest[]>;
  /** The account's quests, plus any market quest no story in this edition names. */
  readonly account: readonly Quest[];
}

/**
 * A market quest (source "event") goes under the first story, in the edition's order, that names
 * its symbol. One no story names stays visible in the account part rather than vanishing.
 */
export function placeQuests(
  quests: readonly Quest[],
  stories: readonly EditionStory[],
): PlacedQuests {
  const byStory = new Map<string, Quest[]>();
  const account: Quest[] = [];
  for (const q of quests) {
    const story =
      q.source === "event" ? stories.find((s) => s.symbols.includes(q.move.symbol)) : undefined;
    if (story) byStory.set(story.id, [...(byStory.get(story.id) ?? []), q]);
    else account.push(q);
  }
  return { byStory, account };
}

/** Which source a quest came from, said as where it came from. */
export const SOURCE_WORD: Readonly<Record<Quest["source"], string>> = {
  position: "From your positions",
  conditions: "From your cash and today's market",
  event: "From a market event",
};

/** The house's call, said as a call, never as a judgment on the time. */
export const HOUSE_CALL_WORD: Readonly<Record<Quest["houseCall"], string>> = {
  take: "Take it",
  "stand-aside": "Stand aside",
  "no-edge": "No edge shown",
};

/** The short tag a quest's one line carries: how much the house knows about the move. */
export function rateTag(rate: QuestBaseRate): string {
  if (rate.kind === "tested") return `Tested · n=${String(rate.sample)}`;
  if (rate.kind === "measured") return `Edge untested · n=${String(rate.sample)}`;
  return "Untested";
}

const share = (fraction: number): string => `${String(Math.round(fraction * 100))}%`;
const signed = (fraction: number): string => signedPercent(fraction * 100, 1);

/** The base rate in full, each number with its sample, and the reason when there is no edge claim. */
export function rateLines(rate: QuestBaseRate): readonly string[] {
  if (rate.kind === "tested")
    return [
      `Paid in ${share(rate.rate)} of ${String(rate.sample)} past cases (n=${String(rate.sample)}). The worst tenth: ${signed(rate.worstDecile)}.`,
      `Study: ${rate.source}`,
    ];
  if (rate.kind === "measured")
    return [
      `Edge untested. Paid in ${share(rate.rate)} of ${String(rate.sample)} past entries (n=${String(rate.sample)}) across ${String(rate.episodes)} sell-offs; the study needs ${String(rate.episodesNeeded)} before it would claim an edge.`,
      `Average ${signed(rate.mean)} per entry. The worst tenth: ${signed(rate.worstDecile)}; the single worst: ${signed(rate.worstSingle)}.`,
      rate.note,
      `Study: ${rate.source}`,
    ];
  return [`Untested. ${rate.note}`];
}

/** When the quest stops holding, and why: "Holds until Fri, Dec 19: the call expires". */
export function expiresLine(q: Quest): string {
  return `Holds until ${dayLabel(q.expires.date)}: ${q.expires.why}.`;
}

/** The exits the ticket pre-fills, or that the move is itself the exit. */
export function exitLines(q: Quest): readonly string[] {
  return q.exits.length > 0 ? q.exits.map((e) => e.text) : ["This move is itself the exit."];
}

/** What went unread this time, said once: "Not judged this time: NVDA, today's market". */
export function unreadLine(unread: readonly string[]): string | undefined {
  if (unread.length === 0) return undefined;
  const names = unread.map((u) => (u === "conditions" ? "today's market conditions" : u));
  return `Not judged this time: ${names.join(", ")}. The list may be missing a quest until the next read.`;
}
