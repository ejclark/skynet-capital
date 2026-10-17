import { type StudyLedger, withStudies } from "./claim-studies.js";
import type { Conviction } from "./conviction-record.js";
import studyLedger from "./conviction-studies.json";

/**
 * What the claim-study runner found, by conviction id (#5482 slice 3): written by
 * `npm run research:claims`, never by hand. It attaches to a claim only while the claim still says
 * exactly what it said when it was studied.
 */
const STUDIES = studyLedger as unknown as StudyLedger;

/**
 * THE SEEDED CONVICTIONS (#5482 slice 2) — the records that exist before members can write their
 * own (slice 6). Each is transcribed from its call sheet under `docs/research/convictions/`, one
 * claim per row, and the sheet stays the source: a re-read there is a change here.
 *
 * Paper only; educational. Nothing here sizes or places a trade.
 */

/**
 * Eric's AI-dip view, 2026-10-16 (`docs/research/convictions/ai-dip-2026-10.md`). It steers the two
 * CRWV pairs that run as his conviction. S1-NVDA is claim 5's study, so the claim cites it and the
 * record does not steer it (the doc's "one result counts twice"). Its check date is the one both
 * pair rows already carry, so pointing a subscription at it changes no check day.
 */
const AI_DIP_STATED: Conviction = {
  id: "ai-dip-2026-10",
  owner: "Eric",
  statedOn: "2026-10-16",
  checkOn: "2027-01-29",
  source: "docs/research/convictions/ai-dip-2026-10.md",
  steers: ["CRWV-WHEEL", "CRWV-LONG-CALL"],
  // What the call sheet's "What it steers" table writes, now enforced (#5482 slice 4). Each only
  // tightens the pair's own bounds; the wheel's 30-day minimum and every exit are untouched.
  narrowings: [
    {
      // Strike at or under the cycle detector's floor band median when it sells (claim 7's study).
      pair: "CRWV-WHEEL",
      fromClaims: ["1", "2a", "7"],
      narrow: [{ kind: "strike-ceiling", ceiling: { floorOfClaim: "7" } }],
    },
    {
      // Expiry on or after 2027-03-18; no buys or adds from CRWV's blackout until 6 sessions after
      // the print (claims 2b, 8, 9).
      pair: "CRWV-LONG-CALL",
      fromClaims: ["2b", "8", "9"],
      narrow: [
        { kind: "expiry-from", day: "2027-03-18" },
        { kind: "quiet", sessionsAfterPrint: 6 },
      ],
    },
  ],
  claims: [
    {
      tag: "overrated",
      statement: "1. CRWV premiums are rich after the drop: puts overprice CRWV's downside.",
      bucket: "tested",
      evidence:
        "Premium fit re-run 2026-10-16: 30-day implied vol 93.2%, 63rd pct of CRWV's next-30-day outcomes (6th on 10-02); Δ0.20 put priced 20.1% vs 24.8% historical. Half right: cheap to fair, not rich (docs/research/crwv-premium-fit.md).",
      falsifier:
        "A premium-fit re-run on or after 2026-11-13 shows implied vol at or above the 50th pct and priced assignment odds above the historical.",
      scoreBy: "2026-11-20",
    },
    {
      tag: "overrated",
      statement: "2a. Sell puts before the print: the pre-print premium is worth selling.",
      bucket: "tested",
      evidence:
        "The only expiry before the ~11-09 print is 11-06, 21 days out, under the wheel's 30-day minimum. Its $54 put is priced at 20% odds; analogs finished under it 16–24%.",
      falsifier:
        "The $54 11-06 put and the next 2 pre-print Δ0.20 puts all expire worthless, the first on 2026-11-06.",
      scoreBy: "2026-11-06",
    },
    {
      tag: "underrated",
      statement:
        "2b. Buy calls after the print: post-print value after the vol crush, about 6 sessions after.",
      bucket: "forward",
      evidence:
        "CRWV fell from the day after the print to 5 sessions later in 5 of 5 prints. The crush's size is unmeasured: no implied-vol history is recorded.",
      falsifier:
        "CRWV's close from the day after the ~11-09 print to 5 sessions later is positive.",
      scoreBy: "2026-11-25",
    },
    {
      tag: "underrated",
      statement: "3. Backlog and NVIDIA's stake cushion the downside.",
      bucket: "untestable",
      evidence:
        "No fundamentals feed in the repo. The only sourced figure: backlog $104B, excluding $25B+ of fresh Q3 commitments (CoreWeave IR, 08-11). Size zero.",
      falsifier: "The Q3 print (honest window to 2026-11-16) reports backlog below $104B.",
    },
    {
      tag: "overrated",
      statement:
        "4. Election-season sentiment against AI spending is a headwind priced as lasting.",
      bucket: "forward",
      evidence:
        "The midterm ledger (10-16) traced the AI-energy basket's two big moves to non-political causes (events/midterm-elections-2026-11-03.md).",
      falsifier:
        "The AI-infrastructure basket beats QQQ from close 11-03 to close 11-06 by more than its own 3-session 75th pct.",
      scoreBy: "2026-11-09",
    },
    {
      tag: "underrated",
      statement: "5. NVDA runs up into its print. Already S1-NVDA's study; adds no size.",
      bucket: "tested",
      evidence:
        "15 of 15 modern 20-session run-ups positive, p=0.0032 (events/nvda-2026-11-18-print.md; cited, not steered).",
      falsifier:
        "Close D-20 to print-day close is negative this print (FT-nvda-2026-11-18-print-3).",
      scoreBy: "2026-11-30",
    },
    {
      tag: "underrated",
      statement: "6. In the long run, AI adopters win. A worldview; it never sizes a trade.",
      bucket: "untestable",
      evidence: "Its horizon is years; this conviction's is 3 to 6 months. No study spans it.",
      falsifier: "Nothing can by 2027-01-29. A steered trade sized on it is the failure.",
    },
    {
      tag: "underrated",
      statement:
        "7. The floor: more pullback first. CRWV's floor is probably $48–$52, likely after the print.",
      bucket: "tested",
      evidence:
        "37 past episodes in today's conditions fell a further 17% (median); the low came ~23 sessions in (cycle-phase-crwv-nvda-2026-10.md).",
      falsifier: "CRWV's lowest close 2026-10-16 to 2027-01-19 lands outside $41.0–$60.9.",
      scoreBy: "2027-01-20",
    },
    {
      tag: "overrated",
      statement:
        "8. How long the drop lasts: back above today's price in 3 to 6 months is the base case.",
      bucket: "tested",
      evidence:
        "Analogs got back to their entry in 14 / 37 / 72 sessions (25th / median / 75th pct); 30% regained the old high within 126.",
      falsifier: "No CRWV close at or above $63.15 by 2027-02-01.",
      scoreBy: "2027-02-02",
    },
    {
      tag: "underrated",
      statement:
        "9. Hold through earnings toward the recovery: CRWV's print moves run larger than priced.",
      bucket: "tested",
      evidence:
        "Options priced CRWV's Q2 move at ~15.5% against ~18.6% realized; the session after fell in 5 of 6 prints (events/crwv-2026-11-10-print.md).",
      falsifier:
        "The ~11-09 print and the next 2 all move less than their priced straddle, the first read by 2026-11-17.",
      scoreBy: "2026-11-17",
    },
  ],
};

/** The AI-dip view with what the studies found attached to each claim it could be run for. */
export const AI_DIP_2026_10: Conviction = withStudies(
  AI_DIP_STATED,
  STUDIES[AI_DIP_STATED.id] ?? [],
);

/** Every seeded conviction, in the order they were stated. */
export const SEEDED_CONVICTIONS: readonly Conviction[] = [AI_DIP_2026_10];
