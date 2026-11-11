import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  compareSplit,
  type SliceGap,
  SPLIT_SLICES,
  type SplitComparison,
  type TargetSplit,
} from "../../../src/observatory/target-split";
import type { DeskAllocation } from "../live/desk";
import { wholeDollars } from "../live/symbol-book";
import { fetchTargetSplit, targetSplitKey } from "../live/target-split";

/**
 * THE MONEY ROW AGAINST YOUR TARGET SPLIT (#4607 slice 2) — under the split's bar on Overview, the
 * member's own target (set once in Settings → Target split, slice 1) beside where the money is now,
 * and, when a slice has drifted past their tolerance, what to trim and what to add in dollars.
 *
 *  - No target set: one link to set one, and the row is otherwise exactly as it was.
 *  - Not wired (offline, or the read failed): nothing at all — never a link to a form that can't save.
 *  - The book can't be read (the desk came back with an error, or cash is unknown): the target
 *    still shows, every actual and gap reads "—". A gap from part of the book would be a fiction
 *    (`greeks-aggregator.ts`'s rule).
 *
 * Over and under ride an arrow and a verb (▲ trim · ▼ add · ✓ within), never a hue alone — a
 * standing reader is red/green colourblind (docs/BRAND.md → Accessibility). Trim and add are
 * guidance to review, never an order: nothing here places or stages a trade.
 *
 * Only ever rendered on the Accounts Overview, which shows the viewer's own books: a target is the
 * owner's own setting, so another member's profile never draws it (the brief's third open question).
 */

const pct = (n: number): string => `${Math.round(n)}%`;

/** "▲ trim $4,100", "▼ add $3,000", "✓ within" — the arrow and the verb carry it, never a hue. */
export function gapLabel(slice: SliceGap): string {
  if (slice.status === "within") return "✓ within";
  const dollars = wholeDollars(Math.abs(slice.gapDollars));
  return slice.status === "over" ? `▲ trim ${dollars}` : `▼ add ${dollars}`;
}

const joinAnd = (parts: readonly string[]): string =>
  parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;

/**
 * The one sentence: what to trim and what to add to land on the target, in dollars. Every slice
 * with a non-zero gap is named — not only the ones past the tolerance — because only the full set
 * of moves actually lands the book on the target. Said only once a slice is outside the tolerance;
 * inside it, the book is on target and the row says so.
 */
export function rebalanceLine(comparison: SplitComparison, tolerancePct: number): string {
  if (!comparison.outside) {
    return `Every slice is within ${tolerancePct} points of your target ✓`;
  }
  const lower = (s: SliceGap) => s.label.toLowerCase();
  const trims = comparison.slices.filter((s) => s.gapDollars > 0);
  const adds = comparison.slices.filter((s) => s.gapDollars < 0);
  const trimText = joinAnd(trims.map((s) => `${wholeDollars(s.gapDollars)} of ${lower(s)}`));
  // One slice out, one slice in, the same dollars: "trim $4,100 of options and add it to cash".
  const single = trims.length === 1 && adds.length === 1;
  const sameDollars = single && trims[0]?.gapDollars === -(adds[0]?.gapDollars ?? 0);
  const addText =
    single && sameDollars
      ? `it to ${lower(adds[0] as SliceGap)}`
      : joinAnd(adds.map((s) => `${wholeDollars(-s.gapDollars)} to ${lower(s)}`));
  if (trims.length === 0) return `To match your target, add ${addText}.`;
  if (adds.length === 0) return `To match your target, trim ${trimText}.`;
  // A comma once either side is a list, so the two halves don't run together on "and".
  const comma = trims.length > 1 || adds.length > 1 ? "," : "";
  return `To match your target, trim ${trimText}${comma} and add ${addText}.`;
}

function TargetBar({ target }: { readonly target: TargetSplit }): ReactElement {
  return (
    <div className="money-bar money-bar--target" aria-hidden="true">
      {SPLIT_SLICES.map(({ key, kind }) =>
        target[key] > 0 ? (
          <span
            key={key}
            className={`money-slice money-slice--${kind}`}
            style={{ flexGrow: target[key] }}
          />
        ) : null,
      )}
    </div>
  );
}

function Compared({
  target,
  comparison,
}: {
  readonly target: TargetSplit;
  readonly comparison: SplitComparison | undefined;
}): ReactElement {
  return (
    <>
      <ul className="money-target-rows">
        {SPLIT_SLICES.map(({ key, label, kind }) => {
          const slice = comparison?.slices.find((s) => s.key === key);
          return (
            <li
              key={key}
              className={`money-target-row money-target-row--${slice?.status ?? "unread"}`}
            >
              <span className="money-target-name">
                <span className={`money-swatch money-slice--${kind}`} /> {label}
              </span>
              <b className="num">{slice ? pct(slice.actualPct) : "—"}</b>
              <span className="money-target-of num">target {target[key]}%</span>
              <b className="money-target-gap">{slice ? gapLabel(slice) : "—"}</b>
            </li>
          );
        })}
      </ul>
      <p className="money-target-call">
        {comparison
          ? rebalanceLine(comparison, target.tolerancePct)
          : "Your book can't be read right now, so there's no gap to show yet."}
      </p>
    </>
  );
}

export function MoneyTarget({
  allocation,
  bookReadable,
}: {
  readonly allocation: DeskAllocation;
  /** False while the book can't be read whole: the comparison then reads "—" throughout. */
  readonly bookReadable: boolean;
}): ReactElement | null {
  const read = useQuery({
    queryKey: targetSplitKey,
    queryFn: fetchTargetSplit,
    staleTime: 60_000,
    retry: false,
  });
  if (!read.data?.wired) return null;
  const target = read.data.target;
  const settings = (label: string) => (
    <Link to="/settings" search={{ section: "target" as const }} className="money-link">
      {label}
    </Link>
  );
  if (!target) return <div className="money-target">{settings("Set a target split ↗")}</div>;

  const comparison =
    bookReadable && allocation.totalRaw !== undefined
      ? compareSplit({ ...allocation, total: allocation.totalRaw }, target)
      : undefined;
  return (
    <section className="money-target" aria-label="Against your target split">
      <span className="money-target-head">
        Your target split <span className="money-note">· ±{target.tolerancePct} points</span>
      </span>
      <TargetBar target={target} />
      <Compared target={target} comparison={comparison} />
      <span className="money-note">
        Guidance to review on Trade, never an order. {settings("Change target ↗")}
      </span>
    </section>
  );
}
