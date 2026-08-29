import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  fetchChain,
  type OptionDraft,
  type OptionPlayCode,
  type PlayInfo,
  reviewOption,
  setWheels,
  submitOption,
} from "../live/options";
import { money } from "../live/ticket";
import { ExpirationField, StrikeField } from "./option-fields";
import { GateAction, type OptionGateState, OptionGateStatus } from "./option-preview";

/**
 * THE OPTIONS TICKET (#738 phase 10b) — the legacy `/trade` option plays in the shell, on the
 * same merge-box state machine as the share gate: any edit disarms a standing review, and the
 * desk re-checks the live account (and re-resolves the CONTRACT) at submit. The chain guides —
 * expirations and strikes come from the member's own connected account — and when it can't
 * (`chainNote`), the ticket still works with manual entry, exactly as the legacy raw mode did:
 * premiums just can't be estimated. A locked rung renders its locked panel and the wheels-off
 * door; the server refuses a locked play regardless of what this component shows.
 */

function LockedPanel({ play }: { readonly play: PlayInfo }): ReactElement {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const off = async () => {
    setBusy(true);
    try {
      await setWheels(false);
      await queryClient.invalidateQueries({ queryKey: ["plays"] });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel gate-panel" aria-label="Locked play">
      <h2 className="panel-title">🔒 {play.name}</h2>
      <p className="panel-sub">
        Course {play.code} · {play.tldr}
      </p>
      <p className="tkt-locked">
        Training wheels are on, and this rung hasn't been unlocked yet
        {play.opensAfter
          ? ` — it opens after your first filled ${play.opensAfter.code} (${play.opensAfter.name})`
          : ""}
        .
      </p>
      <button type="button" className="btn" disabled={busy} onClick={() => void off()}>
        {busy ? "…" : "Turn the wheels off — open the full catalog"}
      </button>
    </section>
  );
}

export function OptionGate({
  deskId,
  play,
}: {
  readonly deskId: string;
  readonly play: PlayInfo;
}): ReactElement {
  const [symbol, setSymbol] = useState("");
  const [chainSym, setChainSym] = useState("");
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState("");
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
      <div className="gate-fields tkt-fields">
        <div className="field">
          <label htmlFor={symId}>Underlying</label>
          <input
            id={symId}
            value={symbol}
            placeholder="NVDA"
            maxLength={12}
            spellCheck={false}
            onChange={(e) => edit(setSymbol)(e.target.value)}
            onBlur={() => setChainSym(symbol.trim().toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") setChainSym(symbol.trim().toUpperCase());
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={expId}>Expiration</label>
          <ExpirationField
            id={expId}
            chainData={chainData}
            value={expiration}
            onEdit={edit(setExpiration)}
          />
        </div>
        <div className="field">
          <label htmlFor={strikeId}>Strike</label>
          <StrikeField id={strikeId} chainData={chainData} value={strike} onEdit={pickStrike} />
        </div>
        <div className="field">
          <label htmlFor={qtyId}>Contracts</label>
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
      {chainNote ? <p className="tkt-note">{chainNote}</p> : null}
      {chainData?.spot !== undefined ? (
        <p className="tkt-note num">
          {chainData.symbol} last {money(chainData.spot)}
        </p>
      ) : null}

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
