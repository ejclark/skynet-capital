/**
 * THE CHAIN SCORECARD (#6959 slice 4) — what a chain's shadow replay found, as the Store shows it:
 * each link's OWN result, and the chain's total BESIDE them, never in place of them (criterion 3).
 *
 * WHY A SNAPSHOT, NOT A LIVE REPLAY. The replay (`chain-replay.ts`) needs a ticker's price history
 * and filing dates, which only the research CLI fetches (`scripts/research/market-data.mjs`, network
 * and a cache). The server holds no tape, so a scorecard is a replay run once and committed
 * (`chain-scorecards.json`, written by `npm run research:chain -- --scorecard=…`) and a saved chain
 * shows the card whose LINKS are the same ones it holds (`chainShape`). A chain with no card says
 * so — "no replay yet" — and never borrows another chain's numbers; nothing is estimated.
 *
 * WHAT EACH NUMBER IS. Dollars per contract, over the replay's runs. A link's mean is over the runs
 * it actually owned a position in (a link that never decided shows no result, not $0 — the plan's
 * falsifier); the total is over every run. Every option dollar is modeled premium (no option-price
 * history exists offline), and a run still open when the tape ended is marked, not finished: both
 * are said on the card, because `SIM` honesty outranks a tidy number.
 *
 * Pure and browser-safe (types only come from the replay); nothing here routes an order.
 */

import { chainStart, type PlaybookChain } from "./chain.js";
import type { ChainRun } from "./chain-replay.js";

/** The ownership falsifier, read off the replay's steps (`ownershipCheck`): both must be zero. */
export interface OwnershipFinding {
  readonly sessions: number;
  readonly twoDeciders: number;
  readonly unowned: number;
}

export interface ScorecardLink {
  readonly playbook: string;
  /** Runs this link owned a position in. */
  readonly runs: number;
  /** Its own mean result per contract over those runs; null when it never owned one. */
  readonly mean: number | null;
}

export interface ChainScorecard {
  /** `chainShape` of the replayed chain: the key a saved chain is matched on. */
  readonly shape: string;
  readonly symbol: string;
  /** The tape's first and last session the replay read. */
  readonly from: string;
  readonly to: string;
  /** Replay runs, and how many were still open (marked) when the tape ended. */
  readonly runs: number;
  readonly open: number;
  /** In the order the links first own the position. */
  readonly links: readonly ScorecardLink[];
  /** Beside the links, never in place of them. Mean per contract, and the runs that ended ahead. */
  readonly total: { readonly mean: number; readonly won: number };
  readonly ownership: OwnershipFinding;
}

const eventKey = (link: PlaybookChain["links"][number]): string =>
  link.on.kind === "on-date" ? `on-date:${link.on.date}` : link.on.kind;

/** What identifies a chain's links: who hands to whom, on which event. Not its title or id. */
export function chainShape(chain: PlaybookChain): string {
  return chain.links.map((l) => `${l.from}>${eventKey(l)}>${l.to}`).join(" | ");
}

/** The playbooks of a chain in the order they first own the position: the start, then each link's next. */
export function chainPlaybooks(chain: PlaybookChain): readonly string[] {
  const order = [chainStart(chain)];
  for (const link of chain.links) if (!order.includes(link.to)) order.push(link.to);
  return order;
}

/** Whole dollars: the replay's premiums are modeled, so cents would claim a precision it lacks. */
const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? 0 : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

/** Fold a chain's replay runs into its scorecard. `from`/`to` come from the tape the runs read. */
export function scorecardOf(
  chain: PlaybookChain,
  runs: readonly ChainRun[],
  meta: { readonly symbol: string; readonly from: string; readonly to: string },
  ownership: OwnershipFinding,
): ChainScorecard {
  const links = chainPlaybooks(chain).map((playbook): ScorecardLink => {
    const owned = runs.flatMap((r) => {
      const own = r.links.find((l) => l.playbook === playbook);
      return own ? [own.result] : [];
    });
    return { playbook, runs: owned.length, mean: owned.length > 0 ? mean(owned) : null };
  });
  return {
    shape: chainShape(chain),
    ...meta,
    runs: runs.length,
    open: runs.filter((r) => r.status === "open").length,
    links,
    total: { mean: mean(runs.map((r) => r.total)), won: runs.filter((r) => r.total > 0).length },
    ownership,
  };
}

/** The card for `chain`, if its links were replayed; undefined otherwise — never a near match. */
export function scorecardFor(
  chain: PlaybookChain,
  cards: readonly ChainScorecard[],
): ChainScorecard | undefined {
  const shape = chainShape(chain);
  return cards.find((c) => c.shape === shape);
}
