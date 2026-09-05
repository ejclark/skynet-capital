import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { type ChainData, fetchChain } from "../live/options";
import { StraddleView } from "./straddle-view";

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
  onPickStrike,
}: {
  readonly chainSym: string;
  readonly optionType: "call" | "put";
  readonly chainData: ChainData;
  /** The ticket's strike field, as typed — "" until picked. */
  readonly strike: string;
  readonly onPickStrike: (strike: string) => void;
}): ReactElement {
  const otherType = optionType === "call" ? "put" : "call";
  const other = useQuery({
    queryKey: ["chain", chainSym, otherType, chainData.expiration],
    queryFn: () => fetchChain(chainSym, otherType, chainData.expiration),
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
      onPickStrike={(value) => onPickStrike(String(value))}
    />
  );
}
