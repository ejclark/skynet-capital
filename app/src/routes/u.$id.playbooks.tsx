import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { fetchDesk } from "../live/desk";
import { setWheels } from "../live/options";
import {
  type DelegationGateView,
  fetchPlaybookStore,
  type PlaybookMode,
  type PlaybookStoreCardView,
  setSubscriptionEnabledRequest,
  subscribeRequest,
  unsubscribeRequest,
} from "../live/playbook-store";
import { DeskRail } from "../shell/desk-rail";
import { PageFrame } from "../shell/frame";

/**
 * THE PLAYBOOK STORE (issue #885) — the account-level surface an account subscribes house
 * playbooks from, each with its own delegated capital. Lives on the desk view, not Trade's rail
 * (settled fork, #885 comments): the trading account IS the capital assigned to a playbook, so
 * the surface that assigns it belongs where the account itself lives.
 *
 * Same subscribe mechanism for a bot account or a human account — a bot subscribing automates
 * its own trading; a human subscribing is the on-ramp from manual to automated trading on their
 * own capital. No cross-account visibility: `canManage` (from the server) is the only signal a
 * viewer gets about whether this is their own desk — a stranger's Playbook Store shows the
 * catalog with no subscribe controls and no capital figures.
 *
 * THE DELEGATION FOG (#1707) — with training wheels on and rung 102 unearned, the subscribe
 * control renders VISIBLE and DISABLED, naming the rung that opens it (`docs/FOG-OF-WAR.md`).
 * Everything a member needs to judge a playbook — what it does, when it enters, both exits, how
 * to leave — stays fully readable; only the delegation itself waits. Rendering only: the server
 * refuses a locked subscribe regardless of whether this door is ever bypassed, and unsubscribe,
 * pause, and resume are never gated on either side.
 */

function SubscribeForm({
  deskId,
  playbookId,
  onSubscribed,
}: {
  readonly deskId: string;
  readonly playbookId: string;
  readonly onSubscribed: () => void;
}): ReactElement {
  const [mode, setMode] = useState<PlaybookMode>("standard");
  const [capital, setCapital] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const modeId = useId();
  const capitalId = useId();
  const capitalAllocated = Number(capital);
  const valid = capital.trim() !== "" && Number.isFinite(capitalAllocated) && capitalAllocated >= 0;

  const subscribe = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await subscribeRequest({ id: deskId, playbookId, mode, capitalAllocated });
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
 * The door, drawn: the same Subscribe button, disabled, under the server's own sentence naming the
 * rung — plus the one action that lifts every gate, exactly as the ladder's own locked panel does
 * (`shell/locked-panel.tsx`; `docs/FOG-OF-WAR.md` criterion 8, until #1671 settles it).
 */
function SubscribeLocked({
  gate,
  onLifted,
}: {
  readonly gate: DelegationGateView;
  readonly onLifted: () => void;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  const off = async () => {
    setBusy(true);
    try {
      await setWheels(false);
      onLifted();
    } finally {
      setBusy(false);
    }
  };
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
        <button type="button" className="btn mc-btn" disabled={busy} onClick={() => void off()}>
          {busy ? "…" : "Turn the wheels off"}
        </button>
      </div>
    </div>
  );
}

function SubscriptionRow({
  deskId,
  card,
  onChanged,
}: {
  readonly deskId: string;
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
        id: deskId,
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
      const answer = await unsubscribeRequest({ id: deskId, playbookId: card.id });
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

function PlaybookCard({
  deskId,
  card,
  canManage,
  delegation,
  onChanged,
}: {
  readonly deskId: string;
  readonly card: PlaybookStoreCardView;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  readonly onChanged: () => void;
}): ReactElement {
  return (
    <section className="pb-card">
      <h2 className="pb-card-h">
        {card.id} <span className="num">{card.symbol}</span>
      </h2>
      <p className="pb-card-description">{card.description}</p>
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
      {canManage ? (
        card.subscription ? (
          // An existing subscription keeps every control it had — pausing and leaving are exits.
          <SubscriptionRow deskId={deskId} card={card} onChanged={onChanged} />
        ) : delegation.locked ? (
          <SubscribeLocked gate={delegation} onLifted={onChanged} />
        ) : (
          <SubscribeForm deskId={deskId} playbookId={card.id} onSubscribed={onChanged} />
        )
      ) : null}
    </section>
  );
}

function PlaybookStorePage(): ReactElement {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const store = useQuery({
    queryKey: ["playbook-store", id],
    queryFn: () => fetchPlaybookStore(id),
  });
  const onChanged = () => void queryClient.invalidateQueries({ queryKey: ["playbook-store", id] });

  if (desk.isPending || store.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the Playbook Store…</p>
      </PageFrame>
    );
  if (desk.isError || store.isError)
    return (
      <PageFrame>
        <p className="note">The Playbook Store is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  return (
    <PageFrame rail={<DeskRail id={d.id} name={d.name} kind={d.kind} current="playbooks" />}>
      <header className="page-header">
        <h1>{d.name} — Playbook Store</h1>
        <p>
          Every house playbook, browsable — subscribe this account's own capital to run one, or
          several concurrently as separate experiments. A subscription is always against this
          account's own capital; nothing here ever touches another account's.
        </p>
      </header>
      {store.data.canManage ? (
        <p className="note">
          Capital under management across active subscriptions: $
          {store.data.capitalUnderManagement.toLocaleString()}
        </p>
      ) : (
        <p className="note">
          Viewing the catalog — subscribing is only available on your own desk.
        </p>
      )}
      <div className="pb-deck">
        {store.data.cards.map((card) => (
          <PlaybookCard
            key={card.id}
            deskId={id}
            card={card}
            canManage={store.data.canManage}
            delegation={store.data.delegation}
            onChanged={onChanged}
          />
        ))}
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/playbooks")({ component: PlaybookStorePage });
