import type { PlaybookStoreEntry } from "../discovery/playbook-store.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";

/**
 * THE CONSIDERATIONS RAIL, AS DATA (#3186 slice 3) — one chip per thing worth a member's attention
 * on `/app/accounts`: a held position that's down enough to be worth a look ("at-risk"), or a house
 * playbook matching a symbol they already hold ("opportunity"). Composed from numbers `deskView()`
 * already has in hand (no new data source) and `playbookStoreCatalog()` (already served at
 * `/api/playbook-store`, reused here rather than re-derived; #3623 moved it off the retired Plays
 * catalog).
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

function opportunityChip(
  entry: PlaybookStoreEntry,
  symbol: string,
  window: string,
): ConsiderationChip {
  return {
    id: `opportunity-${entry.id}-${symbol}`,
    kind: "opportunity",
    symbol,
    // Playbook symbols are the underlying ticker (never an OCC option symbol) — already readable.
    display: symbol,
    notional: "—",
    delta: window,
    deltaTone: "flat",
    reason: entry.description,
    action: {
      label: "View playbook",
      // R&D → Playbooks is the one home for playbooks (#3623); the Plays section this used to
      // link to is retired.
      href: "/app/research?section=playbooks",
    },
  };
}

/** At-risk chips first (a loss outranks a suggestion), then opportunities — one per date-windowed
 *  playbook symbol the account already holds. A playbook the account doesn't hold at all isn't a
 *  "consideration" for this account; the full catalog is R&D → Playbooks' job. Tactical playbooks
 *  (no window) are left out, as the retired Plays catalog left them out: a ten-name research basket
 *  would otherwise chip every big-tech holding with the same suggestion. */
export function considerationsFor(
  positions: readonly PositionForConsiderations[],
  catalog: readonly PlaybookStoreEntry[],
): ConsiderationChip[] {
  const heldSymbols = new Set(positions.map((p) => p.symbol));
  const atRisk = positions
    .map(atRiskChip)
    .filter((chip): chip is ConsiderationChip => chip !== undefined);
  const opportunities = catalog.flatMap((entry) =>
    entry.window === undefined
      ? []
      : entry.symbols
          .filter((symbol) => heldSymbols.has(symbol))
          .map((symbol) => opportunityChip(entry, symbol, entry.window ?? "")),
  );
  return [...atRisk, ...opportunities];
}
