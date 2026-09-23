/**
 * THE PLAYBOOK STORE's catalog copy (issue #885) — the UI-facing structure Eric asked for
 * (description, enter, exit-take-profit, exit-cut-losses, hold, metrics), explicitly a first cut
 * he called "continually refined," not a frozen schema.
 *
 * Unlike the traits (derived by walking the play, `playbook-probe.ts`), this copy is hand-authored —
 * the same category as `Playbook.thesis`/`evidence`, just structured into the shape Eric named
 * rather than one sentence. Keyed by playbook id so a house playbook missing an entry here still
 * renders (falls back to its own `thesis`), rather than the catalog silently dropping it.
 */
import type { PlaybookMode } from "../domain/types.js";
import type { Playbook } from "../playbooks/playbook.js";
import {
  evidenceHref,
  housePlaybooks,
  type PlayTrait,
  probeWindow,
  spanOf,
  traitsOf,
} from "./playbook-probe.js";

interface PlaybookStoreCopy {
  readonly description: string;
  readonly enter: string;
  readonly exitTakeProfit: string;
  readonly exitCutLosses: string;
  readonly hold: string;
}

/** One named, display-ready fact about a playbook's performance (#885/#3543) — a plain label +
 *  an honest value string, so "not yet measured" reads exactly like a real rate rather than a
 *  blank the client has to special-case. */
export interface PlaybookMetric {
  readonly label: string;
  readonly value: string;
}

export interface PlaybookStoreEntry extends PlaybookStoreCopy {
  readonly id: string;
  readonly symbol: string;
  /** The whole basket (#3564). `symbol` stays as its first entry for existing readers; the card
   *  shows every name, so a ten-name tactical basket never reads as one ticker. */
  readonly symbols: readonly string[];
  /** The citation the playbook carries — verbatim from the registry — and, when it names a
   *  research doc we serve, that doc's route. Ported from the retired Plays cards (#3623). */
  readonly evidence: string;
  readonly evidenceHref?: string;
  /** The date window read off the playbook by the probe ("D-20 to D-6"), and its target exposure
   *  per mode. Absent for a tactical playbook, which has no window — its rules are the copy above. */
  readonly window?: string;
  readonly size?: Readonly<Record<PlaybookMode, number>>;
  /** Probe-proven traits ("Confirmed dates only"…) — empty when nothing was proven. */
  readonly traits: readonly PlayTrait[];
  /** Performance/eval data for the playbook (#885: "shape TBD"; #3543 slice 2 fills it in). Empty
   *  at the catalog level — this function has no account to measure against; an account-scoped
   *  caller (`playbook-store-json-view.ts`) adds to it. */
  readonly metrics: readonly PlaybookMetric[];
}

const COPY: Readonly<Record<string, PlaybookStoreCopy>> = {
  "S1-NVDA": {
    description:
      "Pre-print positioning bid, NVDA only — long the run-up, out before the dead final week.",
    enter: "From D-20 to D-6 ahead of a CONFIRMED earnings date. An estimated date stays dark.",
    exitTakeProfit: "No separate take-profit — the thesis is the window, not a price target.",
    exitCutLosses:
      "Flat from D-5 through the print — the final week is NVDA's dead zone regardless of price.",
    hold: "No confirmed date in range, or already inside D-5: flat and waiting.",
  },
  "G1-GOOG": {
    description:
      "Pre-print run-up held to the close of print day — GOOG's final week is not dead money, but the print itself never is.",
    enter: "From D-20 to D-1 ahead of a CONFIRMED earnings date.",
    exitTakeProfit:
      "Rides to the close of print day itself, then exits — the position, not a price level, defines the win.",
    exitCutLosses:
      "Exits by ~15:45 ET on print day, before the after-hours release; a missed exit fails safe flat the next cycle.",
    hold: "No confirmed date in range: flat and waiting.",
  },
  "TACO-DJT": {
    description:
      "Event-driven, DJT only — decisive entry within minutes of a Trump-linked pump story, decisive exit before the reversion.",
    enter:
      "Within the entry window of a detected qualifying story — there is no calendar date to wait for.",
    exitTakeProfit:
      "No separate take-profit — converges to flat once the hold window elapses, win or lose.",
    exitCutLosses:
      "Converges to flat once the hold window elapses with no live signal — the same discipline as a missed print exit.",
    hold: "No qualifying story detected: correctly dark, same as a date-keyed play with no upcoming print.",
  },
  "HC-SAURON": {
    description:
      "Research-volume mode across a ten-name tech universe — the goal is trade COUNT for a confidence-rating dataset, not P/L. Small, frequent tranches probe every sentiment extreme and every momentum run, never one big bet.",
    enter:
      "Small tranches on panic (mean-reversion) or an ordinary momentum run (no extreme required) — loosened thresholds trade far more often than the standard read of the same signals.",
    exitTakeProfit:
      "Takes half off into exhausted euphoria, letting the rest ride for the next signal — never one all-or-nothing exit.",
    exitCutLosses:
      "A universal momentum stop closes the WHOLE position the moment the thesis breaks, regardless of which tranche opened it.",
    hold: "Quiet conditions (no extreme, no run): does nothing that cycle.",
  },
};

function entryOf(playbook: Playbook): PlaybookStoreEntry {
  const copy = COPY[playbook.id] ?? {
    description: playbook.thesis,
    enter: "Not yet documented for this playbook.",
    exitTakeProfit: "Not yet documented for this playbook.",
    exitCutLosses: "Not yet documented for this playbook.",
    hold: "Not yet documented for this playbook.",
  };
  const href = evidenceHref(playbook);
  const probe = playbook.tactics ? undefined : probeWindow(playbook);
  return {
    id: playbook.id,
    symbol: playbook.symbols[0] ?? "",
    symbols: playbook.symbols,
    evidence: playbook.evidence,
    ...(href ? { evidenceHref: href } : {}),
    ...(probe ? { window: spanOf(probe), size: playbook.size } : {}),
    traits: probe ? traitsOf(probe) : [],
    metrics: [],
    ...copy,
  };
}

/** The whole Playbook Store catalog, derived fresh on each call — a new registered playbook is
 *  browsable immediately, with a plain fallback until its copy is authored. */
export function playbookStoreCatalog(): readonly PlaybookStoreEntry[] {
  return housePlaybooks().map(entryOf);
}
