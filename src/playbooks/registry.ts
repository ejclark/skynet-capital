/**
 * The house playbook roster — every play that survived the red team, encoded with its own
 * window shape and its evidence citation. Enablement is DARK by default: nothing here runs
 * until SKYNET_PLAYBOOKS names it (e.g. "S1-NVDA:standard,G1-GOOG:conservative"), and flipping
 * that env in production goes through the approval-gated autonomy-ops workflow — live
 * enablement stays Eric's single credentialed step (plan → autonomy envelope).
 */
import { etTimeOf, recentPrint } from "../domain/earnings-calendar.js";
import type { PlaybookMode } from "../domain/types.js";
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

const ROSTER: readonly Playbook[] = [S1_NVDA, G1_GOOG];
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
