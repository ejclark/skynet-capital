/**
 * THE STORE BY STRATEGY (#4469 slice 3a) — one card per strategy, a row per pair (a strategy on a
 * ticker), each row carrying its evidence in words. Eric, 2026-10-06: "The intent of the playbooks
 * was to be agnostic with the stock symbols as configuration option." So the wheel is one card and
 * CRWV is a row on it, not a card of its own.
 *
 * Every row's `id` is its pair's id — the id every subscription, verdict and guard already keys on
 * (criterion 8) — so subscribing to "the wheel on CRWV" posts `CRWV-WHEEL`, and nothing is composed
 * from the strategy and the ticker.
 *
 * Catalog only: no account is read here. `observatory/playbook-store-json-view.ts` joins the
 * viewer's own subscriptions onto the rows. The per-playbook `cards` stay beside this for one
 * release, so the app keeps rendering while slice 3b moves it onto these.
 */
import {
  EVIDENCE_STATUS,
  type EvidenceStatus,
  isStale,
  type Pair,
  type PairEvidence,
  pairTable,
  STRATEGIES,
  type Strategy,
  type StrategyId,
  statusLabel,
} from "../playbooks/pair-table.js";
import { researchHref } from "./playbook-probe.js";

export interface PairRowEntry extends PairEvidence {
  /** The pair id — the one key every join and write uses. */
  readonly id: string;
  readonly symbols: readonly string[];
  /** "✓ researched, weakened" — glyph plus words, so the status never rides on a hue or a glyph
   *  alone (criterion 10); "· past its shelf date" appended once stale. */
  readonly statusLabel: string;
  /** A ✓ verdict past its shelf date: shown, and closed to new subscriptions (criterion 4). */
  readonly stale: boolean;
  /** `study` as its route on the research shelf — this pair's own study, one verdict per pair. */
  readonly studyHref?: string;
}

export interface StrategyCardEntry extends Pick<Strategy, "name" | "instrument"> {
  readonly strategy: StrategyId;
  readonly screen?: string;
  readonly noScreen?: string;
  /** Its pairs by evidence: ✓ first, then ◆ ~ ✗ ? –, table order within a status. */
  readonly pairs: readonly PairRowEntry[];
}

const EVIDENCE_ORDER = Object.keys(EVIDENCE_STATUS) as EvidenceStatus[];

const rank = (pair: Pair): number => EVIDENCE_ORDER.indexOf(pair.evidence.status);

function rowOf(pair: Pair, asOfIso: string): PairRowEntry {
  const stale = isStale(pair.evidence, asOfIso);
  const href = pair.evidence.study ? researchHref(pair.evidence.study) : undefined;
  return {
    ...pair.evidence,
    id: pair.id,
    symbols: pair.symbols,
    statusLabel: stale
      ? `${statusLabel(pair.evidence)} · past its shelf date`
      : statusLabel(pair.evidence),
    stale,
    ...(href ? { studyHref: href } : {}),
  };
}

/** Every strategy that has at least one pair, in the order its first pair appears in the table
 *  (the registry's roster order), each with its rows. */
export function strategyCatalog(asOfIso: string): readonly StrategyCardEntry[] {
  const byStrategy = new Map<StrategyId, Pair[]>();
  for (const pair of pairTable()) {
    byStrategy.set(pair.strategy, [...(byStrategy.get(pair.strategy) ?? []), pair]);
  }
  return [...byStrategy].map(([id, pairs]) => {
    const { name, instrument, screen, noScreen } = STRATEGIES[id];
    return {
      strategy: id,
      name,
      instrument,
      ...(screen ? { screen } : {}),
      ...(noScreen ? { noScreen } : {}),
      pairs: [...pairs].sort((a, b) => rank(a) - rank(b)).map((pair) => rowOf(pair, asOfIso)),
    };
  });
}
