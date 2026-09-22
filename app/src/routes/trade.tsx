import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { DraftLeg, NewLeg } from "../live/draft-order";
import { normalizeExpiration } from "../live/expiration";
import { fetchPlays, type PlayInfo } from "../live/options";
import { navForPlay, type PlayCode } from "../live/plays";
import { fetchSettings, type OwnedAccount } from "../live/settings";
import { normalizeStrike } from "../live/strike";
import { normalizeSymbol } from "../live/symbol";
import {
  type ChainPick,
  ChainSection,
  chainPickLeg,
  chainPickTarget,
} from "../shell/chain-section";
import { ChartSection } from "../shell/chart-section";
import { DraftOrderBuilder } from "../shell/draft-order-builder";
import { PageFrame } from "../shell/frame";
import { LadderGateCard } from "../shell/ladder-gate";
import { LockedPanel } from "../shell/locked-panel";
import { OptionGate } from "../shell/option-gate";
import { OrdersSection } from "../shell/orders-section";
import { RungChip } from "../shell/rung-chip";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { TicketNav } from "../shell/ticket-nav";
import { TradeGate } from "../shell/trade-gate";
import { useBenchWidth } from "../shell/use-bench-width";

/**
 * THE TRADE TICKET (#738, live-review round; options since phase 10b) — the dedicated trading
 * workflow surface. `?desk=` picks the account; `?play=` picks the rung from the seven-play
 * catalog (101/102 side the share gate, 201-302 open the options gate, 401 the multi-leg
 * builder) — both typed, shareable search params, which is also what the learn milestones'
 * "open the ticket" links carry. 501 (zero-DTE) has no ticket of its own — it's an attribute any
 * option order can carry (#1671), gated at review/submit rather than through `?play=`.
 *
 * The multi-leg builder used to render unconditionally under every ticket; it is now 401's own
 * ticket body — visible only on the Spread instrument, and only once 401 is unlocked (a locked
 * 401 shows the shared `LockedPanel` instead, exactly like every other rung).
 *
 * Account choice is a FIELD of the ticket (`AccountField`), not a gatekeeper screen the ticket
 * waits behind — the form is always on-screen, defaulting to the session's own first account.
 * The options list is `/api/settings`'s `accounts`, which only ever names accounts the session
 * owns (`ownsAccount`'s doc comment) — the same server-side identity the desk gate re-checks at
 * submit, so nothing here can offer, let alone place, a ticket against someone else's desk.
 *
 * PAGE ORDER (#3407, Workbench slice 5 — Eric, 2026-09-22, "B — keep"): the milestone STRIP moved to
 * `/learn/trading`; the ticket keeps a one-line `RungChip` (rung · state word · count · the door
 * to the ladder) and the `AccountField` sits directly above the ticket's own nav — both are the
 * ticket's, so they live in the ticket PANE, which is what puts them beside the chain and the
 * chart when the bench docks instead of above the whole bench. #1461's principle holds
 * (milestones gate, they never drive); only its placement was overturned. Every ticket panel
 * (`.gate-panel`) keeps the `--col-wide` cap the strip set (`gate.css`).
 *
 * SECTIONS (#2017 Phase 1 chart build-out; the mechanism is #1740's): the page holds four SHAPES
 * of data for one symbol and one account — the ticket, its daily chart, the options chain and the
 * account's book — so the rail carries the section switch, URL-stateful via `?section=`. "ticket"
 * is the default and the untyped state (the param is omitted when it's chosen), so a member who
 * never touches the switch sees exactly the ticket they always have. The chart and the chain read
 * the same `?symbol=` the ticket commits — no second symbol input.
 *
 * THE BENCH (#3407, the Workbench pick; frame.tsx → "ONE COMPOSITION OF SECTIONS"): below the
 * bench width the sections are exclusive, as above. At the bench width (`useBenchWidth`, 1280px)
 * they DOCK — ticket left, chart right, the book across the bottom — the switch leaves the rail,
 * and `?section=` names the pane to scroll to. The panes keep talking through the URL exactly as
 * when folded (`?strike=`, `?exp=`, `?play=`), which is what lets one code path serve both.
 *
 * THE CHAIN IS NOT A DOCKED PANE (Eric, 2026-09-22, reversing part of slice 4b): the ticket's own
 * chain table is inline again at every width, and collapsible (`option-gate.tsx`'s chain
 * accordion) — open once a symbol commits, folded to one line once a strike is picked. "Chain"
 * stays in `SECTIONS` and reachable folded through the switch, as a standalone browsing view
 * distinct from filling a specific ticket; it never docks (`Bench`'s `shows`).
 */

const PLAY_CODES = new Set(["101", "102", "201", "202", "301", "302", "401"]);

type TradeSection = "ticket" | "chart" | "chain" | "orders";

// "ticket" stays first: `resolveSection` falls back to the first entry, and the ticket is the
// untyped default. The chain joined as the bench's second tool (#3407, Workbench slice 2).
const SECTIONS: readonly PageSection<TradeSection>[] = [
  { id: "ticket", label: "Ticket" },
  { id: "chart", label: "Chart" },
  { id: "chain", label: "Chain" },
  { id: "orders", label: "Orders" },
];

function AccountField({
  accounts,
  deskId,
  onChange,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly deskId: string;
  readonly onChange: (id: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>Account</label>
      <select id={id} value={deskId} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function DeskTicket({
  desk,
  code,
  onPreset,
  initialSymbol,
  onSymbolCommit,
  initialStrike,
  onStrikeCommit,
  initialExpiration,
  onExpirationCommit,
  accounts,
  onDeskChange,
  chartSlot,
  incomingLeg,
  onIncomingLegHandled,
  onLegsChange,
}: {
  readonly desk: string;
  readonly code: string;
  /** The session's own accounts (`/api/settings`); the picker renders only when there is a choice. */
  readonly accounts: readonly OwnedAccount[];
  readonly onDeskChange: (id: string) => void;
  /** The ticket's own nav and the rail both preset `?play=` through this (#1461); a chain cell
   *  pick that switches side/type (task 4e) presets through the same handler. */
  readonly onPreset: (code: PlayCode) => void;
  /** `?symbol=` — the value a fresh (or remounted) ticket starts from. */
  readonly initialSymbol?: string;
  /** Committing a symbol in either gate writes it back to `?symbol=` (cockpit plan, red-team
   *  finding): both gates remount on every Instrument/Side switch (`key={info.code}` /
   *  `key={code}` below), which used to drop a hand-typed symbol on every switch. */
  readonly onSymbolCommit?: (symbol: string) => void;
  /** `?strike=` (task 4e) — survives a rung-switch remount the same way `initialSymbol`/
   *  `onSymbolCommit` does (a chain cell that switches the ticket to a different rung remounts
   *  `OptionGate`, so the strike it just picked has to come back through route state, same as a
   *  hand-typed symbol already does), but the two don't commit on the same cadence (review fix,
   *  2026-09-08): a chain-cell strike pick against a rung the member CAN reach (the current one, or
   *  an unlocked target it's about to switch to) commits immediately, while a hand-typed strike
   *  commits on blur, throttled the same way `SymbolField` throttles its own typed commits (see
   *  `option-gate.tsx`'s header comment). A locked-target pick fills strike but never commits —
   *  the rung didn't change, so there's nothing new for the URL to say. */
  readonly initialStrike?: string;
  readonly onStrikeCommit?: (strike: string) => void;
  /** `?exp=` (slice 4a) — seeds the options ticket's expiration; changes commit back. */
  readonly initialExpiration?: string;
  readonly onExpirationCommit?: (expiration: string) => void;
  /** Forwarded to `OptionGate` alone (see its own doc comment) — a stock or spread ticket keeps
   *  today's behavior (chart as its own bench pane) unchanged. */
  readonly chartSlot?: ReactElement;
  /** Forwarded to `DraftOrderBuilder` alone (multi-leg) — a leg picked from the standalone Chain
   *  section pane while the Spread ticket is on screen (#3407). */
  readonly incomingLeg?: { readonly leg: NewLeg; readonly key: number };
  readonly onIncomingLegHandled?: () => void;
  readonly onLegsChange?: (legs: readonly DraftLeg[]) => void;
}) {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const info: PlayInfo | undefined = plays.data?.plays.find((p) => p.code === code);
  // 501 has no ticket of its own (#1671) — it's an attribute any option order can carry, looked up
  // independently of `info` so the expiration field can disable today regardless of which rung
  // the ticket is currently on.
  const zeroDte = plays.data?.plays.find((p) => p.code === "501");
  // The feedback gate (#1119): while it holds, every rung that OPENS a position shows the gate card
  // instead of a ticket. A sell (102) is an exit and stays open — the server holds the same line.
  const gate = plays.data?.gate;
  const gated = gate !== undefined && code !== "102";
  return (
    <>
      {accounts.length > 1 ? (
        <AccountField accounts={accounts} deskId={desk} onChange={onDeskChange} />
      ) : null}
      {plays.data ? <RungChip plays={plays.data.plays} code={code} /> : null}
      {plays.data ? (
        <TicketNav
          plays={plays.data.plays}
          code={code}
          gate={plays.data.gate}
          onPreset={onPreset}
        />
      ) : null}
      {gated ? (
        <LadderGateCard note={gate.note} />
      ) : info && info.kind === "multi-leg" ? (
        info.locked ? (
          <LockedPanel play={info} />
        ) : (
          <DraftOrderBuilder
            deskId={desk}
            incomingLeg={incomingLeg}
            onIncomingLegHandled={onIncomingLegHandled}
            onLegsChange={onLegsChange}
          />
        )
      ) : info && info.kind === "option" ? (
        <OptionGate
          key={info.code}
          deskId={desk}
          play={info}
          zeroDte={zeroDte}
          initialSymbol={initialSymbol}
          onSymbolCommit={onSymbolCommit}
          initialStrike={initialStrike}
          onStrikeCommit={onStrikeCommit}
          initialExpiration={initialExpiration}
          onExpirationCommit={onExpirationCommit}
          plays={plays.data?.plays ?? []}
          onPreset={onPreset}
          chartSlot={chartSlot}
        />
      ) : (
        <TradeGate
          key={code}
          deskId={desk}
          initialAction={code === "102" ? "sell" : "buy"}
          showSide={false}
          play={info}
          initialSymbol={initialSymbol}
          onSymbolCommit={onSymbolCommit}
        />
      )}
      {/* Working orders, Alerts and Option positions moved to the Orders section (#3407,
          Workbench slice 3) — the account's book is its own pane, one rail tap away. */}
    </>
  );
}

interface StageProps {
  readonly section: TradeSection;
  readonly symbol: string;
  readonly play: string;
  readonly strike: string;
  readonly expiration: string;
  readonly desk: string;
  readonly plays: readonly PlayInfo[] | undefined;
  readonly onChainPick: (pick: ChainPick) => void;
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
  if (id === "chart") return <ChartSection symbol={symbol} />;
  if (id === "orders") return <OrdersSection deskId={desk} />;
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
      onExpirationCommit={props.onExpirationCommit}
      accounts={props.accounts}
      onDeskChange={props.onDeskChange}
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
function Bench({
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
    id === "chain" ? asked === "chain" : docked || section === id;
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
      {shows("chart") && !ticketOwnsChart ? (
        <div className="bench-side">{pane("chart")}</div>
      ) : null}
      {pane("orders", "bench-orders")}
    </div>
  );
}

function TradePage(): ReactElement {
  const { desk, play, symbol, strike, exp, section: askedSection } = Route.useSearch();
  const navigate = Route.useNavigate();
  const section = resolveSection(SECTIONS, askedSection);
  const docked = useBenchWidth();
  const onSection = (next: TradeSection) =>
    void navigate({
      search: (prev) => ({ ...prev, section: next === "ticket" ? undefined : next }),
      replace: true,
    });
  /** Committing a symbol writes it into `?symbol=` so it survives the remount every
   *  Instrument/Side switch causes (#2017 cockpit plan). Guarded against the current search value
   *  so a blur that didn't change anything (e.g. right after mounting from `initialSymbol`)
   *  doesn't push a redundant history entry — and `replace: true` regardless, since a symbol edit
   *  is a refinement of the same ticket, not a new page to land back on. A new symbol also drops
   *  any `?strike=` already in the URL (review fix, 2026-09-08) — a strike picked against the OLD
   *  underlying's chain is meaningless once the symbol changes; guarded on `prev.strike` actually
   *  being present so this doesn't churn the search object on every symbol edit for nothing.
   *  `resetScroll: false` (Eric, 2026-09-22 — "clicking on a strike price, bid/ask premium price
   *  trigger 'scroll to top' behavior which has the same effect as extreme content shift"):
   *  TanStack Router resets scroll to the top on every navigation by default, even a same-page
   *  search-param refinement like this one — jarring mid-scroll on a long ticket. */
  const commitSymbol = (s: string) => {
    const next = normalizeSymbol(s);
    if (next === symbol) return;
    navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => {
        const nextSearch = { ...prev };
        if (next) nextSearch.symbol = next;
        else delete nextSearch.symbol;
        if (prev.strike !== undefined) delete nextSearch.strike;
        return nextSearch;
      },
    });
  };
  /** `?strike=` (task 4e) — a chain cell pick always writes a definite, already-normalized numeric
   *  value (never a manual edit), so this is simpler than `commitSymbol`: still guarded against the
   *  current search value and `replace: true` for the same reason, and still deletes the param on
   *  an invalid/empty value for safety, even though a chain click never actually sends one.
   *  `resetScroll: false` — same content-shift fix as `commitSymbol`, and the one this bug was
   *  actually reported against: a strike/bid/ask click used to jump the whole page to the top. */
  const commitStrike = (s: string) => {
    const next = normalizeStrike(s);
    if (next === strike) return;
    navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => {
        const nextSearch = { ...prev };
        if (next) nextSearch.strike = next;
        else delete nextSearch.strike;
        return nextSearch;
      },
    });
  };
  // Same `["plays"]` key `DeskTicket` queries below — react-query shares the one cached fetch, no
  // second round trip. Fetched here so a chain-section tap can resolve its target rung.
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  // A leg picked from the Chain pane while building a Spread (#3407 — "the chain pane adds legs
  // on the Spread rung"): `key` is a plain counter, not `Date.now()`, so two picks in the same
  // millisecond still get distinct keys. `draftLegs` mirrors the draft's own legs (reported by
  // `DraftOrderBuilder`'s `onLegsChange`) so the chain pane can mark strikes already in the order.
  const [incomingLeg, setIncomingLeg] = useState<{ leg: NewLeg; key: number } | undefined>(
    undefined,
  );
  const legPickCounter = useRef(0);
  const [draftLegs, setDraftLegs] = useState<readonly DraftLeg[]>([]);
  const isSpread = navForPlay(play ?? "101").instrument === "spread";
  // Leaving the Spread rung empties the marks — a stale outline from an abandoned draft would
  // otherwise survive a switch to an unrelated ticket (`DraftOrderBuilder` itself remounts fresh
  // the next time 401 is reached, losing the legs these marks describe).
  useEffect(() => {
    if (!isSpread) setDraftLegs([]);
  }, [isSpread]);
  /** A tap on the chain section either adds a leg (building a Spread) or presets the ticket
   *  through the URL (every other rung, Workbench slice 2): the strike always travels, the rung
   *  only when the target is unlocked (`chainPickTarget`, the ticket's own fail-safe rule), and
   *  the section switches back to the ticket so the member lands on the preset form, not on the
   *  chain they just left. A leg pick stays ON the chain pane instead (`chainPickLeg`) — the same
   *  "tap several, then go review" flow `DraftLegForm`'s own inline chain already gives a Spread
   *  built from its own picker; a bare strike tap on the Spread rung (no bid/ask, so no clear
   *  buy/sell) is a no-op rather than a guess. */
  const onChainPick = (pick: ChainPick) => {
    const leg = chainPickLeg(play ?? "101", symbol ?? "", pick);
    if (leg) {
      setIncomingLeg({ leg, key: ++legPickCounter.current });
      return;
    }
    if (isSpread) return;
    const target = chainPickTarget(play ?? "101", pick.side, plays.data?.plays);
    void navigate({
      resetScroll: false,
      search: (prev) => {
        // The expiration travels with the strike (slice 4a): a 180 tapped on the Oct 16 chain
        // is the Oct 16 180, not whichever expiry the ticket happened to be on.
        const next = { ...prev, strike: pick.strike, exp: pick.expiration };
        delete next.section;
        return target.play ? { ...next, play: target.play } : next;
      },
    });
  };
  /** `?exp=` follows whichever tool changed it — the chain pane's browse or the ticket's own
   *  field — so the two never name different contracts. `replace: true`, a refinement. */
  const commitExpiration = (next: string) => {
    const normalized = normalizeExpiration(next);
    if (normalized === exp) return;
    void navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => {
        const nextSearch = { ...prev };
        if (normalized) nextSearch.exp = normalized;
        else delete nextSearch.exp;
        return nextSearch;
      },
    });
  };
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  // A bookmarked or shared `?desk=` only sticks if it's still an account the session owns —
  // otherwise fall back to the first owned account, same as having no `?desk=` at all.
  const activeDesk = (desk && accounts.some((a) => a.id === desk) ? desk : accounts[0]?.id) as
    | string
    | undefined;
  // Same underlying, and same expiration when the pane's committed to one (`?exp=` is "" until a
  // browse writes it) — mirrors `DraftLegForm`'s own marking filter for its inline chain.
  const markedStrikes = isSpread
    ? draftLegs
        .filter((leg) => leg.underlying === (symbol ?? "") && (!exp || leg.expiration === exp))
        .map((leg) => leg.strike)
    : undefined;
  const stageProps: StageProps = {
    section,
    symbol: symbol ?? "",
    play: play ?? "101",
    strike: strike ?? "",
    expiration: exp ?? "",
    desk: activeDesk ?? "",
    plays: plays.data?.plays,
    onChainPick,
    onExpirationCommit: commitExpiration,
    onPreset: (code) =>
      void navigate({ resetScroll: false, search: (prev) => ({ ...prev, play: code }) }),
    onSymbolCommit: commitSymbol,
    onStrikeCommit: commitStrike,
    accounts,
    onDeskChange: (id) =>
      void navigate({ resetScroll: false, search: (prev) => ({ ...prev, desk: id }) }),
    incomingLeg,
    onIncomingLegHandled: () => setIncomingLeg(undefined),
    markedStrikes,
    onLegsChange: setDraftLegs,
  };
  // #784 naming pass: no second rail item here yet. The Trading Outpost link that used to sit
  // below "The ticket" was removed on the belief its content was superseded by the Playbook
  // Store — #3333's slice-8 audit found that claim false (different features entirely) and
  // ported the Outpost's actual catalog into Research's "Plays" section instead. Growing this
  // rail to "critical mass" with real items (Portfolio, a Backtesting/Strategy Lab placeholder)
  // is #784's own slice 7, not bundled into the naming pass.
  const rail = (
    <>
      <p className="rail-label">Trading</p>
      <span className="rail-current" aria-current="page">
        Trade
      </span>
      <hr />
      {/* Docked, every pane is already on the page — the switch would be a control with nothing
          to choose (frame.tsx: "The section switch renders only when folded"). */}
      {docked ? null : (
        <>
          <SectionSwitch sections={SECTIONS} current={section} onSelect={onSection} />
          <hr />
        </>
      )}
      {activeDesk ? (
        <Link to="/u/$id" params={{ id: activeDesk }}>
          ← Back to account
        </Link>
      ) : (
        <Link to="/leaderboard" search={{ by: "equity" }}>
          ← Leaderboard
        </Link>
      )}
    </>
  );
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <h1>Trade</h1>
        <p>
          Paper account · the gate reviews every order before anything is sent, and re-checks the
          live account at submit.
        </p>
      </header>
      {settings.isLoading ? null : accounts.length === 0 ? (
        <p className="note">No accounts are linked to your session yet.</p>
      ) : activeDesk ? (
        <Bench docked={docked} section={section} asked={askedSection} props={stageProps} />
      ) : null}
    </PageFrame>
  );
}

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => {
    // The router JSON-parses search values, so a legacy ?play=201 arrives as a NUMBER — normalize
    // through String before gating against the catalog's codes.
    const play = typeof search.play === "object" ? "" : String(search.play ?? "");
    // `?symbol=` (cockpit plan, red-team finding): a hand-typed or stale value that doesn't match
    // the accepted shape is dropped rather than passed through — see normalizeSymbol's doc comment.
    const symbol = normalizeSymbol(search.symbol);
    // `?strike=` (task 4e): same shape check pattern as symbol, mirrored one-for-one.
    const strike = normalizeStrike(search.strike);
    // `?exp=` (#3407, Workbench slice 4a): ISO date or dropped, same posture as symbol/strike.
    const exp = normalizeExpiration(search.exp);
    return {
      ...(typeof search.desk === "string" && search.desk.length > 0 && search.desk.length <= 100
        ? { desk: search.desk }
        : {}),
      ...(PLAY_CODES.has(play) ? { play: play as PlayInfo["code"] } : {}),
      ...(symbol !== undefined ? { symbol } : {}),
      ...(strike !== undefined ? { strike } : {}),
      ...(exp !== undefined ? { exp } : {}),
      // `?section=` (#2017 Phase 1 chart build-out): only a known section id passes, exactly as
      // `activity.tsx` narrows its own; anything else is dropped and `resolveSection` falls back.
      ...(typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
        ? { section: search.section as TradeSection }
        : {}),
    };
  },
  component: TradePage,
});
