import type { ReactElement } from "react";
import {
  type EarningsProximity,
  earningsProximity,
  GLOSS,
  headline,
} from "../../../src/observatory/earnings-chain-badge";

/**
 * THE EARNINGS BADGE (#2017 Phase 1 slice 11) — React port of `earnings-chain-badge.ts`'s
 * `earningsBadge`: the same nearness/headline/tone logic, reused (not re-derived) so the two
 * renderers can never drift apart, rendered as JSX with CSS classes instead of the legacy
 * function's inline `style=` strings — this repo's React components use stylesheets, not inline
 * styles (see `quote-header.tsx`). `TONE` (the legacy inline-style color map) stays unimported
 * here: `.ec-badge-<nearness>` in `straddle.css` carries the same mapping in CSS, so the
 * component never needs the colour VALUE in JS — only `GLOSS` (the copy) and `headline` (the
 * text) are read.
 *
 * ABSENCE IS ABSENT: `symbol` unset/empty, or no print inside any window, both render `null` — no
 * empty/placeholder badge, which would read as a checked, cleared all-clear the calendar table
 * cannot actually promise (the same load-bearing rule the legacy module's own header states).
 * @category trading
 */
export function EarningsBadge({
  symbol,
  now = new Date(),
}: {
  readonly symbol: string | undefined;
  readonly now?: Date;
}): ReactElement | null {
  if (!symbol) return null;
  const asOfIso = now.toISOString();
  const near: EarningsProximity | undefined = earningsProximity(symbol, asOfIso);
  if (!near) return null;
  return (
    <span className={`ec-badge ec-badge-${near.nearness}`} title={near.print.source}>
      <span aria-hidden="true">⚡</span>
      <b>{headline(near)}</b>
      <span className="ec-badge-meta">
        {near.print.date} · {near.print.status}
      </span>
      <span className="ec-badge-gloss">{GLOSS[near.nearness]}</span>
    </span>
  );
}
