/**
 * DECLARED RESEARCH SIGNALS (#4808 slice 1) — what each house playbook trades on, as research can
 * run it. Eric, 2026-10-07: "Playbooks offer a structured mechanic to drive research." A playbook
 * names its signals here: what each one measures, the one deterministic command that computes it for
 * any ticker, the fixed line the playbook acts on, and how often it is re-run. A playbook with no
 * such signal says so, in words, and says why — never a fake signal to satisfy a check.
 *
 * WHY IT IS NOT #4469's FIT SCREEN AGAIN. `STRATEGIES[...].screen` (pair-table.ts) answers "does
 * this ticker fit the strategy" once, when it is added. A declaration here is per playbook, carries
 * the threshold and a refresh cadence, and names what no instrument measures yet — the three things
 * the research lane needs to schedule a pair (slice 2) and a candidate needs to be back-tested
 * (slice 3). A spec holds the first signal's instrument to the strategy's screen, so the two never
 * name different studies for one pair. Falsifier (the plan's): by 2026-11-15 these turn out to be
 * the fit criteria's text with nothing added → fold this into #4469.
 *
 * KEYED BY PLAYBOOK ID, beside the pair table rather than on each builder: research runs per
 * playbook × ticker (#4469 decision 3) and the Store row reads it by the same id. Every registered
 * playbook must have an entry — `tests/playbooks/research-signals.spec.ts` fails `npm test`
 * otherwise (criterion 1).
 *
 * The instruments stay scripts: a signal is computed, never written by a token-spending session.
 */

/** How often a signal is re-run. A print-keyed study only changes when a new report lands. */
export type SignalCadence = "after-each-print" | "weekly";

export interface ResearchSignal {
  /** What it measures, in a member's words. */
  readonly measures: string;
  /** The one command that computes it for any ticker, `<SYM>` for the ticker. Deterministic, zero
   *  tokens. */
  readonly instrument: string;
  /** The line the playbook acts on, written down before any run, with its number — never "e.g."
   *  (the sweep's first missing research step, #4808 decision 3). */
  readonly threshold: string;
  readonly cadence: SignalCadence;
  /** The bots' pass computes this signal itself: the playbook's `long` verdict IS the signal
   *  holding (the run-up's date window into a report). Absent: only a research run measures it, so
   *  no pass can say it was raised — the playbook funnel (#4450 slice 5b) shows that stage as not
   *  measured, never as zero. */
  readonly raisedOnPass?: true;
}

export type PlaybookResearch =
  | {
      readonly kind: "signals";
      readonly signals: readonly [ResearchSignal, ...ResearchSignal[]];
      /** What the playbook depends on that no instrument measures yet, said rather than hidden. */
      readonly unmeasured?: string;
    }
  | {
      readonly kind: "none";
      /** `unvalidated`: its thresholds are baked in with no back-test behind them. `by-design`: it
       *  is not a bet on a ticker (it tests the order path, or gathers evidence). */
      readonly why: "unvalidated" | "by-design";
      readonly reason: string;
    };

const RUN_UP = "node scripts/research/earnings-cycle.mjs <SYM>";
// The instrument's control 1: the 20 sessions into a report against the era's ordinary 20-session
// window. The bar is the family-corrected ~0.001 (docs/research/multi-symbol-sweep.md), said in words
// because a card never prints a p-value; the instrument's own SURVIVES line prints at 0.05, so the
// threshold names the stricter one.
const RUN_UP_BAR =
  "the stock goes up over the 20 sessions before more of its reports since 2023 than an ordinary 20-session stretch does, by more than a 1-in-1,000 fluke would explain (the house bar)";

const runUp = (measures: string): ResearchSignal => ({
  measures,
  instrument: RUN_UP,
  threshold: RUN_UP_BAR,
  cadence: "after-each-print",
  // S1, G1 and the call spread answer `long` exactly inside the run-up's window on a confirmed date.
  raisedOnPass: true,
});

const dipBounce: ResearchSignal = {
  measures: "buying a 5-minute dip below the session's average price and selling the bounce",
  instrument: "node scripts/research/dip-bounce.mjs <SYM>",
  threshold:
    "buying 2 ranges below and selling 1 range higher makes money after 5 bps a side, and clears the bar for 45 tests (a day-clustered t of 3.5)",
  cadence: "weekly",
};

const HOUSE_RESEARCH: Readonly<Record<string, PlaybookResearch>> = {
  "S1-NVDA": {
    kind: "signals",
    signals: [runUp("the stock's move from 20 trading sessions before a report to 5 before")],
  },
  "G1-GOOG": {
    kind: "signals",
    signals: [runUp("the stock's move from 20 trading sessions before a report to its close")],
  },
  "TACO-DJT": {
    kind: "none",
    why: "unvalidated",
    reason:
      "its 15-minute entry and 90-minute hold are defaults no back-test stands behind, and no news feed is wired to it.",
  },
  "CRWV-WHEEL": {
    kind: "signals",
    signals: [
      {
        measures: "whether options price the next month above what the stock goes on to move",
        instrument: "node scripts/research/premium-fit.mjs <SYM>",
        threshold:
          "the next month's implied volatility, from expiries clear of a report, sits at or above the 60th percentile of the stock's 30-day moves over the past 252 sessions and more than 5 points above their average",
        cadence: "weekly",
      },
    ],
  },
  "CRWV-LONG-CALL": {
    kind: "none",
    why: "unvalidated",
    reason: "no study measures long calls held through reports; it runs on its owner's conviction.",
  },
  "NVDA-CALL-SPREAD": {
    kind: "signals",
    signals: [
      runUp("the run-up it borrows: the move from 20 sessions before a report to 5 before"),
    ],
    unmeasured: "the spread's own profit and loss by delta; no instrument computes it yet.",
  },
  SAURON: {
    kind: "none",
    why: "unvalidated",
    reason:
      "the euphoria and panic lines are built into the persona's rules, and no back-test stands behind them.",
  },
  "BETA-SCOUT": {
    kind: "none",
    why: "by-design",
    reason: "it tests the order path on a quiet day, so no ticker is chosen for a signal.",
  },
  "COND-SCOUT": {
    kind: "none",
    why: "by-design",
    reason:
      "it records simulated probes so a later study has evidence to score; it places no orders.",
  },
  "MU-DIP-BOUNCE": { kind: "signals", signals: [dipBounce] },
  "NBIS-DIP-BOUNCE": { kind: "signals", signals: [dipBounce] },
};

/** A playbook's declaration, or undefined for an id that has none (a member's authored play). */
export function researchOf(playbookId: string): PlaybookResearch | undefined {
  return HOUSE_RESEARCH[playbookId];
}

/**
 * Whether a pass can say this playbook raised its signal (#4450 slice 5b): `counted` when a
 * declared signal is one the pass computes (`raisedOnPass`), `unmeasured` when it declares signals
 * only research runs measure (the wheel's premium, the dip-to-bounce screen), `none` when it
 * declares no research signal or nothing at all (a member's authored play).
 */
export type PassSignal = "counted" | "unmeasured" | "none";

export function passSignalOf(playbookId: string): PassSignal {
  const research = researchOf(playbookId);
  if (research?.kind !== "signals") return "none";
  return research.signals.some((s) => s.raisedOnPass) ? "counted" : "unmeasured";
}

/** Every declared id — the spec holds this equal to the registry. */
export function declaredIds(): readonly string[] {
  return Object.keys(HOUSE_RESEARCH);
}

const CADENCE_WORDS: Readonly<Record<SignalCadence, string>> = {
  "after-each-print": "re-run after each report",
  weekly: "re-run weekly",
};

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** What a Store card says (criterion 1: "its card SHALL say which in words"). */
export function researchLine(research: PlaybookResearch): string {
  if (research.kind === "none") {
    const lead =
      research.why === "unvalidated"
        ? "No research signal (unvalidated)"
        : "No research signal, by design";
    return `${lead}: ${research.reason}`;
  }
  const said = research.signals
    .map(
      (s) => `${capital(s.measures)}. It counts when ${s.threshold}; ${CADENCE_WORDS[s.cadence]}.`,
    )
    .join(" ");
  const gap = research.unmeasured ? ` Not measured yet: ${research.unmeasured}` : "";
  return `Research signal: ${said}${gap}`;
}

/** Why a declaration is not one research can run — empty when it is. */
export function researchProblems(research: PlaybookResearch | undefined): readonly string[] {
  if (!research) return ["declares neither a research signal nor 'no research signal'"];
  if (research.kind === "none") {
    return research.reason.trim() ? [] : ["says it has no research signal but not why"];
  }
  return research.signals.flatMap((signal, i) => {
    const at = `signal ${i + 1}`;
    const problems: string[] = [];
    if (!signal.measures.trim()) problems.push(`${at} does not say what it measures`);
    if (!/^node scripts\/research\/[\w-]+\.mjs <SYM>/.test(signal.instrument))
      problems.push(`${at}'s instrument is not one research script run on <SYM>`);
    if (!/\d/.test(signal.threshold) || /\be\.g\./i.test(signal.threshold))
      problems.push(`${at}'s threshold is not a fixed number`);
    return problems;
  });
}

/** The script a signal's instrument runs, for the spec's on-disk check. */
export function instrumentScript(signal: ResearchSignal): string {
  return signal.instrument.split(" ")[1] ?? "";
}
