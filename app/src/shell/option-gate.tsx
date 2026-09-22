import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { fetchDesk } from "../live/desk";
import { useOrderFill } from "../live/desk-events";
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
import { RecentOrdersStrip } from "./recent-orders-strip";
import { SymbolField } from "./symbol-field";
import { TimeInForceField } from "./tif-field";

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
 * member reads it before it decides anything, instead of after the fields it fills. It is an
 * ORDINARY block-level sibling between the two `.gate-fields` grids, never a grid item itself
 * (review fix, 2026-09-08): a spanning grid cell inherited the grid's own min-content overflow
 * from `.exp-tabs`'s non-wrapping tab strip and clipped off the phone frame edge
 * (`docs/shots/chain-above-fields/`) — sitting outside the grid entirely sidesteps that instead of
 * patching around it. Every chain cell is clickable (strike, call, and put), and a call/put cell
 * can do more than a strike cell: picking one fills the strike (as always) and, when it's safe,
 * ALSO switches the ticket's Side/Type to match — the target rung is `playForNav({
 * ...navForPlay(play.code), optionType: clickedSide })`, mirroring `ticket-nav.tsx`'s own preset
 * arithmetic. Two things a chain click can change (strike, and — only when unlocked — Side/Type)
 * and one it never can: a locked rung. A not-found target counts as locked too (review fix — a
 * lookup miss used to fall through to `undefined`, which is falsy, i.e. fail OPEN; the check now
 * defaults to locked, `?? true`, so the one job this rule has — never open a door the ladder
 * hasn't — holds even on a target this component can't identify). A locked-target click still
 * fills strike and surfaces a `.tkt-note` saying why the ticket didn't switch (`ticket-nav.tsx`'s
 * own rule: "Locked = visible, disabled, explained… never hidden, never silently dead"). Switching
 * rungs remounts this whole component (`trade.tsx` keys `OptionGate` on `info.code`), so the
 * clicked strike is committed to `?strike=` FIRST (`onStrikeCommit`) and re-seeds through
 * `initialStrike` on the fresh mount, surviving the remount the same way `?symbol=`/
 * `initialSymbol`/`onSymbolCommit` already do — but the two no longer commit on quite the same
 * cadence (review fix): a strike change that STICKS now reaches `onStrikeCommit`, not just a
 * rung-switching pick — a same-rung chain click commits too (immediately, it's a one-shot click),
 * and so does a hand-typed strike, though throttled to blur, the same way `SymbolField` throttles
 * its own typed commits (see `StrikeField`'s `onCommit`), so typing doesn't fire a `navigate()` on
 * every keystroke. A LOCKED-target click is the one pick that still doesn't commit — the rung
 * didn't change, and the strike shown against it is provisional (the note says as much), so `?strike=`
 * stays whatever it already was. Known gap, out of scope for this pass: a rung switch doesn't
 * re-seed the limit price from the new rung's own chain — only the strike survives the remount.
 *
 * HELD POSITIONS ON THE CHAIN (Eric, 2026-09-22): a "C"/"P" badge next to a strike marks a
 * contract the desk already holds at that strike, on the same underlying and expiration this
 * chain shows — the chain table's own `markedStrikes` outline is a different concept (a DRAFT
 * leg not yet submitted, multi-leg only); this is a REAL, filled holding, sourced from the same
 * `["desk", deskId]` query `trade.tsx` already fetches (cache-shared, no extra round trip) and
 * decomposed via `parseOccSymbol`. A successful submit here invalidates that query so a just-
 * filled strike picks up its badge without a reload.
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
  /** Fires on every strike change that STICKS (review fix — not just a rung-switching chain pick),
   *  so the route can keep `?strike=` honest: a same-rung or rung-switching chain-cell click calls
   *  it immediately, a hand-typed strike calls it on blur (see `StrikeField`'s `onCommit`). A
   *  locked-target click does NOT call it — the rung stays put, so the strike shown against it is
   *  provisional, not a real change of ticket state. When a click IS switching rungs, this fires
   *  before `onPreset` remounts this component, so the fresh mount finds the strike already in the
   *  URL. */
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
  /** Day unless picked (#3407 P1 slice 4) — the server previews the default it will send. */
  const [timeInForce, setTimeInForce] = useState<"day" | "gtc" | undefined>();
  const [state, setState] = useState<OptionGateState>({ step: "draft" });
  /** A locked-target chain-cell click fills strike but can't switch rungs (safety-critical, see the
   *  header comment) — this is the visible explanation the house rule requires ("Locked = visible,
   *  disabled, explained… never hidden, never silently dead", `ticket-nav.tsx`). Cleared on every
   *  other edit path via `edit()` below, so it disappears the moment the member does anything else. */
  const [lockedPickNote, setLockedPickNote] = useState<string | undefined>();
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

  const queryClient = useQueryClient();
  /** Same `["desk", deskId]` key `trade.tsx` already fetches with — react-query dedupes, so this
   *  is a cache read in practice, not a second round trip (#3407, review — the held-position
   *  badges below). */
  const desk = useQuery({
    queryKey: ["desk", deskId],
    queryFn: () => fetchDesk(deskId),
    // Gated on a committed symbol, same as the chain query above — nothing to badge before then,
    // and this keeps a fresh, symbol-less mount from firing a fetch nobody asked for yet.
    enabled: deskId !== "" && chainSym !== "",
  });
  /** Which strikes in THIS chain (same underlying, same expiration) the desk already holds a
   *  contract on, and which side — "C", "P", or "C/P" for a strangle on the same strike. Scoped to
   *  the resolved chain's own expiration: a held position on a different expiration never matches
   *  a row this table can even show. Reflects only real, filled holdings (never a draft in
   *  progress) — `submit`'s own `["desk", deskId]` invalidation below is what makes a JUST-filled
   *  position appear here without a reload (Eric, 2026-09-22). */
  const heldBadges = new Map<number, string>();
  if (chainData) {
    const underlying = (chainSym || symbol).trim().toUpperCase();
    for (const position of desk.data?.desk.positions ?? []) {
      if (!position.isOption) continue;
      const parts = parseOccSymbol(position.symbol);
      if (!parts || parts.underlying !== underlying || parts.expiration !== chainData.expiration) {
        continue;
      }
      const letter = parts.type === "call" ? "C" : "P";
      const existing = heldBadges.get(parts.strike);
      heldBadges.set(parts.strike, existing && existing !== letter ? "C/P" : letter);
    }
  }

  /** Withhold state (#2017 Phase 0 task 4d): idle → nothing, loading → a note, stopped → a note
   *  (genuine dead end), otherwise (resolved chain, or a degraded/unrecognized answer) → fields. */
  const symbolCommitted = chainSym !== "";
  const chainSettled = chain.data !== undefined;
  const stopped = symbolCommitted && chainSettled && chainReason === "no-options";
  const showFields = symbolCommitted && chainSettled && !stopped;
  const showLoading = symbolCommitted && !chainSettled;

  /** Any edit disarms a standing review — straight back to draft — and clears a standing
   *  locked-pick note (review fix): the note explains one specific click, and any other edit means
   *  the member has moved on from it. */
  const edit = <T,>(set: (v: T) => void) => {
    return (value: T) => {
      set(value);
      setLockedPickNote(undefined);
      setState((s) => (s.step === "reviewed" || s.step === "done" ? { step: "draft" } : s));
    };
  };

  /** Picking a chain strike also seeds the limit premium from the quoted mid — still editable. */
  const pickStrike = (value: string) => {
    edit(setStrike)(value);
    const row = chainData?.rows.find((r) => String(r.strike) === value);
    if (row?.premium !== undefined) setLimitPrice(String(row.premium));
  };

  /** A one-shot chain pick (a table row or cell click, never a keystroke) — sets the strike and
   *  commits it to `?strike=` immediately. The manual `StrikeField` input goes through `pickStrike`
   *  directly instead (see its `onEdit` wiring below) and commits separately, on blur — see the
   *  header comment's note on why the two commit on different cadences. */
  const pickStrikeAndCommit = (value: string) => {
    pickStrike(value);
    onStrikeCommit?.(value);
  };

  /** A call/put chain cell pick (task 4e) — the resolution rule, already decided (see the header
   *  comment): the target rung keeps this ticket's current instrument/side and only flips
   *  `optionType` to the clicked side. Same rung → fill strike and commit it (no rung switch, so no
   *  remount, but `?strike=` still needs to reflect the pick). A different, UNLOCKED rung → commit
   *  the strike to `?strike=` first, then preset the rung (order matters: `onPreset` remounts this
   *  component, so the fresh mount has to find the strike already in the URL). A different, LOCKED
   *  rung — or a target this component can't find in `plays` at all, which fails SAFE (locked), not
   *  open — fills strike LOCALLY only, same as before this pass (no `onStrikeCommit`, no
   *  `onPreset`), but now also surfaces a `.tkt-note` explaining why the ticket stayed put, so the
   *  click is never silently dead. With no `plays`/`onPreset` wired up at all, this degrades to the
   *  same-rung behavior (fill and commit) for every click. */
  const onChainCellPick = (clickedStrike: number, side: "call" | "put") => {
    setLockedPickNote(undefined);
    const value = String(clickedStrike);
    if (!(plays && onPreset)) {
      pickStrikeAndCommit(value);
      return;
    }
    const target = playForNav({ ...navForPlay(play.code), optionType: side });
    if (target === play.code) {
      pickStrikeAndCommit(value);
      return;
    }
    // Safety-critical, fail SAFE: a target this component can't find in `plays` is treated as
    // locked, not unlocked — a lookup miss must never read as "go ahead".
    const targetLocked = plays.find((p) => p.code === target)?.locked ?? true;
    if (targetLocked) {
      // Never widen a locked rung from a chain click. Fill strike only — no onStrikeCommit, no
      // onPreset — but explain why (visible, disabled, explained — never silently dead).
      pickStrike(value);
      setLockedPickNote(`Strike filled — the ${side} side isn't unlocked yet.`);
      return;
    }
    onStrikeCommit?.(value);
    onPreset(target);
  };

  /** A strike that arrived before the chain (`?strike=` on mount, or typed ahead of the fetch)
   *  never went through `pickStrike`'s seeding, so the limit stayed empty and the ticket refused
   *  itself (#3407 P0). Seed once the chain resolves, only while the field is still empty — a
   *  member's own premium is never overwritten. */
  const seedRow = chainData?.rows.find((r) => String(r.strike) === strike);
  const seedPremium = seedRow?.premium;
  // biome-ignore lint/correctness/useExhaustiveDependencies: orderType/limitPrice read at fire time on purpose — seeding is one-shot per resolved strike
  useEffect(() => {
    if (seedPremium !== undefined && orderType === "limit" && limitPrice === "") {
      setLimitPrice(String(seedPremium));
    }
  }, [seedPremium, strike]);

  /** The currently-selected CONTRACT's real OCC symbol (task 3a) — sourced from the matched chain
   *  row, never hand-assembled: `buildOccSymbol` exists server-side/in `option-symbols.ts` for
   *  constructing one from partial state, which is more machinery than this slice needs. Empty
   *  until a chain row actually matches the picked strike, so `RecentOrdersStrip` renders nothing
   *  rather than guessing at a malformed symbol mid-pick. */
  const resolvedOccSymbol =
    chainData?.rows.find((r) => String(r.strike) === strike)?.occSymbol ?? "";

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
    ...(timeInForce ? { timeInForce } : {}),
  });

  const review = async () => {
    // The Review button keeps focus on the field under the pointer (`keepFocus`), so a
    // hand-typed strike's blur commit never fires from that click — commit it here instead, the
    // same `?strike=` write the blur would have made.
    if (strike !== "" && strike !== initialStrike) onStrikeCommit?.(strike);
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewOption(draft());
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const fill = useOrderFill(
    deskId,
    state.step === "done" && state.result.ok ? state.result.orderId : undefined,
  );

  const submit = async () => {
    if (state.step !== "reviewed") return;
    setState({ step: "submitting", preview: state.preview });
    try {
      const result = await submitOption(draft());
      setState({ step: "done", result });
      // A filled open changes the desk's holdings — refetch so a just-filled strike picks up its
      // held badge without a reload (the same refresh pattern `OptionPositionsCard`'s own close
      // flow already uses).
      if (result.ok) void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  if (play.locked) return <LockedPanel play={play} />;

  // A limit order with no premium cannot pass its own review (#3407 P0 — the study found the
  // default ticket refused itself: `limit` with an empty price and Review enabled). Withhold
  // Review until the price is there and say why, instead of letting the server say it.
  const limitMissing = orderType === "limit" && limitPrice.trim() === "";
  const drafted = symbol.trim() !== "" && strike !== "" && contracts !== "" && !limitMissing;
  const limitNote =
    limitMissing && symbol.trim() !== "" && strike !== ""
      ? "A limit order needs a premium per share — pick a strike from the chain to seed it from the mid, or type one."
      : undefined;

  // The expiration picker used to sit in the top fields grid, where `.exp-tabs`'s pill strip only
  // had ~150px to work with — room for a date and a half (Eric, 2026-09-21). It now renders where
  // the chain's own "Chain · SYM · date" eyebrow used to (removed below, redundant once a member
  // has just picked the date themselves), full-width above the table — except when there's no
  // chain to attach it to, where it falls back to the fields grid same as before.
  const expirationField = (
    <div className="field">
      <label htmlFor={expId} id={`${expId}-label`}>
        Expiration
      </label>
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
  );

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
        {showFields && !chainData ? expirationField : null}
      </div>
      {/* An ordinary block sibling, NOT a grid item (review fix — see the header comment): a
          full-row grid span inherited the grid's own overflow from `.exp-tabs`'s non-wrapping tab
          strip and clipped off the phone frame. `ChainStraddle`'s own `.straddle-scroll` already
          handles sitting here — it did before this slice moved the chain table up the page too. */}
      {chainData ? (
        <ChainStraddle
          chainSym={chainSym}
          optionType={optionType}
          chainData={chainData}
          strike={strike}
          expirationField={expirationField}
          heldBadges={heldBadges}
          onPickStrike={pickStrikeAndCommit}
          onPickSide={onChainCellPick}
        />
      ) : null}
      {lockedPickNote ? <p className="tkt-note">{lockedPickNote}</p> : null}
      {showFields ? (
        <div className="gate-fields tkt-fields">
          <div className="field">
            <label htmlFor={strikeId}>Strike</label>
            <StrikeField
              id={strikeId}
              chainData={chainData}
              value={strike}
              onEdit={pickStrike}
              onCommit={(v) => onStrikeCommit?.(v)}
            />
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
        </div>
      ) : null}
      {showLoading ? <p className="tkt-note">Looking up options for {chainSym}…</p> : null}
      {chainNote ? <p className="tkt-note">{chainNote}</p> : null}
      <TimeInForceField fallback="day" value={timeInForce} onChange={edit(setTimeInForce)} />
      {limitNote ? <p className="tkt-note">{limitNote}</p> : null}

      {/* The who-else-traded row that used to sit here (`WireRow`, #2017 Phase 1 slice 12) is
          retired (Eric, 2026-09-22): it matched by underlying, not by contract, so "Also trading
          NVDA" mixed in stock fills on a form that's explicitly for options. `RecentOrdersStrip`
          withholds rendering until its own symbol is resolved, so mounting it unconditionally
          here is just about not cluttering this JSX. */}
      <RecentOrdersStrip symbol={resolvedOccSymbol} deskId={deskId} />

      <div className="gate" aria-live="polite">
        <OptionGateStatus state={state} fill={fill} />
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
