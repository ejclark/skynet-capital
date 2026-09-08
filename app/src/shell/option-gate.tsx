import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  fetchChain,
  type OptionDraft,
  type OptionPlayCode,
  type PlayInfo,
  reviewOption,
  submitOption,
} from "../live/options";
import { navForPlay, type PlayCode, playForNav } from "../live/plays";
import { ChainStraddle } from "./chain-straddle";
import { LockedPanel } from "./locked-panel";
import { ExpirationField, StrikeField } from "./option-fields";
import { GateAction, type OptionGateState, OptionGateStatus } from "./option-preview";
import { QuoteHeader } from "./quote-header";
import { SymbolField } from "./symbol-field";

/**
 * THE OPTIONS TICKET (#738 phase 10b) — the legacy `/trade` option plays in the shell, on the
 * same merge-box state machine as the share gate: any edit disarms a standing review, and the
 * desk re-checks the live account (and re-resolves the CONTRACT) at submit. The chain guides —
 * expirations and strikes come from the member's own connected account. The five fields below the
 * symbol (Expiration/Strike/Contracts/Order/Limit) are WITHHELD until the chain resolves — no
 * empty, unfillable fields cluttering the first paint (#2017 Phase 0 task 4d). Once a symbol is
 * committed the chain's own answer branches three ways: a genuine dead end (`reason: "no-options"`)
 * stops with just that note, a degraded feed (`"unlinked"`/`"failed"`/unrecognized) falls back to
 * manual entry — same fields as before, plus the explanatory `chainNote` — and a real chain shows
 * the fields driven by live data. A locked rung renders `LockedPanel` (shared with the stock
 * ticket, no self-serve way off the ladder — #1671 decision 1); the server refuses a locked play
 * regardless of what this component shows. Independently, `zeroDte` disables today's expiration
 * while course 501 is locked (#1671 slice 2) — a play can be wide open and still shut out of a
 * same-day expiration.
 *
 * THE CHAIN DRIVES THE FORM (#2017 Phase 0 task 4e, the last of five ticket-hygiene slices): the
 * chain table now renders directly under Expiration, above Strike/Contracts/Order/Limit — where a
 * member reads it before it decides anything, instead of after the fields it fills. Every chain
 * cell is clickable (strike, call, and put), and a call/put cell can do more than a strike cell:
 * picking one fills the strike (as always) and, when it's safe, ALSO switches the ticket's
 * Side/Type to match — the target rung is `playForNav({ ...navForPlay(play.code), optionType:
 * clickedSide })`, mirroring `ticket-nav.tsx`'s own preset arithmetic. Two things a chain click can
 * change (strike, and — only when unlocked — Side/Type) and one it never can: a locked rung. If
 * the target rung is locked for this member, the click fills strike ONLY and never calls
 * `onPreset` — the one non-negotiable rule this slice builds, the same lock `ticket-nav.tsx`
 * already reads (`plays.find((p) => p.code === target)?.locked`), so a chain click can never open
 * a door the ladder hasn't. Switching rungs remounts this whole component (`trade.tsx` keys
 * `OptionGate` on `info.code`), so the clicked strike is committed to `?strike=` FIRST
 * (`onStrikeCommit`) and re-seeds through `initialStrike` on the fresh mount — the same
 * survives-a-remount mechanism `?symbol=`/`initialSymbol`/`onSymbolCommit` already use.
 */

/** @category trading */
export function OptionGate({
  deskId,
  play,
  zeroDte,
  initialSymbol,
  onSymbolCommit,
  initialStrike,
  onStrikeCommit,
  plays,
  onPreset,
}: {
  readonly deskId: string;
  readonly play: PlayInfo;
  /** Course 501's own catalog entry (#1671) — independent of `play`, since a member can have this
   *  rung wide open and still be shut out of a same-day expiration until 501 is earned. Undefined
   *  callers (none today) skip the zero-DTE affordance; the server refuses regardless. */
  readonly zeroDte?: PlayInfo;
  /** `?symbol=` (#2017 cockpit plan) — seeds both the field and the chain fetch on mount, so a
   *  remount (every Instrument/Side switch keys this component fresh) picks the chain back up
   *  immediately instead of waiting for another commit. */
  readonly initialSymbol?: string;
  /** Fires when the symbol field commits, so the route can keep `?symbol=` in sync. */
  readonly onSymbolCommit?: (symbol: string) => void;
  /** `?strike=` (task 4e) — seeds the strike field on mount, so a chain-click rung switch (which
   *  remounts this component) doesn't lose the strike that was just picked. */
  readonly initialStrike?: string;
  /** Fires when a chain click commits a strike ahead of a rung switch, so the route can keep
   *  `?strike=` in sync before `onPreset` remounts this component. */
  readonly onStrikeCommit?: (strike: string) => void;
  /** The full catalog, for the locked-lookup a chain cell pick needs (task 4e) — optional so any
   *  caller that doesn't wire up cell-driven rung switching still degrades safely (see
   *  `onChainCellPick` below). */
  readonly plays?: readonly PlayInfo[];
  /** The same preset handler `TicketNav` already uses to change `?play=` — a chain cell pick calls
   *  it exactly like a nav segment does, only ever for an UNLOCKED target. */
  readonly onPreset?: (code: PlayCode) => void;
}): ReactElement {
  const [symbol, setSymbol] = useState(initialSymbol ?? "");
  const [chainSym, setChainSym] = useState(initialSymbol ?? "");
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState(initialStrike ?? "");
  const [contracts, setContracts] = useState("1");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [limitPrice, setLimitPrice] = useState("");
  const [state, setState] = useState<OptionGateState>({ step: "draft" });
  const symId = useId();
  const expId = useId();
  const strikeId = useId();
  const qtyId = useId();
  const typeId = useId();
  const limitId = useId();

  const optionType = play.optionType ?? "call";
  const chain = useQuery({
    queryKey: ["chain", chainSym, optionType, expiration],
    queryFn: () => fetchChain(chainSym, optionType, expiration || undefined),
    enabled: chainSym !== "",
  });
  const chainData = chain.data && !("chainNote" in chain.data) ? chain.data : undefined;
  const chainNote = chain.data && "chainNote" in chain.data ? chain.data.chainNote : undefined;
  const chainReason = chain.data && "reason" in chain.data ? chain.data.reason : undefined;

  /** Withhold state (#2017 Phase 0 task 4d): idle → nothing, loading → a note, stopped → a note
   *  (genuine dead end), otherwise (resolved chain, or a degraded/unrecognized answer) → fields. */
  const symbolCommitted = chainSym !== "";
  const chainSettled = chain.data !== undefined;
  const stopped = symbolCommitted && chainSettled && chainReason === "no-options";
  const showFields = symbolCommitted && chainSettled && !stopped;
  const showLoading = symbolCommitted && !chainSettled;

  /** Any edit disarms a standing review — straight back to draft. */
  const edit = <T,>(set: (v: T) => void) => {
    return (value: T) => {
      set(value);
      setState((s) => (s.step === "reviewed" || s.step === "done" ? { step: "draft" } : s));
    };
  };

  /** Picking a chain strike also seeds the limit premium from the quoted mid — still editable. */
  const pickStrike = (value: string) => {
    edit(setStrike)(value);
    const row = chainData?.rows.find((r) => String(r.strike) === value);
    if (row?.premium !== undefined) setLimitPrice(String(row.premium));
  };

  /** A call/put chain cell pick (task 4e) — the resolution rule, already decided (see the header
   *  comment): the target rung keeps this ticket's current instrument/side and only flips
   *  `optionType` to the clicked side. Same rung → just fill strike, no route change. A different,
   *  UNLOCKED rung → commit the strike to `?strike=` first, then preset the rung (order matters:
   *  `onPreset` remounts this component, so the fresh mount has to find the strike already in the
   *  URL). A different, LOCKED rung → fill strike ONLY, never `onPreset` — a chain click must never
   *  open a rung the member hasn't earned, no exception. With no `plays`/`onPreset` wired up at
   *  all, this degrades to the same-rung behavior for every click. */
  const onChainCellPick = (clickedStrike: number, side: "call" | "put") => {
    const value = String(clickedStrike);
    if (!(plays && onPreset)) {
      pickStrike(value);
      return;
    }
    const target = playForNav({ ...navForPlay(play.code), optionType: side });
    if (target === play.code) {
      pickStrike(value);
      return;
    }
    const locked = plays.find((p) => p.code === target)?.locked;
    if (locked) {
      // Safety-critical: never widen a locked rung from a chain click. Fill strike only.
      pickStrike(value);
      return;
    }
    onStrikeCommit?.(value);
    onPreset(target);
  };

  const draft = (): OptionDraft => ({
    kind: "open",
    participantId: deskId,
    code: play.code as OptionPlayCode,
    underlying: (chainSym || symbol).trim().toUpperCase(),
    contracts: Number(contracts),
    strike: Number(strike),
    expiration: chainData?.expiration ?? expiration,
    orderType,
    ...(orderType === "limit" && limitPrice !== "" ? { limitPrice: Number(limitPrice) } : {}),
  });

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewOption(draft());
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const submit = async () => {
    if (state.step !== "reviewed") return;
    setState({ step: "submitting", preview: state.preview });
    try {
      setState({ step: "done", result: await submitOption(draft()) });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  if (play.locked) return <LockedPanel play={play} />;

  const drafted = symbol.trim() !== "" && strike !== "" && contracts !== "";
  return (
    <section className="panel gate-panel" aria-label={play.name}>
      <h2 className="panel-title">{play.name}</h2>
      <p className="panel-sub">
        Course {play.code} · {play.gloss}
      </p>
      {/* Duplicates the chain fetch's own spot (StraddleView's "Current price" line, `chain.data.spot`) —
          consolidating the two into one round trip is real scope for the Phase-0 chain-redesign
          slices (#2017 tasks #11-13), not this slice; see docs/IDEAS.md. */}
      <QuoteHeader symbol={chainSym} />
      <div className="gate-fields tkt-fields">
        <SymbolField
          id={symId}
          label="Symbol"
          value={symbol}
          placeholder="NVDA"
          maxLength={12}
          onChange={edit(setSymbol)}
          onCommit={(s) => {
            edit(setSymbol)(s);
            setChainSym(s);
            onSymbolCommit?.(s);
          }}
        />
        {showFields ? (
          <>
            <div className="field">
              <label htmlFor={expId}>Expiration</label>
              <ExpirationField
                id={expId}
                chainData={chainData}
                value={expiration}
                onEdit={edit(setExpiration)}
                zeroDteLocked={Boolean(zeroDte?.locked)}
                zeroDteReason={
                  zeroDte?.opensAfter
                    ? `opens after your first filled ${zeroDte.opensAfter.code} (${zeroDte.opensAfter.name})`
                    : undefined
                }
              />
            </div>
            {chainData ? (
              <div className="gate-fields-span">
                <ChainStraddle
                  chainSym={chainSym}
                  optionType={optionType}
                  chainData={chainData}
                  strike={strike}
                  onPickStrike={pickStrike}
                  onPickSide={onChainCellPick}
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor={strikeId}>Strike</label>
              <StrikeField id={strikeId} chainData={chainData} value={strike} onEdit={pickStrike} />
            </div>
            <div className="field">
              <label htmlFor={qtyId}>Contracts (100 shares)</label>
              <input
                id={qtyId}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={contracts}
                onChange={(e) => edit(setContracts)(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={typeId}>Order</label>
              <select
                id={typeId}
                value={orderType}
                onChange={(e) => edit(setOrderType)(e.target.value as "limit" | "market")}
              >
                <option value="limit">Limit</option>
                <option value="market">Market</option>
              </select>
            </div>
            {orderType === "limit" ? (
              <div className="field">
                <label htmlFor={limitId}>Limit /share</label>
                <input
                  id={limitId}
                  type="number"
                  min={0.01}
                  step={0.01}
                  inputMode="decimal"
                  value={limitPrice}
                  placeholder="2.50"
                  onChange={(e) => edit(setLimitPrice)(e.target.value)}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      {showLoading ? <p className="tkt-note">Looking up options for {chainSym}…</p> : null}
      {chainNote ? <p className="tkt-note">{chainNote}</p> : null}

      <div className="gate" aria-live="polite">
        <OptionGateStatus state={state} />
      </div>

      <GateAction
        state={state}
        drafted={drafted}
        onReview={() => void review()}
        onSubmit={() => void submit()}
        onReset={() => setState({ step: "draft" })}
      />
    </section>
  );
}
