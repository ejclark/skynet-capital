import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId } from "react";
import type { DraftLeg, NewLeg } from "../live/draft-order";
import { fetchPlays, type PlayInfo } from "../live/options";
import type { PlayCode } from "../live/plays";
import type { OwnedAccount } from "../live/settings";
import type { ChainPreset } from "./chain-section";
import { DraftOrderBuilder } from "./draft-order-builder";
import { LadderGateCard } from "./ladder-gate";
import { LockedPanel } from "./locked-panel";
import { OptionGate } from "./option-gate";
import { RungChip } from "./rung-chip";
import { TicketNav } from "./ticket-nav";
import { TradeGate } from "./trade-gate";

/** The trade route's ticket pane (split out of `routes/trade.tsx`, which keeps the page, its
 *  search state and `?play=` resolution): one account field plus whichever ticket body the rung
 *  names — gate card, locked panel, multi-leg builder, option ticket or share ticket. */
function AccountField({
  accounts,
  deskId,
  onChange,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly deskId: string;
  readonly onChange: (id: string) => void;
}): ReactElement {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>Account</label>
      <select id={id} value={deskId} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DeskTicket({
  desk,
  code,
  onPreset,
  initialSymbol,
  onSymbolCommit,
  initialStrike,
  onStrikeCommit,
  initialExpiration,
  onExpirationCommit,
  accounts,
  onDeskChange,
  chartSlot,
  incomingLeg,
  onIncomingLegHandled,
  onLegsChange,
  preset,
  onPresetHandled,
  onStage,
  notYours,
}: {
  readonly desk: string;
  readonly code: string;
  /** The name of a `?desk=` the session does not own (#3807 slice 2d, dead end 4) — the ticket
   *  says so in one line at its top instead of switching accounts silently. */
  readonly notYours?: string;
  /** The session's own accounts (`/api/settings`); the picker renders only when there is a choice. */
  readonly accounts: readonly OwnedAccount[];
  readonly onDeskChange: (id: string) => void;
  /** The ticket's own nav and the rail both preset `?play=` through this (#1461); a chain cell
   *  pick that switches side/type (task 4e) presets through the same handler. */
  readonly onPreset: (code: PlayCode) => void;
  /** `?symbol=` — the value a fresh (or remounted) ticket starts from. */
  readonly initialSymbol?: string;
  /** Committing a symbol in either gate writes it back to `?symbol=` (cockpit plan, red-team
   *  finding): both gates remount on every Instrument/Side switch (`key={info.code}` /
   *  `key={code}` below), which used to drop a hand-typed symbol on every switch. */
  readonly onSymbolCommit?: (symbol: string) => void;
  /** `?strike=` (task 4e) — survives a rung-switch remount the same way `initialSymbol`/
   *  `onSymbolCommit` does (a chain cell that switches the ticket to a different rung remounts
   *  `OptionGate`, so the strike it just picked has to come back through route state, same as a
   *  hand-typed symbol already does), but the two don't commit on the same cadence (review fix,
   *  2026-09-08): a chain-cell strike pick against a rung the member CAN reach (the current one, or
   *  an unlocked target it's about to switch to) commits immediately, while a hand-typed strike
   *  commits on blur, throttled the same way `SymbolField` throttles its own typed commits (see
   *  `option-gate.tsx`'s header comment). A locked-target pick fills strike but never commits —
   *  the rung didn't change, so there's nothing new for the URL to say. */
  readonly initialStrike?: string;
  readonly onStrikeCommit?: (strike: string) => void;
  /** `?exp=` (slice 4a) — seeds the options ticket's expiration; changes commit back. */
  readonly initialExpiration?: string;
  readonly onExpirationCommit?: (expiration: string) => void;
  /** Forwarded to `OptionGate` alone (see its own doc comment) — a stock or spread ticket keeps
   *  today's behavior (chart as its own bench pane) unchanged. */
  readonly chartSlot?: ReactElement;
  /** Forwarded to `DraftOrderBuilder` alone (multi-leg) — a leg picked from the standalone Chain
   *  section pane while the Spread ticket is on screen (#3407). */
  readonly incomingLeg?: { readonly leg: NewLeg; readonly key: number };
  readonly onIncomingLegHandled?: () => void;
  readonly onLegsChange?: (legs: readonly DraftLeg[]) => void;
  /** A chain tap's hand-off (#5166, `ChainPreset`) — the option ticket applies it; any other
   *  ticket on the rung it names only shows its note (a locked tap from a stock rung). */
  readonly preset?: ChainPreset;
  readonly onPresetHandled?: () => void;
  readonly onStage?: (preset: Omit<ChainPreset, "key">) => void;
}) {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const info: PlayInfo | undefined = plays.data?.plays.find((p) => p.code === code);
  // 501 has no ticket of its own (#1671) — it's an attribute any option order can carry, looked up
  // independently of `info` so the expiration field can disable today regardless of which rung
  // the ticket is currently on.
  const zeroDte = plays.data?.plays.find((p) => p.code === "501");
  // The feedback gate (#1119): while it holds, every rung that OPENS a position shows the gate card
  // instead of a ticket. A sell (102) is an exit and stays open — the server holds the same line.
  const gate = plays.data?.gate;
  const gated = gate !== undefined && code !== "102";
  /** ONE CARD (Eric, 2026-09-22): Account/Rung/Instrument-Side-Type used to render as loose
   *  siblings ABOVE whichever ticket body followed — now each body renders it itself, inside its
   *  own `.gate-panel`. `headerNoNav` drops the nav for the multi-leg (401) ticket, which has no
   *  Instrument/Side/Type of its own to toggle (`ticket-nav.tsx`'s own doc comment) — showing it
   *  there would offer Stock/Option segments that don't describe a spread at all. */
  const accountField =
    accounts.length > 1 ? (
      <AccountField accounts={accounts} deskId={desk} onChange={onDeskChange} />
    ) : null;
  const rungChip = plays.data ? <RungChip plays={plays.data.plays} code={code} /> : null;
  const headerNoNav = (
    <>
      {notYours ? (
        <p className="note ticket-not-yours">
          Showing your account — {notYours} is not yours to trade
        </p>
      ) : null}
      {accountField}
      {rungChip}
    </>
  );
  // The option ticket shows a hand-off's note inside its own form, where an edit clears it.
  const presetNote =
    preset?.note && preset.play === code && info?.kind !== "option" ? preset.note : undefined;
  const header = (
    <>
      {headerNoNav}
      {presetNote ? <p className="tkt-note">{presetNote}</p> : null}
      {plays.data ? (
        <TicketNav
          plays={plays.data.plays}
          code={code}
          gate={plays.data.gate}
          onPreset={onPreset}
        />
      ) : null}
    </>
  );
  if (gated) return <LadderGateCard header={header} note={gate.note} />;
  if (info && info.kind === "multi-leg") {
    return info.locked ? (
      <LockedPanel header={headerNoNav} play={info} />
    ) : (
      <DraftOrderBuilder
        header={headerNoNav}
        deskId={desk}
        initialSymbol={initialSymbol}
        initialExpiration={initialExpiration}
        incomingLeg={incomingLeg}
        onIncomingLegHandled={onIncomingLegHandled}
        onLegsChange={onLegsChange}
      />
    );
  }
  if (info && info.kind === "option") {
    return (
      <OptionGate
        key={info.code}
        header={header}
        deskId={desk}
        play={info}
        zeroDte={zeroDte}
        initialSymbol={initialSymbol}
        onSymbolCommit={onSymbolCommit}
        initialStrike={initialStrike}
        onStrikeCommit={onStrikeCommit}
        initialExpiration={initialExpiration}
        onExpirationCommit={onExpirationCommit}
        plays={plays.data?.plays ?? []}
        onPreset={onPreset}
        chartSlot={chartSlot}
        preset={preset}
        onPresetHandled={onPresetHandled}
        onStage={onStage}
      />
    );
  }
  return (
    <TradeGate
      key={code}
      header={header}
      deskId={desk}
      initialAction={code === "102" ? "sell" : "buy"}
      showSide={false}
      play={info}
      initialSymbol={initialSymbol}
      onSymbolCommit={onSymbolCommit}
    />
  );
  // Working orders, Alerts and Option positions moved to the Orders section (#3407, Workbench
  // slice 3) — the account's book is its own pane, one rail tap away.
}
