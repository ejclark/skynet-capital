import type { ReactElement } from "react";

/**
 * The word for paper trading, in one place. Which word it should be ('SIM', 'PAPER',
 * 'PAPER · LIVE') is an open pick on #5205 / #5365; when it is made, this line is the change.
 */
export const PAPER_WORD = "SIM";

/**
 * Where an account's orders go — `sim` is the paper account every member trades on today; `live`
 * and `observe` are a bot check's run mode (it placed orders, or only watched).
 */
export type EnvMode = "sim" | "live" | "observe";

const MODE_WORD: Record<EnvMode, string> = { sim: PAPER_WORD, live: "LIVE", observe: "OBSERVE" };

/**
 * Labels the trading mode (SIM, LIVE) in one neutral pill, so a mode never borrows a kind chip's colour.
 *
 * The look is the global `.env-pill` (`styles/shell.css`): muted, outlined, no hue — the word
 * carries the meaning. A LIVE check once drew as the green HUMAN chip (#5365), which made a mode
 * read as an account kind.
 *
 * @whenNot the label says who an account is (BOT / HUMAN) — that is `KindChip`; and a sentence
 *   that names the paper account in prose ("SIM account — simulated fill") stays text.
 */
export function EnvPill({ mode = "sim" }: { readonly mode?: EnvMode }): ReactElement {
  return <span className="env-pill">{MODE_WORD[mode]}</span>;
}
