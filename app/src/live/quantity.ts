/**
 * A POSITION'S SIZE, READ ONCE (#5086). The server sends it as display text,
 * `toLocaleString("en-US")` of a SIGNED count: "-1" for a sold contract, "1,200" for twelve hundred
 * shares. A bare `Number()` reads the second as NaN, and a reader that forgets the sign treats a
 * short as a holding — the desk's Close once did both, so a sold option or any position of 1,000+
 * shares could never close. Every reader of that text goes through here.
 */

/** What a count is once its commas are gone and a typographic minus is plain: a sign, digits, a
 *  fraction (a fractional share). */
const COUNT = /^[+-]?\d+(\.\d+)?$/;

/** The signed count the text names; NaN when it names none — never a silent zero. */
export function parseQuantity(text: string): number {
  const plain = text
    .trim()
    .replace(/\u2212/g, "-")
    .replace(/,/g, "");
  return COUNT.test(plain) ? Number(plain) : Number.NaN;
}

/** The whole count and the side: `{ count: 1, short: true }` for "-1". Unreadable holds nothing. */
export function held(quantity: string): { readonly count: number; readonly short: boolean } {
  const n = parseQuantity(quantity);
  return Number.isFinite(n) ? { count: Math.abs(n), short: n < 0 } : { count: 0, short: false };
}
