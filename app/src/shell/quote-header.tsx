import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchQuote, type QuoteAnswer, type QuoteTone } from "../live/quote";
import { money } from "../live/ticket";

/**
 * THE QUOTE HEADER (#2017 cockpit plan, Phase 0.9) — last price, day $ change and % change for
 * the ticket's committed symbol, above both gates' fields so price is the first thing read after
 * the symbol. Fetches on COMMIT only (`symbol` is the committed value, never a keystroke) via
 * `staleTime` so switching Instrument/Side doesn't re-fetch a symbol just quoted.
 *
 * A standing reader is red/green colourblind (CLAUDE.md): the tone never rides on hue alone — a
 * glyph (▲/▼/·) and an explicit sign carry direction too, and a `.visually-hidden` sentence
 * states it again in words for a screen reader (the repo's own idiom — grep `.visually-hidden`).
 * Fail-soft everywhere: no linked session, no quote, or a feed failure all render a single muted
 * note, never an error. No wording here claims freshness ("today") — `getUnderlyingQuote` reads
 * the broker's last trade with no timestamp check, so after-hours or on a weekend that could be a
 * stale prior-session move; broker-timestamp plumbing to make the claim honest is out of scope for
 * this slice (#2017), so the copy simply never makes it.
 *
 * The wrapping `.quote-header` element is ALWAYS mounted with `aria-live="polite"`, empty until
 * there's something to say (mirrors `.gate`'s draft-step pattern, `gate-draft.spec.tsx`) — a live
 * region that appears already full commonly goes unannounced by assistive tech. `.quote-header:empty`
 * in `ticket.css` collapses its chrome so an empty region takes no visual space.
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

/** Signs from `changePct`'s OWN sign, never from `tone` — `tone` and the rounded-to-cent dollar
 *  `change` can both read flat on a sub-cent move while the percent is still genuinely nonzero,
 *  and that real decline/gain must never silently lose its sign. */
function signedPct(changePct: number): string {
  const magnitude = Math.abs(changePct).toFixed(2);
  if (changePct > 0) return `+${magnitude}`;
  if (changePct < 0) return `${MINUS}${magnitude}`;
  return magnitude;
}

function QuoteHeaderBody({ answer }: { readonly answer: QuoteAnswer }): ReactElement {
  if ("quoteNote" in answer) {
    return <span className="quote-note">{answer.quoteNote}</span>;
  }
  // Render the server's OWN symbol field, not the caller's prop — the client renders the
  // server's answer verbatim (see `app/src/live/quote.ts`'s header comment).
  const { symbol, last, change, changePct, tone } = answer;
  const label = `${DIRECTION_WORD[tone]} ${Math.abs(change).toFixed(2)} dollars, ${Math.abs(changePct).toFixed(2)} percent`;
  return (
    <span className="quote-line num">
      <span className="quote-sym">{symbol}</span> <span className="quote-last">{money(last)}</span>{" "}
      <span className={`quote-change tone-${tone}`}>
        <span aria-hidden="true">{GLYPH[tone]}</span> {signedMoney(change, tone)} (
        {signedPct(changePct)}%)
      </span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/** @category trading */
export function QuoteHeader({ symbol }: { readonly symbol: string }): ReactElement {
  const query = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchQuote(symbol),
    enabled: symbol !== "",
    staleTime: 15_000,
  });

  const answer = symbol !== "" && !query.isLoading ? query.data : undefined;

  return (
    <div className="quote-header" aria-live="polite">
      {answer ? <QuoteHeaderBody answer={answer} /> : null}
    </div>
  );
}
