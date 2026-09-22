import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { ChainQuoteCoverage, ChainRow } from "../live/options";
import {
  dividerIndex,
  inTheMoney,
  mergeStraddle,
  type StraddleRow,
  windowRows,
} from "../live/straddle";
import { money } from "../live/ticket";
import { EarningsBadge } from "./earnings-badge";

/** Total columns the table now spans: Strike (1) + 8 sub-columns per side (Bid, Ask, OI, Vol, Δ,
 *  Γ, Θ, Vega) × 2 sides — kept as one constant so the divider row's `colSpan` and the header
 *  markup can never drift apart. */
const TOTAL_COLUMNS = 17;

/** Width of calls' 6 stat columns (`OI, Vol, Δ, Γ, Θ, Vega`) in px — the initial `scrollLeft`
 *  offset that opens the view on the base five instead of calls' stats (see the FIX note above).
 *  `44` mirrors `.straddle-col-stat`'s width in `straddle.css`; there's no clean way to share a
 *  single literal across the `.ts`/`.css` boundary, so keep the two in sync by hand if either
 *  changes. */
const CALLS_STAT_WIDTH = 6 * 44;

/**
 * THE STRADDLE VIEW (#1481, slice 1) — one expiration's chain as the entry instrument: strike down
 * the centre, call bid/ask to the left, put bid/ask to the right, a "Current price" divider row,
 * and an in-the-money rail on each side. The base view is these five columns and nothing else —
 * the short and long premiums for both sides in one glance (Eric, 2026-09-05). Volume, open
 * interest and the four core greeks now ship too (#2017 Phase 1 slice 14, below) — last trade
 * price is still out of scope, the one column this component's base-five promise still owes.
 *
 * Mobile-first: the base five (Calls Bid/Ask, Strike, Puts Bid/Ask) are what's actually ON SCREEN
 * at 390px, by construction, not just by column count — see the fix below. The window keeps ±8
 * strikes around the divider and says how many it hid. A row click is a PRESET — it hands the
 * strike to the ticket's `pickStrike`, which also seeds the limit from the quoted mid. Nothing
 * here prices anything: every number is the server's, drawn verbatim, "—" where the feed had none.
 *
 * Open interest, volume, and the four core greeks (delta/gamma/theta/vega) ship as scroll-out
 * columns past the base five (#2017 Phase 1 slice 14), in the SAME `.straddle-scroll` horizontal
 * container, just more columns. They are plain, never clickable (only Bid/Ask/Strike are presets).
 * "Last trade price" and rho stay out of scope.
 *
 * FIX (found in review, #2017 Phase 1 slice 14): the six stat columns per side originally sat
 * BETWEEN Bid/Ask and Strike (`Bid, Ask, OI, Vol, Δ, Γ, Θ, Vega`), so an unscrolled 390px view —
 * `.straddle-scroll` starts at `scrollLeft: 0` — showed calls' stats instead of Strike and the
 * Puts side, breaking the base-five promise above. Fixed two ways together: (1) each side's 8
 * columns are now ordered with the stats on the OUTER edge, away from Strike — Calls reads
 * `OI, Vol, Δ, Γ, Θ, Vega, Bid, Ask` (stats then Bid/Ask, closest to Strike), Puts reads
 * `Bid, Ask, OI, Vol, Δ, Γ, Θ, Vega` (Bid/Ask closest to Strike, then stats) — so Bid/Ask/Strike
 * are contiguous in the DOM; (2) the scroll container opens with an initial `scrollLeft` offset
 * (see the mount effect below) equal to the width of calls' six stat columns, so that contiguous
 * base five is what's actually visible by default, not merely reachable. A member can still swipe
 * LEFT of that offset for calls' OI/Vol/greeks, or RIGHT past Puts' Bid/Ask for puts' OI/Vol/
 * greeks — both directions, both discoverable via the same "scroll for more" affordance.
 *
 * A call or put PRICE cell can be its own preset too (#2017 Phase 0 task 4e, `onPickSide`): the
 * caller decides what a call/put pick means (in `OptionGate`, it can also switch Side/Type when
 * that's safe) — this component only reports which strike and which side got clicked, and since
 * #3407 P3 slice 2 WHICH price cell (bid or ask) with the value it showed, so the multi-leg
 * builder can read Fidelity's grammar off the tap: Bid = sell that contract, Ask = buy it. Cells
 * with no quoted value are still clickable — the contract exists in the chain regardless of
 * whether a live quote came back for it. Omitting `onPickSide` renders cells exactly as before
 * (plain, non-interactive), for any caller that doesn't wire this up. `markedStrikes` (same
 * slice) outlines the strikes a draft already carries legs on, so a spread reads on the chain.
 * @category trading
 */
/** Which price cell a side pick landed on, with the number it showed ("—" arrives as undefined). */
export interface PickedCell {
  readonly price: "bid" | "ask";
  readonly value?: number;
}

export type PickSide = (strike: number, side: "call" | "put", cell: PickedCell) => void;

export function StraddleView({
  symbol,
  expiration,
  spot,
  calls,
  puts,
  selectedStrike,
  markedStrikes,
  onPickStrike,
  onPickSide,
  now = new Date(),
  quotes,
  expirationField,
  heldBadges,
  pending,
}: {
  readonly symbol: string;
  readonly expiration: string;
  readonly spot?: number;
  readonly calls: readonly ChainRow[];
  readonly puts: readonly ChainRow[];
  readonly selectedStrike?: number;
  /** Strikes a draft already carries a leg on (#3407 P3 slice 2) — outlined, never selected. */
  readonly markedStrikes?: readonly number[];
  readonly onPickStrike?: (strike: number) => void;
  /** A call/put price cell pick (task 4e) — fires with the row's strike and which side was
   *  clicked, plus which price cell it was and the value it showed (P3 slice 2; callers that
   *  only want the first two ignore the rest). Optional: omitted, cells render as plain,
   *  non-interactive text (unchanged). */
  readonly onPickSide?: PickSide;
  readonly now?: Date;
  /** Quote provenance for the side the ticket is on (#3407 P2) — rendered as one honest line
   *  under the table so a "—" cell reads as "not quoted", never as "zero". */
  readonly quotes?: ChainQuoteCoverage;
  /** The caller's own expiration picker (the single-leg ticket's `.exp-tabs` strip), rendered
   *  where the "Chain · SYM · date" eyebrow used to sit — the chain's full width is where that
   *  strip actually has room to show more than 1.5 dates, unlike the cramped ticket grid it came
   *  from. Omitted, nothing renders here (the multi-leg builder's plain `<select>` stays in its
   *  own field grid, untouched). */
  readonly expirationField?: ReactNode;
  /** A held-position badge per strike ("C"/"P"/"C/P") — a REAL, already-filled holding, distinct
   *  from `markedStrikes`'s draft-leg outline. Only the single-leg ticket passes this (Eric,
   *  2026-09-22); omitted, no badge column space is reserved and no other caller's layout shifts. */
  readonly heldBadges?: ReadonlyMap<number, string>;
  /** True while a new expiration's rows are still in flight and these are the OLD ones, held on
   *  screen by `placeholderData: keepPreviousData` on the caller's query (Eric, 2026-09-22 — a
   *  tab click used to drop straight to "Looking up options…" and collapse the whole table, then
   *  snap back to a different height). A dim, not a spinner or a skeleton: the numbers shown are
   *  real, just for the strike/expiration a member is a beat past clicking away from. */
  readonly pending?: boolean;
}): ReactElement {
  const [showAll, setShowAll] = useState(false);
  const all = mergeStraddle(calls, puts);
  const windowed = windowRows(all, spot);
  const { rows, hidden } = showAll ? { rows: all, hidden: 0 } : windowed;
  // "Show all" is reversible (#3407 P0): a member who expanded to find a far strike can fold the
  // chain back around the money — or, with no spot, around the middle, and the button says which.
  const foldLabel = windowed.centred === "spot" ? "around the price" : "around the middle";
  const divider = dividerIndex(rows, spot);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Open centred on the base five (Calls Bid/Ask, Strike, Puts Bid/Ask) — see the header comment's
  // FIX note. A plain `scrollLeft` assignment (not `scrollTo({ behavior: "smooth" })`) is instant,
  // not animated, so it respects `prefers-reduced-motion` for free — there's no motion to reduce.
  // `StraddleView` isn't remounted per expiration (no `key` at either call site,
  // `chain-straddle.tsx` / `option-gate.tsx`), so `symbol`/`expiration` ARE the trigger for
  // re-running this on a fresh chain rather than relying on a fresh mount; it does NOT depend on
  // `selectedStrike` or other props, so picking a strike never resets a member's own scroll
  // position.
  // biome-ignore lint/correctness/useExhaustiveDependencies: symbol/expiration ARE the trigger
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = CALLS_STAT_WIDTH;
  }, [symbol, expiration]);
  return (
    <section className="straddle" aria-label={`Options chain for ${symbol}`}>
      {expirationField}
      <EarningsBadge symbol={symbol} now={now} />
      <div
        className={pending ? "straddle-scroll straddle-pending" : "straddle-scroll"}
        ref={scrollRef}
      >
        <table className="straddle-table">
          <colgroup>
            {/* Bid/Ask/OI/Vol/Δ/Γ/Θ/Vega × 2 sides + Strike = 17 columns total (`TOTAL_COLUMNS`).
                Fixed pixel widths (`straddle.css`) so the table's natural width can exceed its
                container and `.straddle-scroll`'s overflow-x kicks in, instead of the 5-column
                percentage layout compressing to fit — `table-layout: fixed` only honors the FIRST
                row's per-column cells, and that row is the colSpan=8 group header, so widths live
                on `<col>` here rather than on the sub-header `<th>`s below. Order per side matches
                the fix above: stats on the OUTER edge, Bid/Ask adjacent to Strike. */}
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-bidask" />
            <col className="straddle-col-bidask" />
            <col className="straddle-col-strike" />
            <col className="straddle-col-bidask" />
            <col className="straddle-col-bidask" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
            <col className="straddle-col-stat" />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={8} className="straddle-side straddle-side-calls">
                Calls
              </th>
              <th className="straddle-strike-h">Strike</th>
              <th colSpan={8} className="straddle-side straddle-side-puts">
                Puts
              </th>
            </tr>
            <tr className="straddle-sub">
              <th className="straddle-stat">OI</th>
              <th className="straddle-stat">Vol</th>
              <th className="straddle-stat">Δ</th>
              <th className="straddle-stat">Γ</th>
              <th className="straddle-stat">Θ</th>
              <th className="straddle-stat">Vega</th>
              <th>Bid</th>
              <th>Ask</th>
              <th />
              <th>Bid</th>
              <th>Ask</th>
              <th className="straddle-stat">OI</th>
              <th className="straddle-stat">Vol</th>
              <th className="straddle-stat">Δ</th>
              <th className="straddle-stat">Γ</th>
              <th className="straddle-stat">Θ</th>
              <th className="straddle-stat">Vega</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <RowGroup
                key={row.strike}
                row={row}
                spot={spot}
                divider={i === divider}
                selected={row.strike === selectedStrike}
                marked={markedStrikes?.includes(row.strike) ?? false}
                held={heldBadges?.get(row.strike)}
                showHeldSlot={heldBadges !== undefined}
                onPick={onPickStrike}
                onPickSide={onPickSide}
              />
            ))}
            {divider !== undefined && divider === rows.length && spot !== undefined ? (
              <DividerRow spot={spot} />
            ) : null}
          </tbody>
        </table>
      </div>
      {hidden > 0 ? (
        <button type="button" className="straddle-more" onClick={() => setShowAll(true)}>
          Show all {all.length} strikes
          {windowed.centred === "middle" ? " · no live price, windowed around the middle" : ""}
        </button>
      ) : showAll && windowed.hidden > 0 ? (
        <button type="button" className="straddle-more" onClick={() => setShowAll(false)}>
          Show {windowed.rows.length} strikes {foldLabel}
        </button>
      ) : null}
      {quotes ? <p className="straddle-coverage">{coverageLine(quotes)}</p> : null}
    </section>
  );
}

/** The provenance sentence: source, coverage and the as-of clock — words, never a hue. */
export function coverageLine(quotes: ChainQuoteCoverage): string {
  const at = new Date(quotes.asOf);
  const stamp = Number.isNaN(at.getTime())
    ? ""
    : ` · as of ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (quotes.source === "unavailable") {
    return `Quotes unavailable right now — strikes from the contract list, premiums from last close; "—" means not quoted${stamp}.`;
  }
  const coverage =
    quotes.quoted === quotes.total
      ? `all ${quotes.total} strikes`
      : `${quotes.quoted} of ${quotes.total} strikes`;
  return `Bid / ask and greeks from the indicative feed · ${coverage} quoted; "—" means the feed had none${stamp}.`;
}

function DividerRow({ spot }: { readonly spot: number }): ReactElement {
  return (
    <tr className="straddle-divider">
      <td colSpan={TOTAL_COLUMNS}>
        Current price · <span className="num">{money(spot)}</span>
      </td>
    </tr>
  );
}

function RowGroup({
  row,
  spot,
  divider,
  selected,
  marked,
  held,
  showHeldSlot,
  onPick,
  onPickSide,
}: {
  readonly row: StraddleRow;
  readonly spot?: number;
  readonly divider: boolean;
  readonly selected: boolean;
  readonly marked: boolean;
  /** "C" / "P" / "C/P" when the desk holds a contract at this strike (this expiration), else
   *  undefined. */
  readonly held?: string;
  /** True whenever the caller passed `heldBadges` at all — reserves the badge's column space on
   *  EVERY row (held or not) so a badge appearing on one row never shifts the strike column for
   *  its neighbors. False for a caller that never passes `heldBadges` (no reserved space, no
   *  layout change from before this feature). */
  readonly showHeldSlot: boolean;
  readonly onPick?: (strike: number) => void;
  readonly onPickSide?: PickSide;
}): ReactElement {
  const callItm = inTheMoney(row.strike, spot, "call");
  const putItm = inTheMoney(row.strike, spot, "put");
  const cls = [
    "straddle-row",
    callItm ? "straddle-call-itm" : "",
    putItm ? "straddle-put-itm" : "",
    selected ? "straddle-selected" : "",
    marked ? "straddle-marked" : "",
    onPick ? "straddle-pickable" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      {divider && spot !== undefined ? <DividerRow spot={spot} /> : null}
      <tr className={cls} onClick={onPick ? () => onPick(row.strike) : undefined}>
        <StatCell value={row.call?.openInterest} kind="count" />
        <StatCell value={row.call?.volume} kind="count" />
        <StatCell value={row.call?.delta} kind="greek" />
        <StatCell value={row.call?.gamma} kind="greek" />
        <StatCell value={row.call?.theta} kind="greek" />
        <StatCell value={row.call?.vega} kind="greek" />
        <SideCell row={row} side="call" price="bid" onPickSide={onPickSide} />
        <SideCell row={row} side="call" price="ask" onPickSide={onPickSide} />
        <StrikeCell
          strike={row.strike}
          selected={selected}
          held={held}
          showHeldSlot={showHeldSlot}
          onPick={onPick}
        />
        <SideCell row={row} side="put" price="bid" onPickSide={onPickSide} />
        <SideCell row={row} side="put" price="ask" onPickSide={onPickSide} />
        <StatCell value={row.put?.openInterest} kind="count" />
        <StatCell value={row.put?.volume} kind="count" />
        <StatCell value={row.put?.delta} kind="greek" />
        <StatCell value={row.put?.gamma} kind="greek" />
        <StatCell value={row.put?.theta} kind="greek" />
        <StatCell value={row.put?.vega} kind="greek" />
      </tr>
    </>
  );
}

/** " — you hold a call here" / "a put here" / "a call and a put here" — folded into the strike
 *  button's own `aria-label` (never a separate accessible name on the decorative badge span
 *  beside it, which has no role that supports one). Empty string when nothing's held. */
function heldAriaSuffix(held: string | undefined): string {
  if (!held) return "";
  const what = held === "C/P" ? "a call and a put" : held === "C" ? "a call" : "a put";
  return ` — you hold ${what} here`;
}

/** The strike cell: a pick button (or plain text, no `onPick`) plus the held-position badge slot
 *  (#3407, Eric 2026-09-22) — a REAL holding at this strike, distinct from `.straddle-marked`'s
 *  draft-leg outline on the whole cell. */
function StrikeCell({
  strike,
  selected,
  held,
  showHeldSlot,
  onPick,
}: {
  readonly strike: number;
  readonly selected: boolean;
  /** "C" / "P" / "C/P" when the desk holds a contract at this strike (this expiration). */
  readonly held?: string;
  /** True whenever the caller passed `heldBadges` at all — reserves the badge's column space on
   *  EVERY row (held or not) so a badge appearing on one row never shifts the column for its
   *  neighbors. False for a caller that never passes `heldBadges` (no layout change from before
   *  this feature). */
  readonly showHeldSlot: boolean;
  readonly onPick?: (strike: number) => void;
}): ReactElement {
  return (
    <td className="straddle-strike num">
      {onPick ? (
        <button
          type="button"
          className="straddle-pick"
          aria-label={`Pick the ${strike} strike${heldAriaSuffix(held)}`}
          aria-pressed={selected}
        >
          {strike}
        </button>
      ) : (
        strike
      )}
      {showHeldSlot ? (
        <span
          className={held ? "straddle-held-badge" : "straddle-held-badge straddle-held-empty"}
          aria-hidden="true"
        >
          {held ?? ""}
        </span>
      ) : null}
    </td>
  );
}

/** One formatting path per stat kind (#2017 Phase 1 slice 14) — a count (OI/volume) prints
 *  comma-grouped, a greek prints to two decimal places; either prints "—" when the feed didn't
 *  report it, never a fabricated `0`/`0.00`. */
function formatStat(value: number | undefined, kind: "count" | "greek"): string {
  if (value === undefined) return "—";
  return kind === "count" ? value.toLocaleString() : value.toFixed(2);
}

/** A scroll-out stat cell (OI/Vol/greeks) — plain and never clickable, unlike `SideCell`: only
 *  Bid/Ask/Strike are presets. */
function StatCell({
  value,
  kind,
}: {
  readonly value: number | undefined;
  readonly kind: "count" | "greek";
}): ReactElement {
  return <td className="straddle-stat num">{formatStat(value, kind)}</td>;
}

/** A premium the feed quoted, or "—" — never a confident 0.00 nobody measured. Plain when
 *  `onPickSide` isn't wired up (unchanged from before task 4e); a clickable button when it is —
 *  even over a "—", since the contract exists in the chain regardless of whether a live quote
 *  came back for it. */
function SideCell({
  row,
  side,
  price,
  onPickSide,
}: {
  readonly row: StraddleRow;
  readonly side: "call" | "put";
  readonly price: "bid" | "ask";
  readonly onPickSide?: PickSide;
}): ReactElement {
  const value = row[side]?.[price];
  const text = value === undefined ? "—" : money(value);
  if (!onPickSide) return <td className="num">{text}</td>;
  return (
    <td className="num">
      <button
        type="button"
        className="straddle-cell-pick"
        aria-label={`Pick the ${row.strike} ${side} ${price}`}
        onClick={(event) => {
          // Nested inside the row's own onClick (the strike-only pick) — stop it from also firing,
          // so a cell click fires only the more specific side pick (review fix, 2026-09-08).
          event.stopPropagation();
          onPickSide(row.strike, side, { price, ...(value !== undefined ? { value } : {}) });
        }}
      >
        {text}
      </button>
    </td>
  );
}
