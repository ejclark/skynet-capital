/**
 * THE NUMBER SHAPES (#5204) — the one home for how a member screen signs and writes a figure. A
 * house rule fixes these (`./README.md`: "a minus sign"), so they live here before the rule of
 * three: a loss carries the real minus, a gain a written plus, and a dollar axis its `$` and
 * commas. Precision is still each call site's own today; the app-wide consistency round (#5143)
 * picks one per shape, and that pick then lands here as a one-line change.
 *
 * A standing reader is red/green colourblind (CLAUDE.md): the sign is a word-level cue, so it is
 * always written out and never left to a tone class.
 */

/**
 * The real minus sign (U+2212), for any figure that is below zero.
 *
 * @whenNot the character is a range or a compound ("Sep 1–2", "S&P-500") — that is a dash or a
 *   hyphen, not a sign.
 */
export const MINUS = "−";

/**
 * Rewrites a server figure's leading hyphen as a real minus: "-$412" → "−$412".
 *
 * @whenNot the figure is a number you still hold — sign it with `signOf` as you format it rather
 *   than formatting with a hyphen and patching the string.
 */
export const withMinus = (figure: string): string => figure.replace(/^-/, MINUS);

/**
 * The sign a figure leads with: "+" for a gain, the real minus for a loss, nothing for zero.
 *
 * @whenNot the figure is an unsigned amount (a price, a balance, a count) — those print no sign.
 */
export function signOf(value: number): string {
  return value > 0 ? "+" : value < 0 ? MINUS : "";
}

/**
 * A change in percent with its sign written out: `signedPercent(3.5, 1)` → "+3.5%".
 *
 * Takes percent units (3.5 for 3.5%), never a fraction. A move that rounds to zero at the precision
 * asked for prints unsigned ("0.0%"), since "+0.0%" would claim a gain the figure does not show.
 *
 * @whenNot the percent is a share of a whole (a progress bar, a win rate, a chance of profit) —
 *   those are unsigned.
 */
export function signedPercent(percent: number, digits: number): string {
  const magnitude = Math.abs(percent).toFixed(digits);
  return `${Number(magnitude) === 0 ? "" : signOf(percent)}${magnitude}%`;
}

/**
 * The tone of a change as `signedPercent` prints it: a move that rounds to zero is "flat", so a
 * red or green figure never reads "0.0%" — the hue and the words always agree (a standing reader is
 * red/green colourblind, and a hue the text contradicts is worse than no hue).
 *
 * @whenNot the figure is not printed by `signedPercent` at the same digits — tone what you print.
 */
export function percentTone(percent: number, digits: number): "pos" | "neg" | "flat" {
  const shown = Number(Math.abs(percent).toFixed(digits));
  return shown === 0 ? "flat" : percent > 0 ? "pos" : "neg";
}

const WHOLE_DOLLARS = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * A chart axis tick in dollars: whole dollars, `$` and thousands commas — 1007500 → "$1,007,500".
 *
 * @whenNot the figure is a price or a P/L read on its own (a quote, a fill) — those keep their cents.
 */
export function axisDollars(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? MINUS : ""}$${WHOLE_DOLLARS.format(Math.abs(rounded))}`;
}
