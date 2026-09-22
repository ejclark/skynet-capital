import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { type ChainData, fetchChain } from "../live/options";
import { type PickSide, StraddleView } from "./straddle-view";

/**
 * The options ticket's chain, both sides (#1481 slice 1). The ticket already holds one side of
 * the chain for its own pickers; this fetches the OTHER side of the same expiration — only once
 * the first resolved, so a symbol with no chain costs one read, not two — and hands both to the
 * straddle view. Kept out of `OptionGate` so the ticket's own state machine stays readable.
 * @category trading
 */
export function ChainStraddle({
  chainSym,
  optionType,
  chainData,
  strike,
  markedStrikes,
  onPickStrike,
  onPickSide,
  expirationField,
  heldBadges,
  pending,
}: {
  readonly chainSym: string;
  readonly optionType: "call" | "put";
  readonly chainData: ChainData;
  /** The ticket's strike field, as typed — "" until picked. */
  readonly strike: string;
  readonly onPickStrike: (strike: string) => void;
  /** A call/put price cell pick (#2017 Phase 0 task 4e) — threaded straight through to
   *  `StraddleView`, same as `onPickStrike`. */
  readonly onPickSide?: PickSide;
  /** Strikes the multi-leg draft already carries (#3407 P3 slice 2) — threaded through. */
  readonly markedStrikes?: readonly number[];
  /** Threaded straight through to `StraddleView` — see its own doc for why it lives here now. */
  readonly expirationField?: ReactNode;
  /** A REAL, already-filled holding at a strike ("C"/"P"/"C/P") — threaded through to
   *  `StraddleView`; see `option-gate.tsx`'s header comment for where it's computed. */
  readonly heldBadges?: ReadonlyMap<number, string>;
  /** The caller's OWN chain query's `isFetching` (Eric, 2026-09-22) — ORed with this
   *  component's own "other side" fetch below, since either one refetching on an expiration
   *  change is "the table you're looking at is a beat stale," not just one side of it. */
  readonly pending?: boolean;
}): ReactElement {
  const otherType = optionType === "call" ? "put" : "call";
  const other = useQuery({
    queryKey: ["chain", chainSym, otherType, chainData.expiration],
    queryFn: () => fetchChain(chainSym, otherType, chainData.expiration),
    // Same reason as `option-gate.tsx`'s own chain query: without this, the OTHER side's columns
    // (Puts, on a Calls-primary ticket) go blank for a beat on every expiration switch even
    // though this component's job is specifically to keep both sides showing real numbers.
    placeholderData: keepPreviousData,
  });
  const otherRows = other.data && !("chainNote" in other.data) ? other.data.rows : [];
  return (
    <StraddleView
      symbol={chainData.symbol}
      expiration={chainData.expiration}
      spot={chainData.spot}
      calls={optionType === "call" ? chainData.rows : otherRows}
      puts={optionType === "put" ? chainData.rows : otherRows}
      selectedStrike={strike === "" ? undefined : Number(strike)}
      markedStrikes={markedStrikes}
      onPickStrike={(value) => onPickStrike(String(value))}
      onPickSide={onPickSide}
      quotes={chainData.quotes}
      expirationField={expirationField}
      heldBadges={heldBadges}
      pending={pending || other.isFetching}
    />
  );
}
