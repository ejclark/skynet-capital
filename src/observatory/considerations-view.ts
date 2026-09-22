import type { OutpostCatalog, PlayCard } from "../discovery/play-cards.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";

/**
 * THE CONSIDERATIONS RAIL, AS DATA (#3186 slice 3) — one chip per thing worth a member's attention
 * on `/app/accounts`: a held position that's down enough to be worth a look ("at-risk"), or a house
 * play matching a symbol they already hold ("opportunity"). Composed from numbers `deskView()`
 * already has in hand (no new data source) and `outpostCatalog()` (already served at `/api/outpost`,
 * reused here rather than re-derived).
 *
 * "News signals" are named in the issue's acceptance criteria but have no backing data anywhere in
 * this repo, and this plan authorizes no new external market-data integration — so this view ships
 * at-risk + opportunity only. Omitted honestly, not stubbed with placeholder content.
 */

type Tone = "pos" | "neg" | "flat";

export interface ConsiderationAction {
  readonly label: string;
  readonly href: string;
}

export interface ConsiderationChip {
  readonly id: string;
  readonly kind: "at-risk" | "opportunity";
  readonly symbol: string;
  /** The humanized name (`humanizeOptionSymbol`, matching every other surface) — never the raw
   *  OCC symbol, which is unreadable to a member at a glance. */
  readonly display: string;
  /** Whole dollars (#3186: "shall not render dollar figures with cents") — "—" when the chip has
   *  no live position behind it (an opportunity chip is a play, not a holding). */
  readonly notional: string;
  readonly delta: string;
  readonly deltaTone: Tone;
  readonly reason: string;
  readonly action: ConsiderationAction;
}

/** A position counts as "at risk" once its return is down this much from cost. Informational only
 *  — contrast the account-level risk ladder (`src/risk/risk-ladder.ts`), which gates order flow.
 *  One named, adjustable constant rather than a hidden magic number. */
const AT_RISK_RETURN_PCT = -10;

/** The slice of a desk position this view needs — a subset of what `deskView()` already computes
 *  per position, so the caller passes the raw numbers straight through rather than this module
 *  re-deriving them from a broker position. */
export interface PositionForConsiderations {
  readonly symbol: string;
  readonly display: string;
  readonly marketValue: number;
  readonly totalPl: number;
  /** Return on cost, as a percentage (e.g. -12.5), or `null` when cost basis is 0. */
  readonly returnPct: number | null;
}

function atRiskChip(position: PositionForConsiderations): ConsiderationChip | undefined {
  if (position.returnPct === null || position.returnPct > AT_RISK_RETURN_PCT) return undefined;
  return {
    id: `at-risk-${position.symbol}`,
    kind: "at-risk",
    symbol: position.symbol,
    display: position.display,
    notional: formatCurrency(position.marketValue),
    delta: formatSigned(position.totalPl),
    deltaTone: plClass(position.totalPl),
    reason: `${position.display} is down ${Math.abs(position.returnPct).toFixed(1)}% from cost.`,
    action: {
      label: "View position",
      href: `?section=positions#pos-${encodeURIComponent(position.symbol)}`,
    },
  };
}

function opportunityChip(card: PlayCard): ConsiderationChip {
  return {
    id: `opportunity-${card.id}`,
    kind: "opportunity",
    symbol: card.symbol,
    // Play symbols are the underlying ticker (never an OCC option symbol) — already human-readable.
    display: card.symbol,
    notional: "—",
    delta: card.window,
    deltaTone: "flat",
    reason: card.thesis,
    action: {
      label: "View play",
      // `/outpost` was retired into Research's "Plays" section (#3333 slice 9); this link
      // pre-dates that move and was left pointing at the deleted route (Eric, 2026-09-22: dead
      // link from the considerations rail).
      href: `/app/research?section=plays&symbol=${encodeURIComponent(card.symbol)}`,
    },
  };
}

/** At-risk chips first (a loss outranks a suggestion), then opportunities — one per play matching a
 *  symbol the account already holds. A play the account doesn't hold at all isn't a "consideration"
 *  for this account; the full catalog stays the Outpost's job. */
export function considerationsFor(
  positions: readonly PositionForConsiderations[],
  catalog: OutpostCatalog,
): ConsiderationChip[] {
  const heldSymbols = new Set(positions.map((p) => p.symbol));
  const atRisk = positions
    .map(atRiskChip)
    .filter((chip): chip is ConsiderationChip => chip !== undefined);
  const opportunities = catalog.cards.filter((c) => heldSymbols.has(c.symbol)).map(opportunityChip);
  return [...atRisk, ...opportunities];
}
