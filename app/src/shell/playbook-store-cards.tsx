import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  type DelegationGateView,
  type PlaybookMode,
  type PlaybookStoreCardView,
  setSubscriptionEnabledRequest,
  subscribeRequest,
  unsubscribeRequest,
} from "../live/playbook-store";

/**
 * THE PLAYBOOK STORE's cards (issue #885), moved here whole from the retired desk route
 * `/u/$id/playbooks` when the Store became R&D → Playbooks (#3623). One card per house playbook:
 * its rules (Enter / both exits / Hold), then — only when the viewer manages the selected account —
 * the subscription controls. The account is a parameter of the action, never a page of its own.
 *
 * No cross-account visibility: `canManage` (from the server) is the only signal a viewer gets about
 * whether the selected account is theirs — without it the catalog renders with no controls and no
 * capital figures.
 *
 * THE DELEGATION FOG (#1707) — with training wheels on and rung 102 unearned, the subscribe
 * control renders VISIBLE and DISABLED, naming the rung that opens it (`docs/FOG-OF-WAR.md`).
 * Everything a member needs to judge a playbook — what it does, when it enters, both exits, how
 * to leave — stays fully readable; only the delegation itself waits. Rendering only: the server
 * refuses a locked subscribe regardless of whether this door is ever bypassed, and unsubscribe,
 * pause, and resume are never gated on either side.
 */

function SubscribeForm({
  accountId,
  playbookId,
  onSubscribed,
}: {
  readonly accountId: string;
  readonly playbookId: string;
  readonly onSubscribed: () => void;
}): ReactElement {
  const [mode, setMode] = useState<PlaybookMode>("standard");
  const [capital, setCapital] = useState("");
  const [compoundAllocation, setCompoundAllocation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const modeId = useId();
  const capitalId = useId();
  const compoundId = useId();
  const capitalAllocated = Number(capital);
  const valid = capital.trim() !== "" && Number.isFinite(capitalAllocated) && capitalAllocated >= 0;

  const subscribe = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await subscribeRequest({
        id: accountId,
        playbookId,
        mode,
        capitalAllocated,
        ...(compoundAllocation ? { compoundAllocation: true } : {}),
      });
      if (answer.ok) onSubscribed();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

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
      <div className="field">
        <label htmlFor={capitalId}>Capital to delegate ($)</label>
        <input
          id={capitalId}
          type="number"
          min={0}
          step={100}
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />
      </div>
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
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || !valid}
        onClick={() => void subscribe()}
      >
        {busy ? "Subscribing…" : "Subscribe"}
      </button>
      {error ? <span className="set-err">{error}</span> : null}
    </div>
  );
}

/**
 * The door, drawn: the Subscribe button, disabled, under the server's own sentence naming the
 * rung that opens it — exactly as the ladder's own locked panel does (`shell/locked-panel.tsx`).
 * No self-serve way past it (#1671 decision 1, 2026-09-06: "block until earned" taken literally)
 * — this used to also offer "Turn the wheels off," the same one-click bypass `locked-panel.tsx`
 * removed; `POST /api/trade/wheels` now refuses that flip while any rung is unearned regardless.
 */
function SubscribeLocked({ gate }: { readonly gate: DelegationGateView }): ReactElement {
  return (
    <div className="pb-locked">
      <p className="pb-locked-note">◷ {gate.note}</p>
      <div className="pb-subscription-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled
          title={`Opens after your first filled ${gate.unlocksAfter} (${gate.unlocksAfterName})`}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}

function SubscriptionRow({
  accountId,
  card,
  onChanged,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  readonly onChanged: () => void;
}): ReactElement {
  const sub = card.subscription;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  if (!sub) return <></>;

  const toggle = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await setSubscriptionEnabledRequest({
        id: accountId,
        playbookId: card.id,
        enabled: !sub.enabled,
      });
      if (answer.ok) onChanged();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await unsubscribeRequest({ id: accountId, playbookId: card.id });
      if (answer.ok) onChanged();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-subscription">
      <span className="pb-subscription-line">
        Subscribed at <b>{sub.mode}</b>, ${sub.capitalAllocated.toLocaleString()} delegated —
        currently <b>{sub.enabled ? "active" : "paused"}</b>.
        {sub.compoundAllocation ? " Compounding realized gains/losses into allocation." : ""}
      </span>
      <div className="pb-subscription-actions">
        <button type="button" className="btn mc-btn" disabled={busy} onClick={() => void toggle()}>
          {busy ? "Saving…" : sub.enabled ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          className="btn mc-btn mc-danger"
          disabled={busy}
          onClick={() => void unsubscribe()}
        >
          Unsubscribe
        </button>
      </div>
      {error ? <span className="set-err">{error}</span> : null}
    </div>
  );
}

const pct = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

/**
 * The facts the probe derives from the playbook's own code — window, target exposure per mode, and
 * the traits it proved — ported from the retired Plays cards (#3623) so they can never drift from
 * what the playbook does. A tactical playbook has no window, so it shows none rather than a false
 * "0%, no window" row; its rules are the Enter / Exit / Hold copy below.
 */
function PlaybookFacts({ card }: { readonly card: PlaybookStoreCardView }): ReactElement | null {
  if (!(card.window && card.size) && card.traits.length === 0) return null;
  return (
    <>
      {card.window && card.size ? (
        <dl className="pb-card-facts">
          <div>
            <dt>Window</dt>
            <dd className="num">{card.window}</dd>
          </div>
          <div>
            <dt>Target exposure</dt>
            <dd className="num">
              {pct(card.size.conservative)} · {pct(card.size.standard)} ·{" "}
              {pct(card.size.aggressive)}
            </dd>
            <dd className="pb-card-modes">
              conservative · standard · aggressive, before risk guards
            </dd>
          </div>
        </dl>
      ) : null}
      {card.traits.length > 0 ? (
        <ul className="pb-card-traits">
          {card.traits.map((trait) => (
            <li key={trait.id} title={trait.claim}>
              {trait.label}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function PlaybookCard({
  accountId,
  card,
  canManage,
  delegation,
  onChanged,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  readonly onChanged: () => void;
}): ReactElement {
  return (
    <section className="pb-card">
      <h2 className="pb-card-h">
        <span className="pb-card-id">{card.id}</span>{" "}
        <span className="num pb-card-symbols">{card.symbols.join(" · ")}</span>
      </h2>
      <p className="pb-card-description">{card.description}</p>
      <PlaybookFacts card={card} />
      <dl className="pb-card-triggers">
        <dt>Enter</dt>
        <dd>{card.enter}</dd>
        <dt>Exit — take profit</dt>
        <dd>{card.exitTakeProfit}</dd>
        <dt>Exit — cut losses</dt>
        <dd>{card.exitCutLosses}</dd>
        <dt>Hold</dt>
        <dd>{card.hold}</dd>
      </dl>
      <footer className="pb-card-evidence">
        <span className="num">{card.evidence}</span>
        {card.evidenceHref ? <a href={card.evidenceHref}>the study behind it →</a> : null}
      </footer>
      {canManage ? (
        card.subscription ? (
          // An existing subscription keeps every control it had — pausing and leaving are exits.
          <SubscriptionRow accountId={accountId} card={card} onChanged={onChanged} />
        ) : delegation.locked ? (
          <SubscribeLocked gate={delegation} />
        ) : (
          <SubscribeForm accountId={accountId} playbookId={card.id} onSubscribed={onChanged} />
        )
      ) : null}
    </section>
  );
}
