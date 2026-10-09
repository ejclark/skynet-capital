import { Fragment, type ReactElement } from "react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PairRowView,
  PlaybookStoreCardView,
} from "../live/playbook-store";
import {
  AccountPlaybookMetrics,
  HousePlaybookMetrics,
  type MetricsScope,
} from "./playbook-metrics";
import { SubscribeForm } from "./playbook-subscribe-form";

/**
 * THE PLAYBOOK STORE's pair rows (issue #885; by strategy since #4469 slice 3b), moved here whole
 * from the retired desk route `/u/$id/playbooks` when the Store became R&D → Playbooks (#3623). A
 * strategy card (`playbook-strategy-cards.tsx`) holds one row per pair. The account is a parameter
 * of the action, never a page of its own.
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

/** What sits under a pair the selected account is not subscribed to. */
function NewSubscription({
  accountId,
  card,
  delegation,
  botsOnly,
  refusal,
  needsConviction,
  onChanged,
}: {
  readonly accountId: string;
  readonly card: PlaybookStoreCardView;
  readonly delegation: DelegationGateView;
  readonly botsOnly?: BotsOnlyGateView;
  /** The study does not back this pair: Subscribe asks for the owner's conviction first. */
  readonly needsConviction?: boolean;
  /** Why the server would refuse a new subscription to this pair (criterion 9) — said in words. */
  readonly refusal?: string;
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
  if (refusal) {
    return <SubscribeDoor glyph="–" note={refusal} title="This pair takes no new subscription" />;
  }
  return (
    <details className="pb-subscribe-disclosure">
      <summary>Subscribe</summary>
      <SubscribeForm
        accountId={accountId}
        card={card}
        needsConviction={needsConviction === true}
        onSaved={onChanged}
      />
    </details>
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

/** The ticker a row is headed by: its one ticker, or what a basket and a no-ticker pick read as. */
export function pairTitle(symbols: readonly string[]): string {
  if (symbols.length === 1) return symbols[0] ?? "";
  return symbols.length === 0 ? "Picked on the day" : `${symbols.length} names`;
}

/** What the evidence says beyond the status word: how sure, which exit it was measured at, and the
 *  dates it holds for. Absolute dates only — a relative one is wrong tomorrow (`docs/IA.md` §2). */
function evidenceFacts(pair: PairRowView): string[] {
  return [
    ...(pair.confidence ? [`${pair.confidence} confidence`] : []),
    ...(pair.measuredExit ? [`measured at the ${pair.measuredExit} exit`] : []),
    ...(pair.shelfOn ? [`verdict holds to ${pair.shelfOn}`] : []),
    ...(pair.checkOn ? [`conviction checked ${pair.checkOn}`] : []),
  ];
}

/**
 * One pair on a strategy card (#4469 slice 3b): a strategy on a ticker, headed by the ticker and its
 * evidence as a glyph AND a word. Rows read by what the owner came to do, as `PlaybookCard` did:
 * the evidence first, then why it cannot be subscribed (visible words, never a tooltip — a phone has
 * no hover) or the door to subscribe, then the rules and the record.
 *
 * No cross-account visibility: `canManage` (from the server) is the only signal a viewer gets about
 * whether the selected account is theirs — without it the rows render with no controls and no
 * capital figures.
 *
 * TWO DOORS can hold a new subscription, checked in the server's order:
 *  - Bots only for now (#4610): on a human account the Subscribe control is drawn disabled under
 *    `BOTS_ONLY_NOTE`. That is not a fog, because nothing earnable opens it (`docs/FOG-OF-WAR.md`),
 *    so it names no rung.
 *  - The delegation fog (#1707): with training wheels on and rung 102 unearned, the control is
 *    drawn disabled under the sentence naming the rung that opens it.
 * A pair the code would refuse (criterion 9) draws the same disabled control under the server's own
 * sentence. Everything a member needs to judge a pair (what it does, when it enters, both exits)
 * stays readable behind any of them. Rendering only: the server refuses a held subscribe regardless,
 * and unsubscribe, pause and resume are never gated on either side.
 */
export function PairRow({
  accountId,
  card,
  pair,
  canManage,
  delegation,
  botsOnly,
  onChanged,
  accountName,
  metrics,
  house,
}: {
  readonly accountId: string;
  /** The pair's rules and numbers, joined on `pair.id`. */
  readonly card: PlaybookStoreCardView;
  readonly pair: PairRowView;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  /** Bots only for now (#4610) — absent reads as open (a server from before the rule). */
  readonly botsOnly?: BotsOnlyGateView;
  readonly onChanged: () => void;
  readonly accountName: string;
  /** The selected account's own numbers on this pair (#3665) — absent when none is managed. */
  readonly metrics?: MetricsScope;
  /** Every account's numbers on this pair (#3665 slice 4) — a separate block, never summed. */
  readonly house?: MetricsScope;
}): ReactElement {
  const subscribed = canManage && pair.subscription !== undefined;
  const facts = evidenceFacts(pair);
  return (
    <div className="pb-pair" data-subscribed={subscribed || undefined} data-status={pair.status}>
      <h3 className="pb-pair-h">
        <span className="num pb-pair-ticker">{pairTitle(pair.symbols)}</span>{" "}
        <span className="pb-pair-status">{pair.statusLabel}</span>
      </h3>
      {pair.symbols.length > 1 ? (
        <p className="num pb-card-symbols">{pair.symbols.join(" · ")}</p>
      ) : null}
      <p className="pb-pair-call">{pair.call}</p>
      {pair.reason ? <p className="pb-pair-note">Can't run: {pair.reason}.</p> : null}
      {facts.length > 0 || pair.studyHref ? (
        <p className="pb-pair-facts">
          {facts.join(" · ")}
          {facts.length > 0 && pair.studyHref ? " · " : ""}
          {pair.studyHref ? <a href={pair.studyHref}>its study →</a> : null}
        </p>
      ) : null}
      {pair.number ? <p className="pb-pair-facts">{pair.number}</p> : null}
      {pair.handOff ? <p className="pb-pair-note">{pair.handOff}.</p> : null}
      {pair.notTrading ? <p className="pb-pair-note">{pair.notTrading}</p> : null}
      {card.subscribers !== undefined ? (
        <p className="pb-card-subscribers">{subscriberLine(card.subscribers)}</p>
      ) : null}
      {canManage && !subscribed ? (
        <NewSubscription
          accountId={accountId}
          card={card}
          delegation={delegation}
          {...(botsOnly ? { botsOnly } : {})}
          {...(pair.subscribeRefusal ? { refusal: pair.subscribeRefusal } : {})}
          {...(pair.needsConviction ? { needsConviction: true } : {})}
          onChanged={onChanged}
        />
      ) : null}
      <details className="pb-pair-rules" open>
        <summary>Rules and record</summary>
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
          {card.notes?.map((note) => (
            <Fragment key={note.label}>
              <dt>{note.label}</dt>
              <dd>{note.text}</dd>
            </Fragment>
          ))}
        </dl>
        <footer className="pb-card-evidence">
          <span className="num">{card.evidence}</span>
          {card.evidenceHref && card.evidenceHref !== pair.studyHref ? (
            <a href={card.evidenceHref}>the study behind it →</a>
          ) : null}
        </footer>
        {metrics ? <AccountPlaybookMetrics accountName={accountName} scope={metrics} /> : null}
        {house ? <HousePlaybookMetrics scope={house} /> : null}
      </details>
    </div>
  );
}
