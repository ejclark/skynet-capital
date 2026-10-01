import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { QuoteAnswer, QuoteTone } from "../live/quote";
import { quoteQuery } from "../live/quote-query";
import { useQuoteStream } from "../live/quote-stream";
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
 * note, never an error.
 *
 * FRESHNESS, finally sayable (#3407 P4, the quote stream). #2017's note here read: "No wording
 * here claims freshness ('today') — `getUnderlyingQuote` reads the broker's last trade with no
 * timestamp check… broker-timestamp plumbing to make the claim honest is out of scope for this
 * slice." That plumbing now exists for one path and one path only: a PUSHED frame carries the
 * feed's own tick time (`asOf`), and only then does this header show a stamp. A one-shot REST
 * answer still has no stamp and still makes no claim, exactly as before — the rule is unchanged,
 * it is the evidence that is new. The stamp also carries the stream's one honest weakness: a quiet
 * name's last print can be minutes old, and the member can see that rather than infer it.
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

const ET_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** "live 14:32:05 ET" for a pushed frame, nothing for a one-shot read. An unparseable stamp says
 *  nothing rather than printing `Invalid Date` beside a real price. */
function LiveStamp({ asOf }: { readonly asOf: string }): ReactElement | null {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) return null;
  const clock = ET_CLOCK.format(new Date(at));
  return (
    <span className="quote-live">
      <span aria-hidden="true">◦</span> live{" "}
      <time dateTime={asOf}>
        {clock} ET<span className="visually-hidden">, the feed's own time for this price</span>
      </time>
    </span>
  );
}

function QuoteHeaderBody({ answer }: { readonly answer: QuoteAnswer }): ReactElement {
  if ("quoteNote" in answer) {
    return <span className="quote-note">{answer.quoteNote}</span>;
  }
  // Render the server's OWN symbol field, not the caller's prop — the client renders the
  // server's answer verbatim (see `app/src/live/quote.ts`'s header comment).
  const { symbol, last, change, changePct, tone, asOf } = answer;
  const label = `${DIRECTION_WORD[tone]} ${Math.abs(change).toFixed(2)} dollars, ${Math.abs(changePct).toFixed(2)} percent`;
  return (
    <span className="quote-line num">
      <span className="quote-sym">{symbol}</span> <span className="quote-last">{money(last)}</span>{" "}
      <span className={`quote-change tone-${tone}`}>
        <span aria-hidden="true">{GLYPH[tone]}</span> {signedMoney(change, tone)} (
        {signedPct(changePct)}%)
      </span>
      <span className="visually-hidden">{label}</span>
      {asOf ? <LiveStamp asOf={asOf} /> : null}
    </span>
  );
}

/** @category trading */
export function QuoteHeader({
  symbol,
  provided,
}: {
  readonly symbol: string;
  /** A surface that already holds the quote hands it in (#3299 slice 1 — the options ticket and
   *  the chain pane read it off the chain answer, one snapshot for the divider row AND this
   *  header): an answer renders as-is, `"pending"` renders nothing while that surface loads, and
   *  either way this header issues no fetch of its own. `undefined` means no provider on this
   *  surface (the stock ticket), and the header fetches for itself as it always has. */
  readonly provided?: QuoteAnswer | "pending";
}): ReactElement {
  const own = quoteQuery(symbol);
  const query = useQuery({ ...own, enabled: own.enabled && provided === undefined });
  // The push channel (#3407 P4) runs only where this header owns the query it reads. A surface
  // that hands its quote in (`provided`) has its own source — writing a streamed frame into a
  // query it never reads would be state nobody paints.
  useQuoteStream(symbol, provided === undefined);

  const answer =
    provided === "pending"
      ? undefined
      : provided !== undefined
        ? provided
        : symbol !== "" && !query.isLoading
          ? query.data
          : undefined;

  return (
    <div className="quote-header" aria-live="polite">
      {answer ? <QuoteHeaderBody answer={answer} /> : null}
    </div>
  );
}
