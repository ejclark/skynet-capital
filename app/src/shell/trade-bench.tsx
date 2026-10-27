import type { ReactElement } from "react";
import { useEffect } from "react";
import type { LadderRow, ManageCall } from "../../../src/options/position-guidance-types";
import type { DraftLeg, NewLeg } from "../live/draft-order";
import type { PlayInfo } from "../live/options";
import type { PlayCode } from "../live/plays";
import type { OwnedAccount } from "../live/settings";
import { type ChainPick, type ChainPreset, ChainSection } from "./chain-section";
import { ChartSection } from "./chart-section";
import { DeskTicket } from "./desk-ticket";
import { GuidanceSection } from "./guidance-section";
import type { PositionFocus } from "./option-positions";
import { OrdersSection } from "./orders-section";
import type { OutlookPick } from "./outlook-pick";
import { OutlookSection } from "./outlook-section";
import type { PageSection } from "./sections";
import { WatchlistSection } from "./watchlist-section";

/** The trade page's bench (split out of `routes/trade.tsx`): the section list, the props the
 *  page threads down, and the panes/bench that lay the sections out folded or docked. */

export type TradeSection =
  | "ticket"
  | "chart"
  | "chain"
  | "guidance"
  | "outlook"
  | "watchlist"
  | "orders";

// "ticket" stays first: `resolveSection` falls back to the first entry, and the ticket is the
// untyped default. The chain joined as the bench's second tool (#3407, Workbench slice 2); Outlook
// joined as an AUXILIARY entry (#3407 slice 4, placed by that plan's own state block — "never a
// home"), which is why it sits beside Guidance in `shows` rather than docking on its own. Watchlist
// joined on the same terms (#4332) and sits beside Outlook for the same reason: both are ways INTO
// a symbol, and this one is about many symbols at once, which is the opposite of what a bench is.
export const SECTIONS: readonly PageSection<TradeSection>[] = [
  { id: "ticket", label: "Ticket" },
  { id: "chart", label: "Chart" },
  { id: "chain", label: "Chain" },
  { id: "guidance", label: "Guidance" },
  { id: "outlook", label: "Outlook" },
  { id: "watchlist", label: "Watchlist" },
  { id: "orders", label: "Orders" },
];

export interface StageProps {
  readonly section: TradeSection;
  /** A `?desk=` that isn't the session's own, by name — see `DeskTicket`'s `notYours`. */
  readonly notYours?: string;
  readonly symbol: string;
  readonly play: string;
  readonly strike: string;
  readonly expiration: string;
  readonly desk: string;
  readonly plays: readonly PlayInfo[] | undefined;
  readonly onChainPick: (pick: ChainPick) => void;
  /** A strike picked on the Guidance tab — presets the ticket to that covered call or put. */
  readonly onGuidanceUse: (row: LadderRow) => void;
  /** A structure picked on the Outlook tab — opens the chain on its legs (slice 4). */
  readonly onOutlookUse: (pick: OutlookPick) => void;
  /** A row tapped on the Watchlist pane (#4332) — commits that symbol and, folded, lands the
   *  member on the ticket, exactly as a chain tap does. */
  readonly onWatchPick: (symbol: string) => void;
  /** A covered call the guidance's "Calls you've sold" handed off — opens it on the Orders pane. */
  readonly onManage: (call: ManageCall) => void;
  /** The held contract `?manage=` names, when there is one (see `PositionFocus`). */
  readonly focus: PositionFocus | undefined;
  readonly onExpirationCommit: (expiration: string) => void;
  readonly onPreset: (code: PlayCode) => void;
  readonly onSymbolCommit: (symbol: string) => void;
  readonly onStrikeCommit: (strike: string) => void;
  readonly accounts: readonly OwnedAccount[];
  readonly onDeskChange: (id: string) => void;
  /** A leg picked from the Chain pane while the Spread ticket is on screen (#3407) — threaded to
   *  `DraftOrderBuilder` alone; see `DeskTicket`'s own doc comment. */
  readonly incomingLeg?: { readonly leg: NewLeg; readonly key: number };
  readonly onIncomingLegHandled: () => void;
  /** Strikes the Spread draft already carries — outlined on the Chain pane; see
   *  `ChainSection`'s own doc comment. Undefined off the Spread rung. */
  readonly markedStrikes?: readonly number[];
  readonly onLegsChange: (legs: readonly DraftLeg[]) => void;
  /** A chain tap's price or locked-side note for the single-leg ticket — `DeskTicket`'s own doc. */
  readonly preset?: ChainPreset;
  readonly onPresetHandled: () => void;
  readonly onStage: (preset: Omit<ChainPreset, "key">) => void;
}

/** Whether the ticket at `props.play` is an option rung — the one case `chartSlot` applies to
 *  (`option-gate.tsx`'s own doc comment). Shared between `Pane` (what to render) and `Bench`
 *  (whether the bench-level chart pane is still needed) so the two can't drift apart. */
function isOptionTicket(props: StageProps): boolean {
  return props.plays?.find((p) => p.code === props.play)?.kind === "option";
}

/** One of the bench's tools by id — the same element whether it is the folded stage's only pane
 *  or one pane of the docked bench, so both layouts run one code path. */
function Pane({
  id,
  docked,
  props,
}: {
  readonly id: TradeSection;
  readonly docked: boolean;
  readonly props: StageProps;
}): ReactElement {
  const { symbol, play, strike, expiration, desk, plays } = props;
  // Folded, the ticket is off screen: an empty pane asks for the symbol itself (slice 2e).
  const ask = docked ? undefined : props.onSymbolCommit;
  if (id === "chart") return <ChartSection symbol={symbol} onSymbolCommit={ask} />;
  if (id === "orders") {
    return <OrdersSection deskId={desk} {...(props.focus ? { focus: props.focus } : {})} />;
  }
  if (id === "guidance") {
    // Keyed by symbol: a new symbol remounts the tab, so one symbol's stake and last-seen snapshot
    // can never render against — or be saved under — another symbol's market.
    return (
      <GuidanceSection
        key={symbol}
        symbol={symbol}
        deskId={desk}
        onUse={props.onGuidanceUse}
        onManage={props.onManage}
        onSymbolCommit={ask}
      />
    );
  }
  if (id === "watchlist") {
    // NOT keyed by symbol — unlike Guidance and Outlook, this pane is about the member's whole
    // list, and remounting it per committed symbol would re-read the list (and tear its one
    // socket down) every time a row was tapped.
    return <WatchlistSection symbol={symbol} onPick={props.onWatchPick} />;
  }
  if (id === "outlook") {
    // Keyed by symbol for the same reason Guidance is: a view stated about one underlying must not
    // survive onto another's chain as a staged control the member never re-read.
    return (
      <OutlookSection
        key={symbol}
        symbol={symbol}
        plays={plays}
        onUse={(_candidate, pick) => props.onOutlookUse(pick)}
        onSymbolCommit={ask}
      />
    );
  }
  if (id === "chain") {
    return (
      <ChainSection
        symbol={symbol}
        play={play}
        strike={strike}
        plays={plays}
        initialExpiration={expiration}
        onExpirationChange={props.onExpirationCommit}
        onPick={props.onChainPick}
        markedStrikes={props.markedStrikes}
        onSymbolCommit={ask}
        openAtPrice={!docked}
      />
    );
  }
  return (
    <DeskTicket
      desk={desk}
      code={play}
      onPreset={props.onPreset}
      initialSymbol={symbol || undefined}
      onSymbolCommit={props.onSymbolCommit}
      initialStrike={strike || undefined}
      onStrikeCommit={props.onStrikeCommit}
      initialExpiration={expiration || undefined}
      incomingLeg={props.incomingLeg}
      onIncomingLegHandled={props.onIncomingLegHandled}
      onLegsChange={props.onLegsChange}
      preset={props.preset}
      onPresetHandled={props.onPresetHandled}
      onStage={props.onStage}
      onExpirationCommit={props.onExpirationCommit}
      accounts={props.accounts}
      onDeskChange={props.onDeskChange}
      {...(props.notYours ? { notYours: props.notYours } : {})}
      chartSlot={docked && isOptionTicket(props) ? <ChartSection symbol={symbol} /> : undefined}
    />
  );
}

/** One pane of the bench, docked or folded: labelled like the switch button it stands in for
 *  only when docked (folded, the switch already names it), and marked when `?section=` names it
 *  (the mark is a bar as well as the accent — shape, not hue alone). */
function BenchPane({
  id,
  className,
  docked,
  current,
  props,
}: {
  readonly id: TradeSection;
  readonly className?: string;
  readonly docked: boolean;
  readonly current: boolean;
  readonly props: StageProps;
}): ReactElement {
  const label = SECTIONS.find((s) => s.id === id)?.label ?? id;
  return (
    <section
      id={`bench-${id}`}
      className={className ? `bench-pane ${className}` : "bench-pane"}
      data-current={current ? "true" : undefined}
      aria-label={label}
    >
      {docked ? <p className="bench-pane-title">{label}</p> : null}
      <Pane id={id} docked={docked} props={props} />
    </section>
  );
}

/** THE BENCH (Workbench slices 2–4b, `bench.css`). Folded, it shows the one pane the switch
 *  chose; docked, ticket left, chart right, the book across the bottom — and `?section=` names
 *  the pane to scroll to instead of choosing it. The chain no longer docks AUTOMATICALLY (Eric,
 *  2026-09-22, reversing part of slice 4b: "is it possible to have that table be expandable in
 *  the same form" — see `option-gate.tsx`'s chain accordion); it stays reachable at every width
 *  through the section switch (or a shared `?section=chain` link) as a standalone browsing view
 *  distinct from a specific ticket fill — docked, that's the one pane `shows` doesn't include by
 *  default, only when explicitly asked (review fix: an unconditional `id !== "chain"` made the
 *  route 404 in all but name above 1280px — a live `?section=chain` link opened wide would find
 *  no chain at all, not even folded-single-pane; a pane can be un-auto-shown without being
 *  unreachable). ONE TREE for both layouts: each pane keeps its slot whether or not its siblings
 *  render, so a window resized across the bench width docks and folds around a ticket mid-entry
 *  without remounting it (React keeps state by position; a separate folded component would drop
 *  a half-typed order on every crossing). */
export function Bench({
  docked,
  section,
  asked,
  props,
}: {
  readonly docked: boolean;
  readonly section: TradeSection;
  readonly asked?: TradeSection;
  readonly props: StageProps;
}): ReactElement {
  useEffect(() => {
    if (!(docked && asked)) return;
    document.getElementById(`bench-${asked}`)?.scrollIntoView({ block: "start" });
  }, [docked, asked]);
  const shows = (id: TradeSection) =>
    id === "chain" || id === "guidance" || id === "outlook" || id === "watchlist"
      ? asked === id
      : docked || section === id;
  const pane = (id: TradeSection, className?: string) =>
    shows(id) ? (
      <BenchPane
        id={id}
        className={className}
        docked={docked}
        current={docked && asked === id}
        props={props}
      />
    ) : null;
  // An option ticket, docked, carries its own chart beside the order-detail block (Eric,
  // 2026-09-22 — `option-gate.tsx`'s `chartSlot` doc comment): the bench-level chart pane would
  // just be the same chart twice, so it steps aside, and the ticket pane spans the full width the
  // chain needs ("the options table needs access to all available screen width real estate").
  // Every other ticket kind (stock, spread, locked, gated) is unaffected — chart stays its own
  // full-height column, as before.
  const ticketOwnsChart = docked && isOptionTicket(props);
  return (
    <div className={docked ? "bench bench-docked" : "bench"}>
      {pane("ticket", ticketOwnsChart ? "bench-ticket bench-ticket-full" : "bench-ticket")}
      {pane("chain", "bench-chain")}
      {pane("guidance", "bench-guidance")}
      {pane("outlook", "bench-outlook")}
      {pane("watchlist", "bench-watchlist")}
      {shows("chart") && !ticketOwnsChart ? (
        <div className="bench-side">{pane("chart")}</div>
      ) : null}
      {pane("orders", "bench-orders")}
    </div>
  );
}
