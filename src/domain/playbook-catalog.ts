import { TRADE_TYPES, type TradeTypeCode } from "./trade-types.js";

/**
 * MILESTONE M·03 — PLAYBOOKS, the human-side catalog (the Claude Design canvas "Alpaca onboarding
 * process streamline", 2026-09-02; IA in #1119). A playbook here is a strategy a member first runs
 * BY HAND on the desk; once the rung that proves it is earned, the playbook is unlocked — a
 * preview of automation that drafts the ticket and waits for the member's confirm.
 *
 * WIP — SEASON 1, honestly labelled: nothing here arms, fires, or drafts yet. The catalog exists so
 * the table of contents can show what fills will earn, and so the arming that lands with Season 1
 * has a stable set of ids to attach to. Unlock criteria are the rungs the ladder already proves by
 * fill (`progression.ts`); the canvas's profit-based criteria ("premium kept ≥ 1%") need realized
 * P/L matching the ledger doesn't do yet, and are stated here as what arrives later, never as met.
 *
 * Deliberately separate from `src/playbooks/` (the BOT roster — env-gated house plays, #783); a
 * member's earned automation and a persona's configuration are different axes.
 */

export interface HumanPlaybook {
  readonly id: string;
  readonly glyph: string;
  readonly title: string;
  readonly kind: string;
  readonly detail: string;
  /** The ladder rung whose fill unlocks this playbook. */
  readonly unlocksAfter: TradeTypeCode;
  /** The Season-1 criterion, stated as what is coming — never claimed as met. */
  readonly seasonOneCriteria: string;
}

export const HUMAN_PLAYBOOKS: readonly HumanPlaybook[] = [
  {
    id: "accumulator",
    glyph: "⬒",
    title: "Blue-chip accumulator",
    kind: "AUTO-DRAFT · BUYS",
    detail:
      "Drafts a recurring buy of your core holding on a schedule you set, sized to your buying power.",
    unlocksAfter: "102",
    seasonOneCriteria: "buy + sell a stock with a net positive result",
  },
  {
    id: "wheel-put",
    glyph: "◑",
    title: "Wheel · put leg",
    kind: "AUTO-DRAFT · CSP",
    detail:
      "Watches your watchlist for puts at strikes you'd buy, ~30 delta, and drafts the cash-secured ticket.",
    unlocksAfter: "201",
    seasonOneCriteria: "one cash-secured put filled, premium kept ≥ 1% of secured cash",
  },
  {
    id: "wheel-call",
    glyph: "◐",
    title: "Wheel · call leg",
    kind: "AUTO-DRAFT · COVERED CALL",
    detail:
      "When you hold 100+ shares, drafts a covered call above your cost basis at your target premium.",
    unlocksAfter: "202",
    seasonOneCriteria: "one covered call filled above cost basis",
  },
  {
    id: "hedge",
    glyph: "◮",
    title: "Portfolio hedge",
    kind: "AUTO-DRAFT · LONG PUTS",
    detail:
      "Drafts a protective put when your portfolio concentration crosses the threshold you set.",
    unlocksAfter: "302",
    seasonOneCriteria: "one long put + one long call filled, ≥ 2% margin on the round trip",
  },
];

export const PLAYBOOKS_MILESTONE = {
  id: "playbooks",
  code: "M·03",
  title: "Playbooks",
  desc: "Prove a play by hand, then arm it to draft tickets for you. WIP — Season 1.",
} as const;

export interface HumanPlaybookState extends HumanPlaybook {
  /** The unlocking rung's name, for the criteria line. */
  readonly unlocksAfterName: string;
  /** True when the unlocking rung is earned by a real fill. */
  readonly unlocked: boolean;
}

/** Fold the earned rung codes into the catalog. Pure and total — the fills ARE the progress. */
export function derivePlaybooks(earnedCodes: ReadonlySet<TradeTypeCode>): {
  readonly playbooks: readonly HumanPlaybookState[];
  readonly unlocked: number;
  readonly total: number;
} {
  const playbooks = HUMAN_PLAYBOOKS.map((p) => ({
    ...p,
    unlocksAfterName: TRADE_TYPES.find((t) => t.code === p.unlocksAfter)?.name ?? p.unlocksAfter,
    unlocked: earnedCodes.has(p.unlocksAfter),
  }));
  return {
    playbooks,
    unlocked: playbooks.filter((p) => p.unlocked).length,
    total: playbooks.length,
  };
}
