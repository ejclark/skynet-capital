import type { RankedCandidate } from "../../../src/options/recommend";
import type { DraftLeg } from "../live/draft-order";
import type { PlayInfo } from "../live/options";
import { type PlayCode, playForNav } from "../live/plays";

/**
 * PICKING A STRUCTURE OPENS THE CHAIN ON ITS LEGS (#3407, slice 4 — the outlook surface's done
 * line). The Outlook pane proposes; it never places. A pick is a HANDOFF into the flow that already
 * exists: the chain pane, on the structure's own expiry, with its strikes outlined, and the ticket
 * preset to the rung that structure is — which for anything multi-leg is the Spread builder, whose
 * chain taps already add legs (`chain-section.tsx`'s `chainPickLeg`).
 *
 * Two rules, both inherited rather than invented here:
 *
 * - **The rung comes off the LEGS, not the structure's name.** `playForNav` is the one table that
 *   maps a ticket state to a rung; reading "long-call → 302" out of the kind string would be a
 *   second copy of it, free to drift. A multi-leg structure has no single side, so it is 401 by
 *   construction, exactly as `chainPickLeg` treats a spread.
 * - **A locked rung never widens from a pick** — the same fail-safe `chainPickTarget` holds for a
 *   chain tap, and for the same reason (#1461: milestones gate, they never drive). The strikes and
 *   the expiry still travel and the chain still opens on them; only the rung stays put. A rung this
 *   function cannot find in `plays` reads as locked, never as open.
 */

export interface OutlookPick {
  /** The rung to preset, or absent when the structure's rung isn't earned yet. */
  readonly play?: PlayCode;
  /** Every strike the structure sits on, ascending — what the chain outlines. */
  readonly strikes: readonly number[];
  /** The shared expiry its legs sit on, when the chain carried one. */
  readonly expiration?: string;
  /** True when the rung was withheld — the pane says so instead of silently presetting nothing. */
  readonly locked: boolean;
  /** The rung that was withheld, so the pane can name it. */
  readonly lockedPlay?: PlayCode;
}

/** The rung a candidate's legs ARE: one leg is that leg's own option rung, more than one is 401. */
function playForCandidate(candidate: RankedCandidate): PlayCode {
  const legs = candidate.legs;
  if (legs.length !== 1) return "401";
  const leg = legs[0] as RankedCandidate["legs"][number];
  return playForNav({
    instrument: "option",
    side: leg.quantity < 0 ? "sell" : "buy",
    optionType: leg.kind,
  });
}

/**
 * What a pick hands the rest of the page. Pure so the handoff is specced without a DOM — the same
 * reason `chainPickTarget` and `chainPickLeg` sit outside their component.
 */
export function outlookPick(
  candidate: RankedCandidate,
  plays: readonly Pick<PlayInfo, "code" | "locked">[] | undefined,
): OutlookPick {
  const strikes = [...new Set(candidate.legs.map((leg) => leg.strike))].sort((a, b) => a - b);
  const target = playForCandidate(candidate);
  const locked = plays?.find((p) => p.code === target)?.locked ?? true;
  return {
    strikes,
    ...(candidate.expiration === undefined ? {} : { expiration: candidate.expiration }),
    ...(locked ? { locked: true, lockedPlay: target } : { play: target, locked: false }),
  };
}

/**
 * The URL a pick lands on: the CHAIN pane, on the structure's own expiry, with its lowest strike in
 * `?strike=` and the rung preset — unless that rung isn't earned, in which case `pick.play` is
 * already absent above and only the contract travels. Shaped here rather than in the route for the
 * same reason `guidanceSearch` is its own function: a search-param shape is worth reading alone.
 */
export function outlookSearch<T>(prev: T, pick: OutlookPick) {
  return {
    ...prev,
    section: "chain" as const,
    ...(pick.expiration ? { exp: pick.expiration } : {}),
    ...(pick.strikes[0] === undefined ? {} : { strike: String(pick.strikes[0]) }),
    ...(pick.play ? { play: pick.play } : {}),
  };
}

/**
 * THE STRIKES THE CHAIN OUTLINES — the Spread draft's own legs, plus the structure a pick proposed.
 * Both are filtered to the symbol (and, when the pane has committed to one, the expiry) actually on
 * screen, which is the whole reason this is a function rather than two pieces of state: a mark
 * describes a row of THIS chain, and a leg or a proposal about another underlying's chain says
 * nothing about it. `undefined` rather than `[]` when there is nothing to mark, because that is what
 * `ChainSection`'s optional prop means — "no marking", not "mark an empty set".
 */
export function chainMarks({
  symbol,
  expiration,
  legs,
  spread,
  picked,
}: {
  readonly symbol: string;
  /** The expiry the chain pane has browsed to, or `""` before it has committed to one. */
  readonly expiration: string;
  /** The Spread draft's legs — only marked when `spread` says that ticket is the one on screen. */
  readonly legs: readonly DraftLeg[];
  readonly spread: boolean;
  readonly picked?: { readonly symbol: string; readonly strikes: readonly number[] };
}): readonly number[] | undefined {
  const fromLegs = (spread ? legs : [])
    .filter((leg) => leg.underlying === symbol && (!expiration || leg.expiration === expiration))
    .map((leg) => leg.strike);
  const fromPick = picked?.symbol === symbol ? picked.strikes : [];
  const marks = [...new Set([...fromLegs, ...fromPick])];
  return marks.length > 0 ? marks : undefined;
}
