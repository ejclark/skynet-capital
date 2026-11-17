import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { sharesHeld } from "../live/quantity";
import type { TicketFields } from "../live/ticket";

/**
 * Two lines the share ticket (`trade-gate.tsx`) says out loud instead of leaving the member to
 * guess: what Review is waiting for, and how many shares a Sell ticket can sell.
 */

/** What Review is waiting for, in words — undefined once the ticket can be reviewed. A title attribute
 *  would say it only on hover, and a phone has none. */
export function reviewMissing(
  fields: Pick<TicketFields, "symbol" | "quantity">,
): string | undefined {
  const missing = [
    fields.symbol.trim() === "" ? "a symbol" : "",
    fields.quantity === "" ? "the number of shares" : "",
  ].filter(Boolean);
  return missing.length ? `Enter ${missing.join(" and ")} to review.` : undefined;
}

/** "You hold 130 shares of NVDA" on a Sell ticket, with a control that fills the count (it never
 *  submits — Review still comes first). Nothing when the account holds none, or holds it short. The
 *  account's positions are the `["desk", deskId]` read every other pane shares. */
export function HeldShares({
  deskId,
  symbol,
  onSellAll,
}: {
  readonly deskId: string;
  /** The committed symbol, the one the quote header shows. */
  readonly symbol: string;
  readonly onSellAll: (quantity: string) => void;
}): ReactElement | null {
  const desk = useQuery({
    queryKey: ["desk", deskId],
    queryFn: () => fetchDesk(deskId),
    enabled: deskId !== "" && symbol !== "",
  });
  const shares = symbol ? sharesHeld(desk.data?.desk.positions ?? [], symbol) : 0;
  if (shares <= 0) return null;
  const count = shares.toLocaleString("en-US");
  return (
    <p className="gate-held">
      <span>
        You hold {count} {shares === 1 ? "share" : "shares"} of {symbol}
      </span>
      <button type="button" className="btn gate-held-all" onClick={() => onSellAll(String(shares))}>
        Sell all {count}
      </button>
    </p>
  );
}
