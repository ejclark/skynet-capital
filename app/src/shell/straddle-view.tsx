import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type { ChainRow } from "../live/options";
import {
  daysToExpiry,
  dividerIndex,
  expiresIn,
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
 * that's safe) — this component only reports which strike and which side got clicked. Cells with
 * no quoted value are still clickable — the contract exists in the chain regardless of whether a
 * live quote came back for it. Omitting `onPickSide` renders cells exactly as before (plain,
 * non-interactive), for any caller that doesn't wire this up.
 * @category trading
 */
export function StraddleView({
  symbol,
  expiration,
  spot,
  calls,
  puts,
  selectedStrike,
  onPickStrike,
  onPickSide,
  now = new Date(),
}: {
  readonly symbol: string;
  readonly expiration: string;
  readonly spot?: number;
  readonly calls: readonly ChainRow[];
  readonly puts: readonly ChainRow[];
  readonly selectedStrike?: number;
  readonly onPickStrike?: (strike: number) => void;
  /** A call/put price cell pick (task 4e) — fires with the row's strike and which side was
   *  clicked. Optional: omitted, cells render as plain, non-interactive text (unchanged). */
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
  readonly now?: Date;
}): ReactElement {
  const [showAll, setShowAll] = useState(false);
  const all = mergeStraddle(calls, puts);
  const { rows, hidden } = showAll ? { rows: all, hidden: 0 } : windowRows(all, spot);
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
      <div className="straddle-head">
        <span className="straddle-eyebrow">
          Chain · {symbol} · {expiration}
        </span>
        <span className="straddle-dte">{expiresIn(daysToExpiry(expiration, now))}</span>
      </div>
      <EarningsBadge symbol={symbol} now={now} />
      <div className="straddle-scroll" ref={scrollRef}>
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
        </button>
      ) : null}
    </section>
  );
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
  onPick,
  onPickSide,
}: {
  readonly row: StraddleRow;
  readonly spot?: number;
  readonly divider: boolean;
  readonly selected: boolean;
  readonly onPick?: (strike: number) => void;
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
}): ReactElement {
  const callItm = inTheMoney(row.strike, spot, "call");
  const putItm = inTheMoney(row.strike, spot, "put");
  const cls = [
    "straddle-row",
    callItm ? "straddle-call-itm" : "",
    putItm ? "straddle-put-itm" : "",
    selected ? "straddle-selected" : "",
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
        <SideCell value={row.call?.bid} strike={row.strike} side="call" onPickSide={onPickSide} />
        <SideCell value={row.call?.ask} strike={row.strike} side="call" onPickSide={onPickSide} />
        <td className="straddle-strike num">
          {onPick ? (
            <button
              type="button"
              className="straddle-pick"
              aria-label={`Pick the ${row.strike} strike`}
              aria-pressed={selected}
            >
              {row.strike}
            </button>
          ) : (
            row.strike
          )}
        </td>
        <SideCell value={row.put?.bid} strike={row.strike} side="put" onPickSide={onPickSide} />
        <SideCell value={row.put?.ask} strike={row.strike} side="put" onPickSide={onPickSide} />
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
  value,
  strike,
  side,
  onPickSide,
}: {
  readonly value: number | undefined;
  readonly strike: number;
  readonly side: "call" | "put";
  readonly onPickSide?: (strike: number, side: "call" | "put") => void;
}): ReactElement {
  const text = value === undefined ? "—" : money(value);
  if (!onPickSide) return <td className="num">{text}</td>;
  return (
    <td className="num">
      <button
        type="button"
        className="straddle-cell-pick"
        aria-label={`Pick the ${strike} ${side}`}
        onClick={(event) => {
          // Nested inside the row's own onClick (the strike-only pick) — stop it from also firing,
          // so a cell click fires only the more specific side pick (review fix, 2026-09-08).
          event.stopPropagation();
          onPickSide(strike, side);
        }}
      >
        {text}
      </button>
    </td>
  );
}
