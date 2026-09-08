import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchQuote, type QuoteTone } from "../live/quote";
import { money } from "../live/ticket";

/**
 * THE QUOTE HEADER (#2017 cockpit plan, Phase 0.9) — last price, day $ change and % change for
 * the ticket's committed symbol, above both gates' fields so price is the first thing read after
 * the symbol. Fetches on COMMIT only (`symbol` is the committed value, never a keystroke) via
 * `staleTime` so switching Instrument/Side doesn't re-fetch a symbol just quoted.
 *
 * A standing reader is red/green colourblind (CLAUDE.md): the tone never rides on hue alone — a
 * glyph (▲/▼/·) and an explicit sign carry direction too, and the change span's `aria-label`
 * states it again in words for a screen reader. Fail-soft everywhere: no linked session, no quote,
 * or a feed failure all render a single muted note, never an error; an uncommitted symbol or a
 * still-loading quote renders nothing.
 */

const GLYPH: Record<QuoteTone, string> = { pos: "▲", neg: "▼", flat: "·" };
const DIRECTION_WORD: Record<QuoteTone, string> = { pos: "up", neg: "down", flat: "flat" };
/** The real minus sign (U+2212) — a hyphen reads as a dash, not a negative, at a glance. */
const MINUS = "−";

function signedMoney(change: number, tone: QuoteTone): string {
  if (tone === "pos") return `+${money(Math.abs(change))}`;
  if (tone === "neg") return `${MINUS}${money(Math.abs(change))}`;
  return money(0);
}

function signedPct(changePct: number, tone: QuoteTone): string {
  const magnitude = Math.abs(changePct).toFixed(2);
  if (tone === "pos") return `+${magnitude}`;
  if (tone === "neg") return `${MINUS}${magnitude}`;
  return magnitude;
}

/** @category trading */
export function QuoteHeader({ symbol }: { readonly symbol: string }): ReactElement | null {
  const query = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchQuote(symbol),
    enabled: symbol !== "",
    staleTime: 15_000,
  });

  if (symbol === "" || query.isLoading || !query.data) return null;

  if ("quoteNote" in query.data) {
    return <p className="quote-header quote-note">{query.data.quoteNote}</p>;
  }

  const { last, change, changePct, tone } = query.data;
  const label = `${DIRECTION_WORD[tone]} ${Math.abs(change).toFixed(2)} dollars, ${Math.abs(changePct).toFixed(2)} percent today`;
  return (
    <p className="quote-header num" aria-live="polite">
      <span className="quote-sym">{symbol}</span> <span className="quote-last">{money(last)}</span>{" "}
      <output className={`quote-change tone-${tone}`} aria-label={label}>
        <span aria-hidden="true">{GLYPH[tone]}</span> {signedMoney(change, tone)} (
        {signedPct(changePct, tone)}%)
      </output>
    </p>
  );
}
