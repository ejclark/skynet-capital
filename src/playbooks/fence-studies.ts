import type { Narrowing } from "./conviction-steering.js";

/**
 * WHAT A STUDY CALLED ON EACH FENCE A VIEW PUTS ON A PAIR (#6598 slice 3, criteria 2–4; from #5482
 * criterion 6). When a claim a fence rests on passes, its proposal is to keep the fence on the pair
 * for good (`claim-proposals.ts`, `carry-into-playbook`). A pass is one claim on one tape and the
 * fence was written for one episode, so only a study that restates the fence as a rule and replays
 * it over history may say yes. This table is those studies' calls, one row per pair and fence kind;
 * `npm run research:refine` reads it before it adopts anything.
 *
 * THE THREE CALLS. `dont`: the pass key is refused, and the refusal names the study and its call.
 * `adopt-in-phase`: refused too, because no playbook reads a phase yet; the study says which, and a
 * phase reader is code with its own PR. `adopt`: the row carries the rule, and `research:refine`
 * writes it as a `pair-rule` line in `conviction-adoptions.json` for a HELD PR, so only Eric's merge
 * makes it the pair's own. A fence with no row is refused for want of a study.
 *
 * A RULE HOLDS OUTSIDE THE VIEW (criterion 2). `PairRule` admits only the kinds with no calendar
 * date, no fixed price and no claim of the view in them: days to expiry, a quiet period after the
 * print, a contract cap. A rule a study states in any other shape (a cap off a band rebuilt each
 * day) has no kind yet, so it cannot be a row with `adopt`; the type refuses it. The narrow-only
 * resolver judges the rule against the playbook's bounds when it is adopted and every time a
 * playbook is built (`conviction-steering.ts`), so a rule that would widen one is refused whole.
 *
 * KEEP IN STEP WITH THE DOCS. `question` is the first cell of the study's call-sheet row, and its
 * spec reads the doc to check the call, the confidence and the falsifier's day still match. A
 * re-run that flips a call changes the doc and this row in the same PR. Paper only, SIM; nothing
 * here sizes a trade or places an order.
 */

export type PairRule = Extract<Narrowing, { kind: "dte" | "quiet" | "contracts" }>;

export const PAIR_RULE_KINDS: readonly PairRule["kind"][] = ["dte", "quiet", "contracts"];

interface CallBase {
  readonly pair: string;
  /** The fence this row judges: the narrowing kind a view puts on the pair. */
  readonly fence: Narrowing["kind"];
  /** The study doc whose call sheet holds the call. */
  readonly study: string;
  /** The first cell of the call-sheet row, verbatim. */
  readonly question: string;
  /** The call as the doc bolds it ("Don't, yet"). */
  readonly words: string;
  readonly confidence: "low" | "medium" | "high";
  /** The day of the call's dated falsifier. */
  readonly falsifierOn: string;
}

export type FenceCall =
  | (CallBase & { readonly call: "dont" })
  | (CallBase & { readonly call: "adopt-in-phase"; readonly phase: string })
  | (CallBase & { readonly call: "adopt"; readonly rule: PairRule });

const STUDY_A = "docs/research/wheel-strike-cap-2026-11.md";
const STUDY_B = "docs/research/long-call-fences-2026-11.md";

export const FENCE_CALLS: readonly FenceCall[] = [
  {
    pair: "CRWV-WHEEL",
    fence: "strike-ceiling",
    study: STUDY_A,
    question: "CRWV-WHEEL · make the floor-band cap the pair's own setting after a pass?",
    call: "dont",
    words: "Don't",
    confidence: "medium",
    falsifierOn: "2027-01-29",
  },
  {
    pair: "CRWV-LONG-CALL",
    fence: "expiry-from",
    study: STUDY_B,
    question: "CRWV-LONG-CALL · make the expiry floor the pair's own setting after a pass?",
    call: "dont",
    words: "Don't",
    confidence: "medium",
    falsifierOn: "2027-01-29",
  },
  {
    pair: "CRWV-LONG-CALL",
    fence: "quiet",
    study: STUDY_B,
    question: "CRWV-LONG-CALL · make the 6-session post-print wait the pair's own setting?",
    call: "dont",
    words: "Don't, yet",
    confidence: "low",
    falsifierOn: "2027-01-29",
  },
];

/** The call on one pair's fence, or undefined when no study has judged it. */
export const fenceCall = (
  pair: string,
  fence: Narrowing["kind"],
  calls: readonly FenceCall[] = FENCE_CALLS,
): FenceCall | undefined => calls.find((c) => c.pair === pair && c.fence === fence);

/** One call in a sentence: "`docs/…md` says Don't (medium; proves it wrong 2027-01-29)". */
export const citeCall = (c: FenceCall): string =>
  `\`${c.study}\` says ${c.words} (${c.confidence}; proves it wrong ${c.falsifierOn})`;
