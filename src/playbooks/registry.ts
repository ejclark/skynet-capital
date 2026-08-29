/**
 * The house playbook roster — every play that survived the red team, encoded with its own
 * window shape and its evidence citation. Enablement is DARK by default: nothing here runs
 * until SKYNET_PLAYBOOKS names it (e.g. "S1-NVDA:standard,G1-GOOG:conservative"), and flipping
 * that env in production goes through the approval-gated autonomy-ops workflow — live
 * enablement stays Eric's single credentialed step (plan → autonomy envelope).
 */
import { etTimeOf, recentPrint } from "../domain/earnings-calendar.js";
import type { PlaybookMode } from "../domain/types.js";
import { TACO_TIMING, tacoWindow } from "../news/taco-signal.js";
import { type EnabledPlaybook, type Playbook, printWindow } from "./playbook.js";

/** Post-print hygiene shared by every date-keyed play: a position that somehow survived its
 *  print (missed exit, process restart) is exited on the first cycle after — never carried. */
const POST_PRINT_FLAT_DAYS = 3;

/**
 * S1-NVDA — the positioning bid, NVDA only (demoted from all-symbols by the eight-symbol
 * sweep: it failed its controls on six of eight peers). Long from D-20, flat at D-5 — the
 * final week is NVDA's dead zone (D-5→D −0.77%, 50% win).
 */
export const S1_NVDA: Playbook = {
  id: "S1-NVDA",
  symbol: "NVDA",
  thesis: "pre-print positioning bid, exited before the dead final week",
  evidence: "docs/research/nvda-earnings-cycle.md F1-F2: +9.08% mean D-20→D-5 era, 14/14, P=0.004",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState(asOfIso, calendar) {
    if (recentPrint("NVDA", asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
      return "flat";
    }
    const w = printWindow("NVDA", asOfIso, calendar);
    if (!w) {
      return "no-window";
    }
    if (w.days >= 6 && w.days <= 20) {
      // Date policy: only a confirmed IR date opens the window; an estimate stays dark.
      return w.confirmed ? "long" : "no-window";
    }
    // Inside D-5 (or past the print): whatever we hold, we should not — the play is over.
    return w.days <= 5 ? "flat" : "no-window";
  },
};

/**
 * G1-GOOG — the sweep's sole surviving pre-print long outside NVDA, with a deliberately
 * different exit: hold to the CLOSE of day D (GOOG's final week is not dead money), still
 * never holding the print itself (release is after the close; we exit at ~15:45 ET with a
 * hard next-day failsafe).
 */
export const G1_GOOG: Playbook = {
  id: "G1-GOOG",
  symbol: "GOOG",
  thesis: "pre-print run-up held to the close of print day, flat before the release",
  evidence:
    "docs/research/multi-symbol-sweep.md G1: pooled 37/43 positive, p=0.0008 at measured base; net-of-QQQ positive all eras",
  size: { conservative: 0.01, standard: 0.015, aggressive: 0.02 },
  desiredState(asOfIso, calendar) {
    if (recentPrint("GOOG", asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
      return "flat"; // failsafe: the close exit was missed — exit on the first post-print cycle
    }
    const w = printWindow("GOOG", asOfIso, calendar);
    if (!w) {
      return "no-window";
    }
    if (w.days === 0) {
      // Print day: ride to the close, exit before it (release is after hours).
      return etTimeOf(asOfIso) >= "15:45" ? "flat" : w.confirmed ? "long" : "flat";
    }
    return w.days <= 20 && w.confirmed ? "long" : "no-window";
  },
};

const TACO_SYMBOL = "DJT";

/**
 * TACO-DJT — the event-driven counterpart to the two date-keyed plays above (#778, "TACO
 * Trades," Eric's 2026-08-28 UX research note, verbatim in the issue). Where S1-NVDA and
 * G1-GOOG ask "how many days to the print," this play asks "did a qualifying Trump-linked pump
 * story just fire" — a question the calendar can't answer. `src/news/taco-signal.ts` (PR #786,
 * phase 1 of #778) already ships that detector, pure and unregistered; this is phase 2 — the
 * playbook that actually reads it, via `playbook.ts`'s new optional `events` input.
 *
 * TIMING, PER ERIC'S 0DTE NOTE ("immediate action to enter position, and quick to exit before
 * the collapse... waiting too long to enter risks entering at the peak"): `TACO_TIMING` encodes
 * a 15-minute entry window and a 90-minute total hold before the play converges to flat — the
 * same "flatten before the reversion" shape S1/S2 already use for a print date, applied here to
 * an event instead. Those two numbers are UNVALIDATED — see `evidence` below.
 *
 * HONESTY GAP — READ BEFORE ENABLING. `desiredState` only reacts to whatever `events` the caller
 * hands it; nothing in this repository yet polls Alpaca's news feed, runs `detectTacoSignals`,
 * and threads the result through `withPlaybooks`/`playbookIntents`'s `events` parameter into the
 * live runner (`src/scripts/run-autonomous.ts` / `autonomous-live-wiring.ts`). That live wiring
 * is deliberately deferred to a follow-up slice (see the PR that added this play). Until it
 * lands, naming "TACO-DJT" in `SKYNET_PLAYBOOKS` arms a playbook that will never see an event
 * and therefore never trade — dark by construction, not a silent "always long."
 *
 * WATCHLIST, V1 — DJT ONLY. Trump Media & Technology Group is the one name whose majority
 * ownership is public SEC record; `src/news/taco-signal.ts`'s own doc explains why "Trump-
 * adjacent" is a maintained list, never inferred from article text. This is a STARTING POINT,
 * not an exhaustive list of Trump-linked tickers — widening it means registering another
 * `TACO-<SYMBOL>` playbook (one symbol per playbook, per `playbook.ts`'s own contract), not
 * editing this constant.
 */
export const TACO_DJT: Playbook = {
  id: "TACO-DJT",
  symbol: TACO_SYMBOL,
  thesis:
    `decisive entry within ${TACO_TIMING.entryMinutes}m of a Trump-linked pump story, decisive ` +
    `exit by ${TACO_TIMING.holdMinutes}m before the "no substance" reversion`,
  evidence:
    "Eric, 2026-08-28 UX research note (verbatim in issue #778) — a stated hypothesis, not yet " +
    "a research doc. No docs/research/ citation exists for this play; TACO_TIMING's 15m entry / " +
    "90m hold are unvalidated defaults chosen to encode the shape of the note, not a measured " +
    "edge. A backtest against recorded events is what would earn this an evidence line.",
  // Below S1-NVDA (0.01-0.03) and G1-GOOG (0.01-0.02): an unvalidated, event-driven play sized
  // more cautiously than the evidence-backed date-keyed ones until a backtest earns it more.
  size: { conservative: 0.005, standard: 0.01, aggressive: 0.015 },
  desiredState(asOfIso, _calendar, events = []) {
    const own = events.filter((event) => event.symbol === TACO_SYMBOL);
    if (own.length === 0) {
      // Never signaled: correctly dark, exactly like a date-keyed play with no upcoming print.
      return "no-window";
    }
    const stillLive = own.some((event) => {
      const window = tacoWindow(event, asOfIso);
      return window === "enter" || window === "hold";
    });
    // At least one event exists but none is still live: converge to flat — the same post-event
    // hygiene S1/G1 apply after a print, so a position never silently rides past its window.
    return stillLive ? "long" : "flat";
  },
};

const ROSTER: readonly Playbook[] = [S1_NVDA, G1_GOOG, TACO_DJT];
const MODES = new Set<string>(["conservative", "standard", "aggressive"]);

/**
 * Parse SKYNET_PLAYBOOKS ("id:mode,id:mode"; mode defaults to standard). Unknown ids and
 * malformed modes are refused loudly via the returned `rejected` list — a typo that silently
 * enabled nothing would look exactly like a quiet market.
 */
export function enabledPlaybooks(env: Readonly<Record<string, string | undefined>>): {
  readonly enabled: EnabledPlaybook[];
  readonly rejected: string[];
} {
  const raw = (env.SKYNET_PLAYBOOKS ?? "").trim();
  if (!raw) {
    return { enabled: [], rejected: [] };
  }
  const enabled: EnabledPlaybook[] = [];
  const rejected: string[] = [];
  for (const token of raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const [id, modeRaw] = token.split(":");
    const playbook = ROSTER.find((p) => p.id === id);
    const mode = (modeRaw ?? "standard") as PlaybookMode;
    if (!(playbook && MODES.has(mode))) {
      rejected.push(token);
      continue;
    }
    enabled.push({ playbook, mode });
  }
  return { enabled, rejected };
}
