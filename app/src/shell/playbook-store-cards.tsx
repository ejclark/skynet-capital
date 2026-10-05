import type { ReactElement } from "react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PlaybookStoreCardView,
} from "../live/playbook-store";
import {
  AccountPlaybookMetrics,
  HousePlaybookMetrics,
  type MetricsScope,
} from "./playbook-metrics";
import { SubscribeForm } from "./playbook-subscribe-form";
import { SubscriptionRow } from "./playbook-subscription-row";

/**
 * THE PLAYBOOK STORE's cards (issue #885), moved here whole from the retired desk route
 * `/u/$id/playbooks` when the Store became R&D → Playbooks (#3623). One card per house playbook.
 * The account is a parameter of the action, never a page of its own.
 *
 * Two orders, by what the owner came to do (#4649, mobile-first):
 *  - A card the selected account is SUBSCRIBED to leads with that subscription: state, mode,
 *    capital, symbols, with Pause, Edit and Unsubscribe beside it. The rules, evidence and metrics
 *    follow (`playbook-subscription-row.tsx`).
 *  - A card it is not subscribed to reads first and acts last: rules, evidence, metrics, then the
 *    Subscribe form or the door that holds it.
 *
 * No cross-account visibility: `canManage` (from the server) is the only signal a viewer gets about
 * whether the selected account is theirs — without it the catalog renders with no controls and no
 * capital figures.
 *
 * TWO DOORS can hold a new subscription, checked in the server's order:
 *  - Bots only for now (#4610): on a human account the Subscribe control is drawn disabled under
 *    `BOTS_ONLY_NOTE`. That is not a fog, because nothing earnable opens it (`docs/FOG-OF-WAR.md`),
 *    so it names no rung.
 *  - The delegation fog (#1707): with training wheels on and rung 102 unearned, the control is
 *    drawn disabled under the sentence naming the rung that opens it.
 * Everything a member needs to judge a playbook (what it does, when it enters, both exits, how to
 * leave) stays readable behind either door. Rendering only: the server refuses a held subscribe
 * regardless, and unsubscribe, pause and resume are never gated on either side.
 */

/**
 * A door, drawn: the Subscribe button, disabled, under the server's own sentence — exactly as the
 * ladder's own locked panel does (`shell/locked-panel.tsx`). No self-serve way past it (#1671
 * decision 1, 2026-09-06: "block until earned" taken literally) — this used to also offer "Turn
 * the wheels off," the same one-click bypass `locked-panel.tsx` removed; `POST /api/trade/wheels`
 * now refuses that flip while any rung is unearned regardless.
 */
function SubscribeDoor({
  glyph,
  note,
  title,
}: {
  readonly glyph: string;
  readonly note: string;
  readonly title: string;
}): ReactElement {
  return (
    <div className="pb-locked">
      <p className="pb-locked-note">
        <span aria-hidden="true">{glyph}</span> {note}
      </p>
      <div className="pb-subscription-actions">
        <button type="button" className="btn btn-primary" disabled title={title}>
          Subscribe
        </button>
      </div>
    </div>
  );
}

/** What sits at the end of a card the selected account is not subscribed to. */
function NewSubscription({
  accountId,
  card,
  delegation,
  botsOnly,
  onChanged,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  readonly delegation: DelegationGateView;
  readonly botsOnly?: BotsOnlyGateView;
  readonly onChanged: () => void;
}): ReactElement {
  if (botsOnly?.locked) {
    return (
      <SubscribeDoor glyph="◌" note={botsOnly.note} title="Only bot accounts subscribe for now" />
    );
  }
  if (delegation.locked) {
    return (
      <SubscribeDoor
        glyph="◷"
        note={delegation.note}
        title={`Opens after your first filled ${delegation.unlocksAfter} (${delegation.unlocksAfterName})`}
      />
    );
  }
  return <SubscribeForm accountId={accountId} card={card} onSaved={onChanged} />;
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

/**
 * "No active subscribers yet" · "1 active subscriber" · "3 active subscribers" — a count of
 * accounts, never which ones (#3970). Words carry it; no colour means anything here.
 *
 * "active" is load-bearing, not decoration. The server counts ENABLED subscriptions only
 * (`subscriberCounts`, deliberately — a paused subscription delegates nothing), so a card that
 * said plain "subscribers" would be narrower than its own word: an account that paused is still a
 * subscriber, and it is not in this number. The label names the measure it is actually reporting.
 */
function subscriberLine(count: number): string {
  if (count === 0) return "No active subscribers yet";
  return `${count} active ${count === 1 ? "subscriber" : "subscribers"}`;
}

export function PlaybookCard({
  accountId,
  card,
  canManage,
  delegation,
  botsOnly,
  onChanged,
  accountName,
  metrics,
  house,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  /** Bots only for now (#4610) — absent reads as open (a server from before the rule). */
  readonly botsOnly?: BotsOnlyGateView;
  readonly onChanged: () => void;
  readonly accountName: string;
  /** The selected account's own numbers on this playbook (#3665) — absent when none is managed. */
  readonly metrics?: MetricsScope;
  /** Every account's numbers on this playbook (#3665 slice 4) — a separate block, never summed. */
  readonly house?: MetricsScope;
}): ReactElement {
  const subscribed = canManage && card.subscription !== undefined;
  return (
    <section className="pb-card" data-subscribed={subscribed || undefined}>
      <h2 className="pb-card-h">
        <span className="pb-card-id">{card.id}</span>{" "}
        <span className="num pb-card-symbols">{card.symbols.join(" · ")}</span>
      </h2>
      {subscribed ? (
        // An existing subscription keeps every exit it had, on every account — pausing and
        // leaving are never gated. Edit is a delegation, so it waits behind the fog.
        <SubscriptionRow
          accountId={accountId}
          card={card}
          human={botsOnly?.locked === true}
          {...(delegation.locked ? { editLock: delegation.note } : {})}
          onChanged={onChanged}
        />
      ) : null}
      {card.subscribers !== undefined ? (
        <p className="pb-card-subscribers">{subscriberLine(card.subscribers)}</p>
      ) : null}
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
      {metrics ? <AccountPlaybookMetrics accountName={accountName} scope={metrics} /> : null}
      {house ? <HousePlaybookMetrics scope={house} /> : null}
      {canManage && !subscribed ? (
        <NewSubscription
          accountId={accountId}
          card={card}
          delegation={delegation}
          {...(botsOnly ? { botsOnly } : {})}
          onChanged={onChanged}
        />
      ) : null}
    </section>
  );
}
