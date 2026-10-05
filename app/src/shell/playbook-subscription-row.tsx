import type { ReactElement } from "react";
import { useState } from "react";
import {
  type PlaybookStoreCardView,
  type SubscriptionView,
  type SubscriptionWriteResult,
  setSubscriptionEnabledRequest,
  unsubscribeRequest,
} from "../live/playbook-store";
import { SubscribeForm } from "./playbook-subscribe-form";

/**
 * An owned account's subscription to one playbook, drawn FIRST on its card (#4649). This follows
 * #4642's phone order: on or paused · mode · capital · symbols · Pause and Edit, then the rules.
 * An owner who opens a bot's playbooks is asking "what is it running?", so the answer leads.
 *
 * The state is a glyph AND a word: ● On, ○ Paused, ◌ Saved, never trades. Never hue alone, because
 * a standing reader is red/green colourblind.
 *
 * A human account's subscription saved before #4610 is listed honestly. It never traded, because
 * the runner reads bot subscriptions only, and it says so. It keeps Pause and Unsubscribe, since
 * leaving is never gated, but it has no Edit: tuning is delegation, and only bots take that for now.
 */

/** The words after the state, in the phone order: mode · capital · symbols · compounding. */
function subscriptionFacts(
  sub: SubscriptionView,
  basket: readonly string[],
  human: boolean,
): string[] {
  const symbols = sub.symbols?.length
    ? [`new entries: ${sub.symbols.join(", ")}`]
    : basket.length > 1
      ? [`all ${basket.length} symbols`]
      : [];
  return [
    sub.mode,
    sub.capitalAllocated === undefined ? "uncapped" : `$${sub.capitalAllocated.toLocaleString()}`,
    ...symbols,
    ...(sub.compoundAllocation ? ["compounding"] : []),
    // A human subscription's state word is "never trades", so its pause has to be said here.
    ...(human && !sub.enabled ? ["paused"] : []),
  ];
}

function stateOf(sub: SubscriptionView, human: boolean) {
  if (human) return { glyph: "◌", word: "Saved, never trades", key: "idle" };
  return sub.enabled
    ? { glyph: "●", word: "On", key: "on" }
    : { glyph: "○", word: "Paused", key: "paused" };
}

export function SubscriptionRow({
  accountId,
  card,
  human,
  reduceOnly,
  onChanged,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  /** The account is a human account (#4610): listed, leavable, never tunable. */
  readonly human: boolean;
  /** The viewer's delegation fog is down: Edit still opens, but only to LOWER exposure — the
   *  server refuses an edit that delegates more, exactly as it refuses a subscribe. */
  readonly reduceOnly: boolean;
  readonly onChanged: () => void;
}): ReactElement | null {
  const sub = card.subscription;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  if (!sub) return null;

  const write = async (request: () => Promise<SubscriptionWriteResult>) => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await request();
      if (answer.ok) onChanged();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  const ref = { id: accountId, playbookId: card.id };
  const state = stateOf(sub, human);

  return (
    <div className="pb-subscription" data-state={state.key}>
      <p className="pb-status">
        <b className="pb-status-state">
          <span aria-hidden="true">{state.glyph}</span> {state.word}
        </b>
        {subscriptionFacts(sub, card.symbols, human).map((fact) => (
          <span key={fact}> · {fact}</span>
        ))}
      </p>
      {editing ? (
        <SubscribeForm
          accountId={accountId}
          card={card}
          editing={sub}
          reduceOnly={reduceOnly}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="pb-subscription-actions">
          <button
            type="button"
            className="btn mc-btn"
            disabled={busy}
            onClick={() =>
              void write(() => setSubscriptionEnabledRequest({ ...ref, enabled: !sub.enabled }))
            }
          >
            {busy ? "Saving…" : sub.enabled ? "Pause" : "Resume"}
          </button>
          {human ? null : (
            <button
              type="button"
              className="btn mc-btn"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="btn mc-btn mc-danger"
            disabled={busy}
            onClick={() => void write(() => unsubscribeRequest(ref))}
          >
            Unsubscribe
          </button>
        </div>
      )}
      {error ? <span className="set-err">{error}</span> : null}
    </div>
  );
}
