import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useId, useState } from "react";
import type { WatchedSymbol } from "../../../src/trading/watchlist";
import type { QuoteAnswer } from "../live/quote";
import { quoteQuery } from "../live/quote-query";
import { useQuoteStreamSet } from "../live/quote-stream";
import { money } from "../live/ticket";
import { setWatching, type WatchlistAnswer, watchlistKey, watchlistQuery } from "../live/watchlist";
import { LiveStamp, QuoteChange } from "./quote-change";
import { SymbolField } from "./symbol-field";

/**
 * THE WATCHLIST PANE (#3407 P4, #4332 — the last capability this plan left a lane) — the names a
 * member keeps an eye on, their prices moving, and one tap from any row onto the bench.
 *
 * AN AUXILIARY ENTRY INTO THE BENCH, NEVER A HOME. #3407's IA decision filed the watchlist beside
 * Outlook under exactly that phrase before either was built, so this lands the way the Outlook
 * pane did: a `?section=` id, a door in `BenchDoors`, no new navigation word and no new route. It
 * is the only pane on the bench that is about MANY symbols — which is also why it never docks: a
 * bench is several tools for ONE symbol, and this is the thing you pick that symbol WITH.
 *
 * ONE SOCKET FOR THE WHOLE LIST. Every row reads the same `["quote", SYM]` query the ticket and
 * the header already read, and one `EventSource` carries the whole set (`useQuoteStreamSet` →
 * `?symbol=A,B,C`). A connection per row would have hit the browser's six-per-origin ceiling at
 * the seventh name; `quote-stream-hub.ts` needed nothing, having been ref-counted per symbol from
 * the start.
 *
 * A ROW THAT ISN'T MOVING SAYS SO BY OMISSION, and the caption says what that means. The live mark
 * appears only when a frame carried the feed's own `asOf` (`quote-header.tsx`'s rule, unchanged):
 * a row whose REST read landed but whose stream did not shows a price with no claim about its age,
 * rather than a stale number dressed as a live one.
 *
 * THE CAP IS THE SOCKET'S, SAID IN WORDS. `WATCHLIST_LIMIT` is 20 against a 30-symbol connection,
 * and the count sits under the list so a member meets the ceiling as a sentence rather than as
 * rows that quietly stop moving.
 */

/** One row's own price, read from the shared quote query the stream writes into. */
function Row({
  row,
  onPick,
  onRemove,
  busy,
}: {
  readonly row: WatchedSymbol;
  readonly onPick: (symbol: string) => void;
  readonly onRemove: (symbol: string) => void;
  readonly busy: boolean;
}): ReactElement {
  const quote = useQuery(quoteQuery(row.symbol));
  const answer: QuoteAnswer | undefined = quote.data;
  return (
    <li className="wl-row">
      {/* NO `aria-label` here, deliberately: a label REPLACES an element's contents as its
          accessible name, so one would have silenced exactly the `.visually-hidden` price and
          direction sentence `quote-change.tsx` exists to speak. The action is said as hidden text
          INSIDE the button instead, so the announced name is the symbol, its price, its direction
          in words, and then what tapping it does. */}
      <button type="button" className="wl-pick" onClick={() => onPick(row.symbol)}>
        <span className="wl-sym">{row.symbol}</span>
        <Price answer={answer} />
        <span className="visually-hidden">— open it on the bench</span>
      </button>
      <button
        type="button"
        className="wl-drop"
        onClick={() => onRemove(row.symbol)}
        disabled={busy}
        aria-label={`Stop watching ${row.symbol}`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

/** The price half of a row — the server's own numbers, or a word for the state it is in. */
function Price({ answer }: { readonly answer: QuoteAnswer | undefined }): ReactElement {
  if (!answer) return <span className="wl-pending">reading…</span>;
  if ("quoteNote" in answer) return <span className="wl-pending">no price right now</span>;
  return (
    <span className="wl-price num">
      <span className="wl-last">{money(answer.last)}</span>
      <QuoteChange change={answer.change} changePct={answer.changePct} tone={answer.tone} />
      {answer.asOf ? <LiveStamp asOf={answer.asOf} compact /> : null}
    </span>
  );
}

/** The add control: the ticket's own symbol field, plus a one-tap offer for the symbol already on
 *  the bench — the common case is "I'm looking at this, keep it". */
function AddName({
  committed,
  watched,
  disabled,
  onAdd,
}: {
  readonly committed: string;
  readonly watched: boolean;
  readonly disabled: boolean;
  readonly onAdd: (symbol: string) => void;
}): ReactElement {
  const id = useId();
  const [typed, setTyped] = useState("");
  return (
    <div className="wl-add">
      <SymbolField
        id={id}
        label="Watch a name"
        value={typed}
        placeholder="AAPL"
        maxLength={12}
        onChange={setTyped}
        // A commit here is a DURABLE append, not a `?symbol=` a member can retype — so leaving the
        // field must not write one. Tapping a row blurs this input first, which would otherwise
        // have persisted whatever was half-typed and spent a slot against the cap.
        commitOnBlur={false}
        onCommit={(symbol) => {
          if (symbol.trim() === "") return;
          onAdd(symbol);
          setTyped("");
        }}
      />
      {committed !== "" && !watched ? (
        <button
          type="button"
          className="btn wl-add-committed"
          disabled={disabled}
          onClick={() => onAdd(committed)}
        >
          Watch {committed}
        </button>
      ) : null}
    </div>
  );
}

export function WatchlistSection({
  symbol,
  onPick,
}: {
  /** The symbol committed on the bench, offered as a one-tap add. Empty is normal. */
  readonly symbol: string;
  /** Commit a row's symbol to the bench — `trade.tsx` writes `?symbol=` and, folded, lands the
   *  member on the ticket, exactly as a chain tap does. */
  readonly onPick: (symbol: string) => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const list = useQuery(watchlistQuery);
  const [refusal, setRefusal] = useState<string | undefined>(undefined);

  const toggle = useMutation({
    mutationFn: ({ name, watching }: { readonly name: string; readonly watching: boolean }) =>
      setWatching(name, watching),
    onSuccess: (result) => {
      // The server's own list, written straight in — the cap and the dedupe rules are its, and a
      // locally patched copy would eventually disagree with what the next reader loads. ONLY on
      // `ok`, though: a refusal the route decides before it has read the list answers with an
      // empty one (`watchlist-route.ts`'s bad-symbol branch), and adopting that would blank a
      // member's whole list — and close the shared stream with it — over a typo.
      setRefusal(result.ok ? undefined : result.refusals[0]);
      if (!result.ok) return;
      queryClient.setQueryData(watchlistKey, (prev: WatchlistAnswer | undefined) =>
        prev ? { ...prev, watching: result.watching } : prev,
      );
    },
    onError: () => setRefusal("That didn't save — try again in a moment."),
  });

  const answer = list.data;
  const watching = answer?.watching ?? [];
  // One connection for the whole set; the hook keys on the joined list so a re-render with an
  // equal list doesn't tear the socket down and pay for a fresh snapshot per symbol.
  useQuoteStreamSet(watching.map((row) => row.symbol));

  if (list.isPending) return <p className="note">Reading your watchlist…</p>;
  if (list.isError) {
    return <p className="note">Couldn't read your watchlist right now — reload when you like.</p>;
  }
  if (answer && !answer.available) {
    return <p className="note">{answer.reason}</p>;
  }

  const limit = answer?.limit ?? watching.length;
  const already = watching.some((row) => row.symbol === symbol.toUpperCase());
  return (
    <div className="wl">
      <AddName
        committed={symbol.toUpperCase()}
        watched={already}
        disabled={toggle.isPending}
        onAdd={(name) => toggle.mutate({ name, watching: true })}
      />
      {refusal ? <p className="note wl-refusal">{refusal}</p> : null}
      {watching.length === 0 ? (
        <p className="note">
          Nothing here yet. Add a name and its price moves while this pane is open — tapping a row
          opens it on the bench.
        </p>
      ) : (
        <>
          <ul className="wl-list">
            {watching.map((row) => (
              <Row
                key={row.symbol}
                row={row}
                onPick={onPick}
                onRemove={(name) => toggle.mutate({ name, watching: false })}
                busy={toggle.isPending}
              />
            ))}
          </ul>
          <p className="wl-count">
            {watching.length} of {limit} names. A row without a <span aria-hidden="true">◦</span>{" "}
            live mark shows the last price read, not a moving one.
          </p>
        </>
      )}
    </div>
  );
}
