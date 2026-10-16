/**
 * The dip-to-bounce playbook on one ticker (#5489 slice 2), DARK: `observeOnly` makes the engine
 * place nothing for it and record its verdict as "observing" (`playbook.ts`), and its size is zero in
 * every mode besides, so even a future reader that ignored the flag would size every buy at nothing.
 * The rule itself is `dip-bounce.ts`; this file only names the pair.
 *
 * `observe` is the dark run's record (`dip-bounce-observation.ts`): every dip signal in the bars the
 * pass can see, as a would-be order in a type that is not an `OrderIntent`.
 *
 * `desiredState` answers "no-window" because the play has no date window: its signal is a price
 * below the session's VWAP, read bar by bar. No reader asks it, since the verdict of an observe-only
 * playbook is "observing" (`playbookVerdicts`).
 */
import { observeDipBounce } from "./dip-bounce-observation.js";
import type { Playbook } from "./playbook.js";

export const DIP_BOUNCE_STUDY = "docs/research/intraday-dip-bounce-2026-10.md";

export function dipBounce(setting: {
  readonly id: string;
  readonly symbol: string;
  /** The study's one-line result for this ticker, cited verbatim in `evidence`. */
  readonly finding: string;
}): Playbook {
  return {
    id: setting.id,
    symbols: [setting.symbol],
    thesis:
      `Buy a $1,000 tranche of ${setting.symbol} when a 5-minute bar after 10:00 ET closes two of ` +
      "its own 5-minute ranges below the session's average price, and sell it one range higher — " +
      "observe-only: it records what it would do and places nothing.",
    evidence: `${DIP_BOUNCE_STUDY} §2: ${setting.finding}`,
    size: { conservative: 0, standard: 0, aggressive: 0 },
    horizon: "short",
    observeOnly: true,
    // What it would have done, from the 5-minute bars the pass can see: recorded, never ordered.
    observe: ({ bars, asOf, quotes, calendar }) => {
      const read = bars(setting.symbol);
      return read
        ? observeDipBounce({
            playbookId: setting.id,
            symbol: setting.symbol,
            bars: read,
            asOf,
            quote: quotes[setting.symbol],
            calendar,
          })
        : [];
    },
    desiredState: () => "no-window",
  };
}
