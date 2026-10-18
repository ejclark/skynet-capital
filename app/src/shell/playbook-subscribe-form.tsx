import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  configureRequest,
  type PlaybookMode,
  type PlaybookStoreCardView,
  type PreflightAnswer,
  preflightRequest,
  type SubscriptionView,
  type SubscriptionWriteResult,
  subscribeRequest,
} from "../live/playbook-store";
import { defaultCheckOn, initialCapital } from "../live/subscribe-defaults";
import { FilterChip, InlineResult } from "../ui";
import { ConvictionFields, convictionOf } from "./playbook-conviction";

/**
 * THE PLAYBOOK STORE's one form (#885), for both writes: a new subscription posts to subscribe,
 * and Edit on an existing one (#4649) opens it pre-filled and posts to configure. Configure never
 * changes whether the subscription runs, so a paused one stays paused, and the form says so.
 *
 * Symbols are chips drawn from the card's own basket, never free text. The filter can only narrow
 * a playbook, because the guard refuses an entry outside it (`clampBuy`, entry side only). So a
 * typed ticker could save a subscription that never opens anything. The chips appear only when
 * the basket has more than one symbol. The copy says the filter limits new entries only: exits
 * still manage whatever the playbook already holds.
 *
 * A pair the study does not back, on a strategy that runs on conviction (`needsConviction`, #4469
 * slice 3c part 3b), asks for the owner's reason and check day first and will not save without them
 * (criterion 2). The row's own call stays above the form, so the study's word is read before the
 * owner's overrides it.
 *
 * A NEW subscription also offers "Check first" (#4469 slice 3b part 2): it asks the server what
 * Subscribe would say at this mode and budget — the live price, the options level, a liquid chain —
 * and for an options pair states what one contract ties up and how much of the budget that leaves
 * idle. Said in words with a glyph, written nowhere, and discarded the moment the mode or budget
 * changes, because an answer to a different question is worse than none.
 */

const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** The preflight in words: what a clear pair costs, or the server's own sentence for a refusal. */
export function preflightLine(answer: PreflightAnswer): { glyph: string; text: string } {
  if (!answer.ok) return { glyph: "–", text: answer.error };
  if (answer.oneContractCash !== undefined) {
    const idle = Math.round((answer.idleShare ?? 0) * 100);
    return {
      glyph: "✓",
      text: `Clear. One contract ties up about ${dollars(answer.oneContractCash)}, which leaves ${
        idle > 0 ? `${idle}% of this budget idle` : "none of this budget idle"
      }.`,
    };
  }
  return answer.options
    ? {
        glyph: "✓",
        text: "Clear so far. What one contract ties up is priced from a live chain while the market is open, and checked again when you subscribe.",
      }
    : { glyph: "✓", text: "Clear: the feed has a price and the account can take it." };
}

/** What the chips mean right now, in words. A playbook that sends no order scans names; every
 *  other one opens positions in them. */
function symbolsHint(
  basket: readonly string[],
  picked: readonly string[],
  scanOnly: boolean,
): string {
  const none = picked.length === 0;
  if (scanOnly) {
    const aim = none
      ? `None picked: it scans all ${basket.length}.`
      : `Scans only ${picked.join(", ")}.`;
    return `${aim} It places no orders, so no money is at risk. A change lands on its next check.`;
  }
  const aim = none
    ? `None picked: it may open positions in all ${basket.length}.`
    : `Opens new positions only in ${picked.join(", ")}.`;
  return `${aim} Exits still manage anything it already holds.`;
}

/** Toggle chips for the symbols filter. None picked = the whole basket, said in words. */
function SymbolAim({
  basket,
  picked,
  scanOnly = false,
  onToggle,
}: {
  readonly basket: readonly string[];
  readonly picked: readonly string[];
  /** A playbook that sends no order reads names; it has no entries or exits to speak of. */
  readonly scanOnly?: boolean;
  readonly onToggle: (symbol: string) => void;
}): ReactElement {
  return (
    <fieldset className="pb-symbols">
      <legend>{scanOnly ? "Names to scan" : "Symbols — new entries only"}</legend>
      <div className="pb-symbols-chips">
        {basket.map((symbol) => (
          <FilterChip
            key={symbol}
            className="num"
            pressed={picked.includes(symbol)}
            onPress={() => onToggle(symbol)}
          >
            {symbol}
          </FilterChip>
        ))}
      </div>
      <p className="pb-symbols-hint">{symbolsHint(basket, picked, scanOnly)}</p>
    </fieldset>
  );
}

export function SubscribeForm({
  accountId,
  card,
  editing,
  reduceOnly = false,
  needsConviction = false,
  onSaved,
  onCancel,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  /** The subscription being edited. Absent = a new subscription. */
  readonly editing?: SubscriptionView;
  /** Behind the delegation fog: an edit may only lower exposure (the server enforces it). */
  readonly reduceOnly?: boolean;
  /** The pair's study does not back it: a new subscription must state a conviction. */
  readonly needsConviction?: boolean;
  readonly onSaved: () => void;
  readonly onCancel?: () => void;
}): ReactElement {
  const [mode, setMode] = useState<PlaybookMode>(editing?.mode ?? "standard");
  // A new subscription opens filled in (`subscribe-defaults.ts`); an edit opens on what it has.
  const [capital, setCapital] = useState(initialCapital(editing));
  // "Uncapped" is offered only to keep a subscription that already is (#4535's seeded roster).
  // A member's own budget is always a number, the same rule subscribe has always had.
  const offerUncapped = editing !== undefined && editing.capitalAllocated === undefined;
  const [uncapped, setUncapped] = useState(offerUncapped);
  const [picked, setPicked] = useState<readonly string[]>(editing?.symbols ?? []);
  const [compoundAllocation, setCompoundAllocation] = useState(
    editing?.compoundAllocation === true,
  );
  const [reason, setReason] = useState("");
  const [checkOn, setCheckOn] = useState(() => defaultCheckOn());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // The preflight answer is keyed on the question it answered; a changed mode or budget hides it.
  const [checked, setChecked] = useState<
    { readonly key: string; readonly answer: PreflightAnswer } | undefined
  >();
  const [checking, setChecking] = useState(false);
  const modeId = useId();
  const capitalId = useId();
  const uncappedId = useId();
  const compoundId = useId();
  const capitalAllocated = Number(capital);
  // A playbook that sends no order has no budget, mode or compounding to ask for (#4535 slice 3a).
  const noCapital = card.movesNoCapital === true;
  const basket = card.pickFrom ?? card.symbols;
  // An edit never asks: the owner's conviction is stated and re-dated on the row (`ConvictionPanel`).
  const asksConviction = needsConviction && !editing;
  const conviction = asksConviction ? convictionOf(reason, checkOn) : undefined;
  const valid =
    (noCapital ||
      uncapped ||
      (capital.trim() !== "" && Number.isFinite(capitalAllocated) && capitalAllocated >= 0)) &&
    (!asksConviction || conviction !== undefined);
  // Basket order, whatever order they were tapped in.
  const symbols = basket.filter((s) => picked.includes(s));
  // A saved filter naming symbols the basket no longer holds (an API subscribe, a retired ticker)
  // cannot be drawn as chips. Say so rather than let a save quietly widen it to the whole basket.
  const stale = (editing?.symbols ?? []).filter((s) => !basket.includes(s));
  const toggle = (symbol: string) =>
    setPicked((now) => (now.includes(symbol) ? now.filter((s) => s !== symbol) : [...now, symbol]));

  const send = (): Promise<SubscriptionWriteResult> =>
    editing
      ? configureRequest({
          id: accountId,
          playbookId: card.id,
          mode,
          capitalAllocated: noCapital || uncapped ? null : capitalAllocated,
          symbols,
          compoundAllocation,
        })
      : subscribeRequest({
          id: accountId,
          playbookId: card.id,
          mode,
          ...(noCapital ? {} : { capitalAllocated }),
          ...(symbols.length > 0 ? { symbols } : {}),
          ...(compoundAllocation ? { compoundAllocation: true } : {}),
          ...(conviction ? { conviction } : {}),
        });

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await send();
      if (answer.ok) onSaved();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const question = `${mode}|${capital}|${conviction ? "conviction" : ""}`;
  const check = async () => {
    setChecking(true);
    setError(undefined);
    try {
      const answer = await preflightRequest({
        id: accountId,
        playbookId: card.id,
        mode,
        capitalAllocated,
        ...(conviction ? { conviction: true } : {}),
      });
      setChecked({ key: question, answer });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setChecking(false);
    }
  };
  const verdict = checked?.key === question ? preflightLine(checked.answer) : undefined;

  const label = editing ? (busy ? "Saving…" : "Save changes") : busy ? "Subscribing…" : "Subscribe";
  return (
    <div className="pb-subscribe-form">
      {asksConviction ? (
        <>
          <p className="pb-form-note">
            The study does not back this one. It runs only as your own conviction, against that
            study.
          </p>
          <ConvictionFields
            reason={reason}
            checkOn={checkOn}
            onReason={setReason}
            onCheckOn={setCheckOn}
          />
        </>
      ) : null}
      {noCapital ? (
        <p className="pb-form-note">
          It places no orders, so there is no budget, mode or compounding to set. It reads the names
          below and records simulated probes.
        </p>
      ) : (
        <div className="field">
          <label htmlFor={modeId}>Mode</label>
          <select
            id={modeId}
            value={mode}
            onChange={(e) => setMode(e.target.value as PlaybookMode)}
          >
            <option value="conservative">Conservative</option>
            <option value="standard">Standard</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      )}
      {offerUncapped && !noCapital ? (
        <div className="field field-checkbox">
          <input
            id={uncappedId}
            type="checkbox"
            checked={uncapped}
            onChange={(e) => setUncapped(e.target.checked)}
          />
          <label htmlFor={uncappedId}>
            Uncapped — sized by cash and the position cap, as the house roster always was.
          </label>
        </div>
      ) : null}
      {uncapped || noCapital ? null : (
        <div className="field">
          <label htmlFor={capitalId}>Capital to delegate ($)</label>
          <input
            id={capitalId}
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </div>
      )}
      {basket.length > 1 ? (
        <SymbolAim basket={basket} picked={symbols} scanOnly={noCapital} onToggle={toggle} />
      ) : null}
      {noCapital ? null : (
        <div className="field field-checkbox">
          <input
            id={compoundId}
            type="checkbox"
            checked={compoundAllocation}
            onChange={(e) => setCompoundAllocation(e.target.checked)}
          />
          <label htmlFor={compoundId}>
            Compound gains/losses into allocation — a profitable run grows this budget, a losing one
            shrinks it. Off by default.
          </label>
        </div>
      )}
      {stale.length > 0 ? (
        <p className="pb-form-note">
          Its saved filter names {stale.join(", ")}, which {stale.length === 1 ? "isn't" : "aren't"}{" "}
          in this playbook's symbols.{" "}
          {symbols.length === 0
            ? `Saving with nothing picked lets new entries open in all ${basket.length}.`
            : "Saving keeps only the symbols picked above."}
        </p>
      ) : null}
      {reduceOnly ? (
        <p className="pb-form-note">
          Until you unlock delegation, an edit can only lower what this bot may do: less capital,
          fewer symbols, a calmer mode, or compounding off.
        </p>
      ) : null}
      {editing && !editing.enabled ? <p className="pb-form-note">Saving keeps it paused.</p> : null}
      <div className="pb-subscription-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !valid}
          onClick={() => void save()}
        >
          {label}
        </button>
        {editing || noCapital ? null : (
          <button
            type="button"
            className="btn mc-btn"
            disabled={busy || checking || !valid || uncapped}
            onClick={() => void check()}
          >
            {checking ? "Checking…" : "Check first"}
          </button>
        )}
        {onCancel ? (
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      {verdict ? (
        <p className="pb-form-note pb-preflight" data-clear={verdict.glyph === "✓" || undefined}>
          <span aria-hidden="true">{verdict.glyph}</span> {verdict.text}
        </p>
      ) : null}
      {error ? (
        <InlineResult as="span" tone="err">
          {error}
        </InlineResult>
      ) : null}
    </div>
  );
}
