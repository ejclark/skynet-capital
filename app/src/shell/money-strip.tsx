import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { DeskAllocation } from "../live/desk";
import { fetchOptionPositions, type OptionBookGreeks } from "../live/options";
import { GlossaryTerm } from "./glossary-term";

/**
 * WHERE YOUR MONEY IS (#3689 slice 5, design handoff 3a): one panel, three cells.
 *  1. The split: shares, options, and cash as a stacked bar, each slice also named with its amount.
 *  2. Cash ready to use, linking to the plays that fit your playbooks (this replaces the old
 *     "dry powder" note).
 *  3. The book's two greeks that matter most to a beginner, in plain words with the Greek one hover
 *     away: time decay (theta, $/day) and market exposure (delta, in shares).
 *
 * The greeks come from `/api/trade/option-positions` (the same netted book the Trade page's option
 * card shows); the shares' own delta (one per share) comes from the desk's allocation. When the
 * feed quoted only part of the book, the figure says so. It never passes off a partial sum as the
 * whole book (`greeks-aggregator.ts`).
 */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "−$100/day", or "none" with no options, or "—" when the book couldn't be read. */
export function decayLine(book: OptionBookGreeks | undefined, hasOptions: boolean): string {
  if (!hasOptions) return "none";
  if (!book || book.covered === 0) return "—";
  const perDay = book.theta;
  const text = `${perDay < 0 ? "−" : "+"}${money.format(Math.abs(perDay))}/day`;
  return book.covered < book.total ? `${text} (${book.covered} of ${book.total} quoted)` : text;
}

/** "≈ 3,424 shares": the stocks held plus the options' share-equivalent delta. */
export function exposureLine(
  shareCount: number,
  book: OptionBookGreeks | undefined,
  hasOptions: boolean,
): string {
  if (hasOptions && (!book || book.covered === 0)) return "—";
  const total = shareCount + (hasOptions && book ? book.delta : 0);
  const partial = hasOptions && book && book.covered < book.total;
  return `≈ ${count.format(total)} shares${partial ? " (partial)" : ""}`;
}

function Slice({
  pct,
  kind,
}: {
  readonly pct: number;
  readonly kind: string;
}): ReactElement | null {
  if (pct <= 0) return null;
  return <span className={`money-slice money-slice--${kind}`} style={{ flexGrow: pct }} />;
}

export function MoneyStrip({
  accountId,
  allocation,
  hasOptions,
}: {
  readonly accountId: string;
  readonly allocation: DeskAllocation;
  readonly hasOptions: boolean;
}): ReactElement {
  const statement = useQuery({
    queryKey: ["option-positions", accountId],
    queryFn: () => fetchOptionPositions(accountId),
    enabled: hasOptions,
    staleTime: 30_000,
  });
  const book = statement.data?.available ? statement.data.book : undefined;
  const decay = decayLine(book, hasOptions);
  const exposure = exposureLine(allocation.shareCount, book, hasOptions);

  return (
    <section className="money-strip" aria-label="Where your money is">
      <div className="money-cell">
        <span className="money-eyebrow">Where your money is</span>
        <div className="money-bar" aria-hidden="true">
          <Slice pct={allocation.sharesPct} kind="shares" />
          <Slice pct={allocation.optionsPct} kind="options" />
          <Slice pct={allocation.cashPct} kind="cash" />
        </div>
        <ul className="money-legend">
          <li>
            <span className="money-swatch money-slice--shares" /> Shares{" "}
            <b className="num">{allocation.shares}</b>
          </li>
          <li>
            <span className="money-swatch money-slice--options" /> Options{" "}
            <b className="num">{allocation.options}</b>
          </li>
          <li>
            <span className="money-swatch money-slice--cash" /> Cash{" "}
            <b className="num">{allocation.cash}</b>
          </li>
        </ul>
      </div>
      <div className="money-cell">
        <span className="money-eyebrow">Cash ready to use</span>
        <span className="money-cash num">{allocation.cash}</span>
        <span className="money-note">{allocation.cashShare} of your account</span>
        <Link to="/playbooks" className="money-link">
          See plays that fit your playbooks ↗
        </Link>
      </div>
      <div className="money-cell money-greeks">
        <div className="money-greek">
          <span className="money-greek-label">
            <GlossaryTerm term="timeDecay" />
          </span>
          <b className="num">{decay}</b>
          <span className="money-note">what your options lose each day if prices don't move</span>
        </div>
        <div className="money-greek">
          <span className="money-greek-label">
            <GlossaryTerm term="marketExposure" />
          </span>
          <b className="num">{exposure}</b>
          <span className="money-note">if every stock you hold rises $1, you gain about this</span>
        </div>
      </div>
    </section>
  );
}
