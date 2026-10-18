import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { outlookQuery } from "../live/outlook";
import { SymbolRecap } from "./symbol-recap";

/**
 * THE RECAP WHEREVER A SYMBOL APPEARS (#4807 slice 4) — fetches the symbol's summary (light, no
 * broker) and draws `SymbolRecap` as is. A position row, the R&D board's symbol view and a playbook
 * ticker row all mount this and nothing else; the card itself is slice 3's. While it loads it holds
 * its place in words; if the read fails it says so plainly rather than drawing a call it never had.
 * `enabled` keeps a closed row from fetching.
 */
export function SymbolRecapFor({
  symbol,
  enabled = true,
}: {
  readonly symbol: string;
  readonly enabled?: boolean;
}): ReactElement | null {
  const outlook = useQuery(outlookQuery(symbol, enabled));
  if (!enabled) return null;
  if (outlook.isPending) return <p className="note recap-loading">Reading {symbol} research…</p>;
  if (outlook.isError || !outlook.data) {
    return <p className="note recap-loading">No research recap for {symbol} right now.</p>;
  }
  return <SymbolRecap outlook={outlook.data} />;
}
