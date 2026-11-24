/**
 * The nine Alpaca paper limits #8161's build order leans on and the docs leave unclear (#8256).
 * Each one gets ONE real test on a dedicated paper account before a step relies on it; this file is
 * the list as data (what is asked, when it can run, who reads the answer), and `checks.ts` holds the
 * function that asks it. The README under `docs/research/alpaca-paper-checks/` is rendered from it.
 *
 * Paper only, as a fact: every request goes through `assertPaperTradingHost` (`guard.ts`), on a
 * key read from `SKYNET_PAPER_CHECK_KEY` / `_SECRET` alone, against an account the guard has
 * proved is a `PA…` paper account holding nothing but this tool's own orders.
 */

export type CheckId =
  | "bracket-after-close"
  | "extended-hours"
  | "evening-quotes"
  | "fractional-exits"
  | "account-cap"
  | "options-extended-hours"
  | "same-day-options"
  | "mleg-stock-leg"
  | "newcomer-signup";

export interface CheckSpec {
  readonly id: CheckId;
  /** The question in plain words, as the README prints it. */
  readonly question: string;
  /** When it can run, ET, in words; `windows.ts` holds the same rule as code. */
  readonly window: string;
  /** The step or surface that reads the answer. */
  readonly reader: string;
  /** Set for the two a script cannot answer: why, in words. */
  readonly notScriptable?: string;
}

export const PAPER_CHECKS: readonly CheckSpec[] = [
  {
    id: "bracket-after-close",
    question:
      "Does a bracket with a limit entry, sent while the market is closed, wait for the open?",
    window: "any closed hour; 09:15 to also watch it through the open",
    reader: "step 4 (exit attached at entry)",
  },
  {
    id: "extended-hours",
    question:
      "Do whole-share extended_hours limit orders work on paper, after hours and overnight?",
    window: "16:00-20:00 weekdays; 20:00-04:00 Sunday to Thursday nights",
    reader: "the night-market step",
  },
  {
    id: "evening-quotes",
    question: "Which free feed quotes stocks from 5 to 8pm?",
    window: "17:00-20:00 on a trading day",
    reader: "step 5's practice pick; every price card's source and time",
  },
  {
    id: "fractional-exits",
    question: "Does a bracket, or an OCO, accept a fractional quantity?",
    window: "regular hours",
    reader: "the whole-shares-only first-trade rule",
  },
  {
    id: "account-cap",
    question: "Is it 3 paper accounts per login?",
    window: "not scriptable",
    reader: "bot garages (#5452); fresh-start policy",
    notScriptable:
      "an account key can't see or create other accounts under its login; the login's own dashboard answers it",
  },
  {
    id: "options-extended-hours",
    question: "Do options trade 07:30-09:25 and 16:00-16:15 on paper from Dec 4?",
    window: "07:30-09:25 or the 15 minutes after the close, on or after 2026-12-04",
    reader: "the Scoreboard's game-day phases (step 9)",
  },
  {
    id: "same-day-options",
    question: "What is the per-account limit on contracts expiring today?",
    window: "regular hours, on a day SPY has an expiry",
    reader: "the expiry card and its late rung",
  },
  {
    id: "mleg-stock-leg",
    question: "Can a multi-leg order include a stock leg?",
    window: "regular hours",
    reader: "covered calls as one slip",
  },
  {
    id: "newcomer-signup",
    question: "Does Alpaca's signup accept the newcomer persona (age, region)?",
    window: "not scriptable",
    reader: "step 5 (connect)",
    notScriptable: "signup eligibility is a fact about a person, not something an API key can ask",
  },
];

export const CHECK_IDS: readonly CheckId[] = PAPER_CHECKS.map((c) => c.id);

export function checkSpec(id: CheckId): CheckSpec {
  const spec = PAPER_CHECKS.find((c) => c.id === id);
  if (!spec) throw new Error(`paper-checks: unknown check "${id}"`);
  return spec;
}

/** `--only a,b` → the ids, refusing a name the catalog doesn't hold rather than skipping it. */
export function parseOnly(raw: string | undefined): readonly CheckId[] {
  if (raw === undefined || raw.trim() === "") return CHECK_IDS;
  const ids = raw.split(",").map((s) => s.trim());
  for (const id of ids) {
    if (!CHECK_IDS.includes(id as CheckId)) {
      throw new Error(
        `paper-checks: --only names "${id}", which is not one of ${CHECK_IDS.join(", ")}`,
      );
    }
  }
  return ids as CheckId[];
}

/** Every order this tool places carries a client order id starting with this. */
export const ORDER_PREFIX = "paperchk-";
