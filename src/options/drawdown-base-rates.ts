import type { Quest } from "../domain/quest.js";

/**
 * THE BASE RATES A CONDITIONS QUEST CARRIES (#7028 slice 3): what the drawdown study measured for
 * each move after an index closed 10% or more under its year high with VIX at 25 or more.
 *
 * Copied from `node scripts/research/drawdown-quest-study.mjs --json=<path>` as run on 2026-11-08
 * and written up in `docs/research/drawdown-quests-2026-11.md`; that page is the source of record
 * and its dated falsifiers say when these go stale (the put 2027-05-31, the shares 2027-03-31).
 * A re-run that moves a number moves it here, in the same PR. Every row reads `underpowered`
 * (fewer episodes than the 32 the declared power needs), so the quest built from it claims no edge.
 *
 * Only the moves the study's call sheet offered are here: the cash-secured put and the shares. The
 * 24-month call is not a default move (below its control on both indexes, worst decile −74%/−98%).
 * PURE data: no I/O, no clock.
 */

export const DRAWDOWN_STUDY = "docs/research/drawdown-quests-2026-11.md";
/** Episodes the study's declared power needed before it would claim an edge. */
export const EPISODES_NEEDED = 32;
/** The indexes the study measured, and so the only ones a conditions quest keys on. */
export const STUDIED_INDEXES = ["SPY", "QQQ"] as const;
export type StudiedIndex = (typeof STUDIED_INDEXES)[number];

type Measured = Extract<Quest["baseRate"], { kind: "measured" }>;
type Numbers = Omit<Measured, "kind" | "note" | "source" | "episodesNeeded">;

export interface MoveRow {
  readonly numbers: Numbers;
  /** The study's other facts for this move, said as a sentence in the quest's last reason. */
  readonly worstCase: string;
}

export interface IndexRates {
  /** Shares held 63 sessions, per dollar spent. */
  readonly shares: MoveRow;
  /** A 0.15-delta put, 30 sessions out, held to expiry, per dollar of cash secured. */
  readonly put: MoveRow;
}

export const DRAWDOWN_RATES: Readonly<Record<StudiedIndex, IndexRates>> = {
  SPY: {
    shares: {
      numbers: {
        rate: 0.658,
        sample: 73,
        episodes: 18,
        mean: 0.0451,
        worstDecile: -0.0685,
        worstSingle: -0.2572,
      },
      worstCase:
        "The ordinary days it was compared with gained 3% on average over the same 63 sessions.",
    },
    put: {
      numbers: {
        rate: 0.932,
        sample: 73,
        episodes: 18,
        mean: 0.0055,
        worstDecile: 0.0075,
        worstSingle: -0.1386,
      },
      worstCase:
        "It was assigned in 7% of cycles, and the worst sale lost 14% of the cash it secured; the premium was double the ordinary days' (1.02% vs 0.53%).",
    },
  },
  QQQ: {
    shares: {
      numbers: {
        rate: 0.632,
        sample: 76,
        episodes: 20,
        mean: 0.0496,
        worstDecile: -0.1347,
        worstSingle: -0.3683,
      },
      worstCase:
        "The ordinary days it was compared with gained 2% on average over the same 63 sessions.",
    },
    put: {
      numbers: {
        rate: 0.895,
        sample: 76,
        episodes: 20,
        mean: -0.0016,
        worstDecile: -0.0128,
        worstSingle: -0.2702,
      },
      worstCase:
        "It was assigned in 12% of cycles, and the worst sale (the 2000 dot-com sell-off) lost 27% of the cash it secured.",
    },
  },
};
