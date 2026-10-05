import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  configureRequest,
  type PlaybookMode,
  type PlaybookStoreCardView,
  type SubscriptionView,
  type SubscriptionWriteResult,
  subscribeRequest,
} from "../live/playbook-store";

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
 */

/** Toggle chips for the symbols filter. None picked = the whole basket, said in words. */
function SymbolAim({
  basket,
  picked,
  onToggle,
}: {
  readonly basket: readonly string[];
  readonly picked: readonly string[];
  readonly onToggle: (symbol: string) => void;
}): ReactElement {
  return (
    <fieldset className="pb-symbols">
      <legend>Symbols — new entries only</legend>
      <div className="pb-symbols-chips">
        {basket.map((symbol) => (
          <button
            key={symbol}
            type="button"
            className="railctl num"
            aria-pressed={picked.includes(symbol)}
            onClick={() => onToggle(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
      <p className="pb-symbols-hint">
        {picked.length === 0
          ? `None picked: it may open positions in all ${basket.length}.`
          : `Opens new positions only in ${picked.join(", ")}.`}{" "}
        Exits still manage anything it already holds.
      </p>
    </fieldset>
  );
}

export function SubscribeForm({
  accountId,
  card,
  editing,
  onSaved,
  onCancel,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  /** The subscription being edited. Absent = a new subscription. */
  readonly editing?: SubscriptionView;
  readonly onSaved: () => void;
  readonly onCancel?: () => void;
}): ReactElement {
  const [mode, setMode] = useState<PlaybookMode>(editing?.mode ?? "standard");
  const [capital, setCapital] = useState(
    editing?.capitalAllocated === undefined ? "" : String(editing.capitalAllocated),
  );
  // "Uncapped" is offered only to keep a subscription that already is (#4535's seeded roster).
  // A member's own budget is always a number, the same rule subscribe has always had.
  const offerUncapped = editing !== undefined && editing.capitalAllocated === undefined;
  const [uncapped, setUncapped] = useState(offerUncapped);
  const [picked, setPicked] = useState<readonly string[]>(editing?.symbols ?? []);
  const [compoundAllocation, setCompoundAllocation] = useState(
    editing?.compoundAllocation === true,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const modeId = useId();
  const capitalId = useId();
  const uncappedId = useId();
  const compoundId = useId();
  const capitalAllocated = Number(capital);
  const valid =
    uncapped ||
    (capital.trim() !== "" && Number.isFinite(capitalAllocated) && capitalAllocated >= 0);
  // Basket order, whatever order they were tapped in.
  const symbols = card.symbols.filter((s) => picked.includes(s));
  const toggle = (symbol: string) =>
    setPicked((now) => (now.includes(symbol) ? now.filter((s) => s !== symbol) : [...now, symbol]));

  const send = (): Promise<SubscriptionWriteResult> =>
    editing
      ? configureRequest({
          id: accountId,
          playbookId: card.id,
          mode,
          capitalAllocated: uncapped ? null : capitalAllocated,
          symbols,
          compoundAllocation,
        })
      : subscribeRequest({
          id: accountId,
          playbookId: card.id,
          mode,
          capitalAllocated,
          ...(symbols.length > 0 ? { symbols } : {}),
          ...(compoundAllocation ? { compoundAllocation: true } : {}),
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

  const label = editing ? (busy ? "Saving…" : "Save changes") : busy ? "Subscribing…" : "Subscribe";
  return (
    <div className="pb-subscribe-form">
      <div className="field">
        <label htmlFor={modeId}>Mode</label>
        <select id={modeId} value={mode} onChange={(e) => setMode(e.target.value as PlaybookMode)}>
          <option value="conservative">Conservative</option>
          <option value="standard">Standard</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>
      {offerUncapped ? (
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
      {uncapped ? null : (
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
      {card.symbols.length > 1 ? (
        <SymbolAim basket={card.symbols} picked={symbols} onToggle={toggle} />
      ) : null}
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
        {onCancel ? (
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <span className="set-err">{error}</span> : null}
    </div>
  );
}
