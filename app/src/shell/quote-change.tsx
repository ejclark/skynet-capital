import type { ReactElement } from "react";
import type { QuoteTone } from "../live/quote";
import { money } from "../live/ticket";

/**
 * HOW A DAY'S MOVE IS DRAWN — one module, every surface that draws one (`quote-header.tsx` and the
 * watchlist's rows, #4332). Extracted rather than copied: two renderings of the same move are two
 * accessibility contracts the moment either is edited, and the duplication gate
 * (`scripts/dupe-scan.mjs`) would be right to flag the paste.
 *
 * A STANDING READER IS RED/GREEN COLORBLIND (CLAUDE.md, `docs/BRAND.md` → Accessibility). The tone
 * never rides on hue alone: a glyph (▲/▼/·) and an explicit sign carry direction too, and a
 * `.visually-hidden` sentence states it again in words.
 */

const GLYPH: Record<QuoteTone, string> = { pos: "▲", neg: "▼", flat: "·" };
const DIRECTION_WORD: Record<QuoteTone, string> = { pos: "up", neg: "down", flat: "flat" };
/** The real minus sign (U+2212) — a hyphen reads as a dash, not a negative, at a glance. */
const MINUS = "−";

export function signedMoney(change: number, tone: QuoteTone): string {
  if (tone === "pos") return `+${money(Math.abs(change))}`;
  if (tone === "neg") return `${MINUS}${money(Math.abs(change))}`;
  return money(0);
}

/** Signs from `changePct`'s OWN sign, never from `tone` — `tone` and the rounded-to-cent dollar
 *  `change` can both read flat on a sub-cent move while the percent is still genuinely nonzero,
 *  and that real decline/gain must never silently lose its sign. */
export function signedPct(changePct: number): string {
  const magnitude = Math.abs(changePct).toFixed(2);
  if (changePct > 0) return `+${magnitude}`;
  if (changePct < 0) return `${MINUS}${magnitude}`;
  return magnitude;
}

/** The day's move: glyph, signed dollars, signed percent, and the same thing in words for a
 *  screen reader. */
export function QuoteChange({
  change,
  changePct,
  tone,
}: {
  readonly change: number;
  readonly changePct: number;
  readonly tone: QuoteTone;
}): ReactElement {
  const label = `${DIRECTION_WORD[tone]} ${Math.abs(change).toFixed(2)} dollars, ${Math.abs(changePct).toFixed(2)} percent`;
  return (
    <>
      <span className={`quote-change tone-${tone}`}>
        <span aria-hidden="true">{GLYPH[tone]}</span> {signedMoney(change, tone)} (
        {signedPct(changePct)}%)
      </span>
      <span className="visually-hidden">{label}</span>
    </>
  );
}

const ET_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * "live 14:32:05 ET" for a PUSHED frame, and nothing at all for a one-shot REST read — the
 * presence of `asOf` is what licenses any claim about freshness (`quote-header.tsx`'s own rule,
 * #3407 P4). An unparseable stamp says nothing rather than printing `Invalid Date` beside a real
 * price. `compact` drops the clock for a dense row, keeping the mark and the words.
 */
export function LiveStamp({
  asOf,
  compact = false,
}: {
  readonly asOf: string;
  readonly compact?: boolean;
}): ReactElement | null {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) return null;
  const clock = ET_CLOCK.format(new Date(at));
  if (compact) {
    return (
      <span className="quote-live">
        <span aria-hidden="true">◦</span>{" "}
        <time dateTime={asOf}>
          live
          <span className="visually-hidden">
            , the feed's own time for this price is {clock} ET
          </span>
        </time>
      </span>
    );
  }
  return (
    <span className="quote-live">
      <span aria-hidden="true">◦</span> live{" "}
      <time dateTime={asOf}>
        {clock} ET<span className="visually-hidden">, the feed's own time for this price</span>
      </time>
    </span>
  );
}
