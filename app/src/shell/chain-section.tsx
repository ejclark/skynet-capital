import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useState } from "react";
import type { NewLeg } from "../live/draft-order";
import { fetchChain, type PlayInfo } from "../live/options";
import { navForPlay, type PlayCode, playForNav } from "../live/plays";
import { ChainStraddle } from "./chain-straddle";
import { ExpirationField } from "./option-fields";
import { QuoteHeader } from "./quote-header";
import type { PickedCell } from "./straddle-view";

/**
 * THE CHAIN SECTION (#3407, Workbench slice 2) — the options chain as its own pane on `/trade`,
 * the second tool of the bench (`frame.tsx`: a BENCH is several sections that are one
 * instrument's tools and feed each other). It reads the symbol the ticket committed (`?symbol=`)
 * and the side the current play implies, and a tap on a bid or ask PRESETS the ticket through the
 * URL — strike, the option rung for that side, back to the Ticket section — under the same
 * fail-safe rule the ticket's own inline chain uses (`option-gate.tsx`'s `onChainCellPick`): a
 * locked target rung never widens from a chain click; the strike still travels, the rung stays.
 * #1481 "the chain is the entry instrument" holds; this gives the chain room the ticket can't.
 *
 * Expiration is this pane's own state, as it is the ticket's: a chain is browsed one expiry at a
 * time, and the URL carries the pick that matters (the strike), not the browsing position. Below
 * the bench width this is one exclusive section; docked (slice 4) it sits beside the ticket.
 * @category trading
 */

export interface ChainPick {
  readonly strike: string;
  readonly side: "call" | "put";
  /** The expiration the tapped row belongs to — the contract is not named without it. */
  readonly expiration: string;
  /** Which price cell was tapped, and its value — present only for a bid/ask pick (`onPickSide`
   *  below), never a bare strike-cell pick (`onPickStrike`). This is what `chainPickLeg` needs to
   *  turn a pick into a leg: a bid/ask carries an unambiguous buy/sell and a limit; a strike alone
   *  doesn't. */
  readonly cell?: PickedCell;
}

/** The rung a chain tap presets from the current play — the ticket's own resolution rule: keep
 *  the side, flip the option type to the tapped column; a stock play lands on the long side. A
 *  target this component can't find in `plays` reads as LOCKED (fail safe), and a locked target
 *  presets nothing — the strike still travels, the rung stays. */
export function chainPickTarget(
  currentPlay: string,
  side: "call" | "put",
  plays: readonly Pick<PlayInfo, "code" | "locked">[] | undefined,
): { readonly play: PlayCode | undefined; readonly locked: boolean } {
  const nav = navForPlay(currentPlay);
  const target = playForNav({
    instrument: "option",
    side: nav.instrument === "option" ? nav.side : "buy",
    optionType: side,
  });
  if (target === currentPlay) return { play: undefined, locked: false };
  const locked = plays?.find((p) => p.code === target)?.locked ?? true;
  return locked ? { play: undefined, locked: true } : { play: target, locked: false };
}

/** Whether a chain pick should become a LEG on the Spread builder instead of a rung preset
 *  (#3407 — "the chain pane adds legs on the Spread rung," banked as `next-slice` once Workbench
 *  slice 2 shipped this pane browse-only). `chainPickTarget`'s rung-preset math doesn't apply to a
 *  spread — a multi-leg ticket has no single "side" to flip to — so this is its own rule: only a
 *  bid/ask pick (never a bare strike tap, which carries no buy/sell) turns into a leg, priced at
 *  the tapped cell, on the ticket's own committed underlying (the standalone Chain section never
 *  has a second symbol to ask for — it reads the same `?symbol=` the ticket does). `undefined`
 *  means "not a leg pick" — the caller falls back to its own handling (a rung preset, or nothing,
 *  for a bare strike tap on the Spread rung — see `trade.tsx`'s `onChainPick`). */
export function chainPickLeg(play: string, symbol: string, pick: ChainPick): NewLeg | undefined {
  if (navForPlay(play).instrument !== "spread") return undefined;
  if (!pick.cell || symbol === "") return undefined;
  return {
    underlying: symbol,
    optionType: pick.side,
    strike: Number(pick.strike),
    expiration: pick.expiration,
    action: pick.cell.price === "bid" ? "sell" : "buy",
    contracts: 1,
    ...(pick.cell.value !== undefined ? { limitPrice: pick.cell.value } : {}),
  };
}

export function ChainSection({
  symbol,
  play,
  strike,
  plays,
  initialExpiration,
  onExpirationChange,
  onPick,
  markedStrikes,
}: {
  /** The committed `?symbol=`; "" until the ticket has one. */
  readonly symbol: string;
  readonly play: string;
  /** The committed `?strike=`, marked on the chain when present. */
  readonly strike: string;
  readonly plays: readonly PlayInfo[] | undefined;
  /** `?exp=` — the expiration the ticket (or a shared link) is on; "" lets the server pick. */
  readonly initialExpiration?: string;
  /** A browse to another expiry writes it back to `?exp=`, so the ticket follows (slice 4a). */
  readonly onExpirationChange?: (expiration: string) => void;
  readonly onPick: (pick: ChainPick) => void;
  /** Strikes the Spread draft already carries a leg on (same convention as `DraftLegForm`'s own
   *  inline chain) — outlined here too, so a member who tapped a leg from THIS pane can see it
   *  stuck before switching to the ticket to review. Undefined off the Spread rung. */
  readonly markedStrikes?: readonly number[];
}): ReactElement {
  const expId = useId();
  const [expiration, setExpiration] = useState(initialExpiration ?? "");
  // Docked beside the ticket (slice 4b) this pane stays mounted while the ticket's own field
  // writes `?exp=`; follow it. A browse this pane reported comes back equal — a no-op.
  useEffect(() => {
    if (initialExpiration !== undefined) setExpiration(initialExpiration);
  }, [initialExpiration]);
  const nav = navForPlay(play);
  const optionType = nav.instrument === "option" ? nav.optionType : "call";
  const chain = useQuery({
    queryKey: ["chain", symbol, optionType, expiration],
    queryFn: () => fetchChain(symbol, optionType, expiration || undefined),
    enabled: symbol !== "",
    placeholderData: keepPreviousData,
  });
  if (symbol === "") {
    return <p className="note">Pick a symbol on the Ticket to browse its options chain.</p>;
  }
  if (chain.isPending) return <p className="note">Loading the {symbol} chain…</p>;
  if (chain.isError) return <p className="note">The chain for {symbol} is unreachable.</p>;
  const answer = chain.data;
  if ("chainNote" in answer) return <p className="note">{answer.chainNote}</p>;
  const zeroDte = plays?.find((p) => p.code === "501");
  const expirationField = (
    <div className="field">
      <label htmlFor={expId} id={`${expId}-label`}>
        Expiration
      </label>
      <ExpirationField
        id={expId}
        chainData={answer}
        value={expiration}
        onEdit={(value) => {
          setExpiration(value);
          onExpirationChange?.(value);
        }}
        zeroDteLocked={Boolean(zeroDte?.locked)}
        zeroDteReason={
          zeroDte?.opensAfter
            ? `opens after your first filled ${zeroDte.opensAfter.code} (${zeroDte.opensAfter.name})`
            : undefined
        }
      />
    </div>
  );
  return (
    <section className="chain-section" aria-label={`${symbol} options chain`}>
      <QuoteHeader
        symbol={symbol}
        provided={
          chain.data && "chainNote" in chain.data ? undefined : (answer?.quote ?? "pending")
        }
      />
      <ChainStraddle
        chainSym={symbol}
        optionType={optionType}
        chainData={answer}
        strike={strike}
        markedStrikes={markedStrikes}
        expirationField={expirationField}
        pending={chain.isFetching}
        onPickStrike={(value) =>
          onPick({ strike: value, side: optionType, expiration: answer.expiration })
        }
        onPickSide={(value, side, cell) =>
          onPick({ strike: String(value), side, expiration: answer.expiration, cell })
        }
      />
      <p className="note">
        {nav.instrument === "spread"
          ? "Tap a bid to sell that contract, an ask to buy it — it's added as a leg to your spread."
          : "Tap a bid to sell it or an ask to buy it — the ticket opens preset with that contract."}
      </p>
    </section>
  );
}
