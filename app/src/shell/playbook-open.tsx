import { useQuery } from "@tanstack/react-query";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { fetchDesk } from "../live/desk";
import { fetchOptionPositions } from "../live/options";
import {
  heldIn,
  ruleTemplateOf,
  type SaySo,
  type StorePair,
  saySoOf,
  soldContract,
  soleSymbol,
  storePairOf,
  wheelPhaseOf,
  windowPlan,
} from "../live/playbook-rule";
import { fetchPlaybookStore } from "../live/playbook-store";
import { decayBySymbol, deltaBySymbol } from "./holding-decay";
import { WheelLoop, WindowTimeline } from "./playbook-rule";
import { PositionCards } from "./position-cards";

/**
 * A PLAYBOOK CARD, OPENED IN FULL (#5073 slice 3 — #5037 round 2's R2-open). Under the card's
 * key and reason, three answers the closed card has no room for, each from a read the app already
 * makes (`live/playbook-rule.ts` holds the joins and their honesty rules):
 *
 *  1. THE RULE AS A PICTURE — the wheel as a loop with the price strip, or a pre-print window on
 *     the calendar, each with "you are here" (`playbook-rule.tsx`). Any other strategy says its
 *     rule in its one sentence from the Store.
 *  2. WHAT IT HOLDS — this bot's positions in the playbook's ticker, in Eric's row spec (the
 *     Overview's own phone card, greeks line and all), each a link to its position.
 *  3. WHOSE SAY-SO IT RUNS ON — the Store pair's evidence, the mode, the owner's conviction and the
 *     dated check that would stop its new entries.
 *
 * Nothing is read until the card is first opened: a section of seven cards must not ask for the
 * Store, the book and the option quotes for a reader who opens none.
 */

/** Renders `children` from the first time the enclosing `<details>` opens, and keeps them. */
export function WhenOpened({ children }: { readonly children: ReactNode }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const details = ref.current?.closest("details");
    if (!details) {
      setOpened(true);
      return;
    }
    const sync = () => {
      if (details.open) setOpened(true);
    };
    sync();
    details.addEventListener("toggle", sync);
    return () => details.removeEventListener("toggle", sync);
  }, []);
  return (
    <div ref={ref} className="pbo">
      {opened ? children : null}
    </div>
  );
}

function SaySoBlock({ say }: { readonly say: SaySo }): ReactElement {
  return (
    <section className="pbo-block pbo-say" aria-label="Whose say-so it runs on">
      <h4 className="pbo-h">Whose say-so it runs on</h4>
      <p>
        <b>{say.head}</b>
        {say.mode ? <span className="pbb-meta">, run in {say.mode} mode</span> : null}
      </p>
      {say.reason ? <p className="pbo-quote">“{say.reason}”</p> : null}
      <p className="pbo-call">{say.call}</p>
      {say.dated ? <p className="pbb-meta">{say.dated}.</p> : null}
      {say.studyHref ? (
        <a className="hb-link" href={say.studyHref}>
          Read the study ›
        </a>
      ) : null}
    </section>
  );
}

/** The bot's book, and what it holds in one ticker. The option book — the Overview's own read,
 *  with each contract's stock price and greeks — is asked for only when an option is held there. */
function useTicker(deskId: string, symbol: string | undefined) {
  const desk = useQuery({ queryKey: ["desk", deskId], queryFn: () => fetchDesk(deskId) });
  const positions = desk.data?.desk.positions ?? [];
  const held = symbol ? heldIn(positions, symbol) : [];
  const book = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: held.some((p) => p.isOption),
    staleTime: 30_000,
  });
  return { pending: desk.isPending, loaded: desk.data !== undefined, positions, held, book };
}
type Ticker = ReturnType<typeof useTicker>;

/** The wheel on this book: its step, the contract it sold, and the stock's price beside it. */
function WheelOnBook({
  symbol,
  ticker,
}: {
  readonly symbol: string;
  readonly ticker: Ticker;
}): ReactElement {
  const phase = wheelPhaseOf(ticker.positions, symbol);
  const sold = soldContract(ticker.positions, symbol, phase);
  const data = ticker.book.data;
  const spot = data?.available ? data.rows.find((r) => r.symbol === sold?.symbol)?.spot : undefined;
  return (
    <WheelLoop
      symbol={symbol}
      phase={phase}
      {...(sold ? { sold } : {})}
      {...(spot !== undefined ? { spot } : {})}
    />
  );
}

/** The rule's picture when its template has one and the data to draw it; else its sentence. */
function RuleBody({
  found,
  symbol,
  ticker,
}: {
  readonly found: StorePair;
  readonly symbol: string | undefined;
  readonly ticker: Ticker;
}): ReactElement {
  const template = ruleTemplateOf(found.strategy.strategy);
  const span = found.card?.window;
  if (template === "wheel" && symbol) {
    if (ticker.pending) return <p className="pbb-meta">Reading the book…</p>;
    if (ticker.loaded) return <WheelOnBook symbol={symbol} ticker={ticker} />;
  }
  const plan =
    template === "window" && symbol && span
      ? windowPlan(symbol, span, new Date().toISOString())
      : undefined;
  if (plan && span) return <WindowTimeline plan={plan} span={span} />;
  return <p>{found.strategy.summary}</p>;
}

function Holdings({
  deskId,
  symbol,
  ticker,
}: {
  readonly deskId: string;
  readonly symbol: string;
  readonly ticker: Ticker;
}): ReactElement {
  return (
    <section className="pbo-block pbo-holds" aria-label={`This bot's ${symbol}`}>
      <h4 className="pbo-h">This bot's {symbol}</h4>
      {ticker.pending ? (
        <p className="pbb-meta">Reading the book…</p>
      ) : ticker.held.length === 0 ? (
        <p className="pbb-meta">Nothing held in {symbol} right now.</p>
      ) : (
        <PositionCards
          positions={ticker.held}
          deskId={deskId}
          decayBySymbol={decayBySymbol(ticker.book.data)}
          deltaBySymbol={deltaBySymbol(ticker.book.data)}
        />
      )}
    </section>
  );
}

function RuleAndHoldings({
  found,
  deskId,
}: {
  readonly found: StorePair;
  readonly deskId: string;
}): ReactElement {
  const symbol = soleSymbol(found.pair);
  const ticker = useTicker(deskId, symbol);
  return (
    <>
      <section className="pbo-block" aria-label="The rule">
        <h4 className="pbo-h">The rule</h4>
        <RuleBody found={found} symbol={symbol} ticker={ticker} />
      </section>
      {symbol ? <Holdings deskId={deskId} symbol={symbol} ticker={ticker} /> : null}
    </>
  );
}

/** The opened card's three answers for one named playbook. A playbook the Store does not list (an
 *  authored play on its owner's account) has none of them to give, and says nothing. */
export function PlaybookOpen({
  deskId,
  playbookId,
  mode,
}: {
  readonly deskId: string;
  readonly playbookId: string;
  readonly mode?: string;
}): ReactElement | null {
  const store = useQuery({
    queryKey: ["playbook-store", deskId],
    queryFn: () => fetchPlaybookStore(deskId),
  });
  if (store.isPending) return <p className="pbb-meta">Reading its rule…</p>;
  if (store.isError) return null;
  const found = storePairOf(store.data, playbookId);
  if (!found) return null;
  return (
    <>
      <RuleAndHoldings found={found} deskId={deskId} />
      <SaySoBlock say={saySoOf(found.pair, mode)} />
    </>
  );
}
