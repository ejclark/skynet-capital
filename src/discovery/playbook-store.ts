/**
 * THE PLAYBOOK STORE's catalog copy (issue #885) — the UI-facing structure Eric asked for
 * (description, enter, exit-take-profit, exit-cut-losses, hold, metrics), explicitly a first cut
 * he called "continually refined," not a frozen schema.
 *
 * Unlike `play-cards.ts`'s traits (derived by walking the play), this copy is hand-authored —
 * the same category as `Playbook.thesis`/`evidence`, just structured into the shape Eric named
 * rather than one sentence. Keyed by playbook id so a house playbook missing an entry here still
 * renders (falls back to its own `thesis`), rather than the catalog silently dropping it.
 */
import type { Playbook } from "../playbooks/playbook.js";
import { housePlaybooks } from "./playbook-probe.js";

interface PlaybookStoreCopy {
  readonly description: string;
  readonly enter: string;
  readonly exitTakeProfit: string;
  readonly exitCutLosses: string;
  readonly hold: string;
}

export interface PlaybookStoreEntry extends PlaybookStoreCopy {
  readonly id: string;
  readonly symbol: string;
  /** Performance/eval data for the playbook — shape TBD (Eric, #885), empty for now. */
  readonly metrics: readonly never[];
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
};

function entryOf(playbook: Playbook): PlaybookStoreEntry {
  const copy = COPY[playbook.id] ?? {
    description: playbook.thesis,
    enter: "Not yet documented for this playbook.",
    exitTakeProfit: "Not yet documented for this playbook.",
    exitCutLosses: "Not yet documented for this playbook.",
    hold: "Not yet documented for this playbook.",
  };
  return { id: playbook.id, symbol: playbook.symbol, metrics: [], ...copy };
}

/** The whole Playbook Store catalog, derived fresh on each call — a new registered playbook is
 *  browsable immediately, with a plain fallback until its copy is authored. */
export function playbookStoreCatalog(): readonly PlaybookStoreEntry[] {
  return housePlaybooks().map(entryOf);
}
