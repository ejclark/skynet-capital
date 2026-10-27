import type { PlaybookSubscription } from "../domain/types.js";
import {
  type ClaimOutcome,
  claimLabel,
  outcomeOf,
  type Scorecard,
  scorecardOf,
} from "../playbooks/claim-score.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import {
  CONVICTIONS,
  type ConvictionLookup,
  type ConvictionStore,
} from "../playbooks/conviction-store.js";

/**
 * "STEERED BY" ON A PAIR ROW, WITH THE VIEW'S SCORECARD (#5482 slice 5, criterion 7). A pair a
 * conviction record steers shows whose view it is, the day it is checked, and how its claims have
 * fared against their own falsifiers: "AI-dip view · check 2027-01-29 · 3 pass / 1 fail / 3
 * pending". The counts are the whole view's, because one belief steers several pairs; each claim
 * says whether this pair's fence rests on it.
 *
 * WHOSE VIEW, ON WHOSE ROW (#5482 slice 6c). A row shows the seeded view that steers its pair, as
 * before. On the viewed account's own row, its subscription's pointer decides instead
 * (`withOwnSteering`): a member who handed their own view to that bot sees their view there, because
 * that is the view narrowing it. Another member's view never shows on a row it does not steer.
 *
 * Members only: it rides on the Playbook Store payload behind the auth gate (criterion 8). It is
 * a read of the record; it sizes nothing and changes no pair's settings. Paper only, SIM.
 */

export interface SteeredClaimView {
  /** The claim's label in its call sheet ("2a"). */
  readonly label: string;
  /** The claim in one sentence, its number stripped. */
  readonly statement: string;
  readonly outcome: ClaimOutcome;
  /** `YYYY-MM-DD`: the day it is scored. */
  readonly dueOn?: string;
  readonly scoredOn?: string;
  /** What was read, or why it has not been. */
  readonly basis: string;
  /** This pair's fence rests on the claim. */
  readonly backsThisPair: boolean;
}

export interface SteeredByView {
  readonly convictionId: string;
  readonly title: string;
  readonly owner: string;
  /** `YYYY-MM-DD`: the day every pair the view steers is checked. */
  readonly checkOn: string;
  readonly scorecard: Scorecard;
  readonly claims: readonly SteeredClaimView[];
}

const stripNumber = (statement: string): string => statement.replace(/^\d+[a-z]?\.\s*/, "");

/** The view that steers a pair (the first stated, when more than one does), or undefined. */
export function steeredByView(
  pairId: string,
  store: ConvictionStore = CONVICTIONS,
): SteeredByView | undefined {
  const conviction = store.steering(pairId)[0];
  return conviction ? steeredByRecord(conviction, pairId) : undefined;
}

/** Each row the viewed account subscribes to with a pointer, showing the view the pointer names when
 *  `lookup` holds it for that account and it steers the pair; every other row as it was. */
export function withOwnSteering<
  Row extends { readonly id: string; readonly steeredBy?: SteeredByView },
  Card extends { readonly pairs: readonly Row[] },
>(
  strategies: readonly Card[],
  subscriptions: readonly PlaybookSubscription[],
  lookup: ConvictionLookup,
): Card[] {
  const pointers = new Map(subscriptions.map((s) => [s.playbookId, s.convictionId]));
  return strategies.map((card) => ({
    ...card,
    pairs: card.pairs.map((row) => {
      const id = pointers.get(row.id);
      const record = id === undefined ? undefined : lookup(id);
      return record?.steers.includes(row.id)
        ? { ...row, steeredBy: steeredByRecord(record, row.id) }
        : row;
    }),
  }));
}

/** One record, as the row of one pair it steers shows it. */
export function steeredByRecord(conviction: Conviction, pairId: string): SteeredByView {
  const backing = new Set(
    (conviction.narrowings ?? []).filter((n) => n.pair === pairId).flatMap((n) => n.fromClaims),
  );
  return {
    convictionId: conviction.id,
    title: conviction.title ?? conviction.id,
    owner: conviction.owner,
    checkOn: conviction.checkOn,
    scorecard: scorecardOf(conviction.claims),
    claims: conviction.claims.map((claim, i) => {
      const label = claimLabel(claim.statement, i + 1);
      const outcome = outcomeOf(claim);
      const dueOn = claim.score?.dueOn ?? claim.scoreBy;
      return {
        label,
        statement: stripNumber(claim.statement),
        outcome,
        ...(dueOn ? { dueOn } : {}),
        ...(claim.score?.scoredOn ? { scoredOn: claim.score.scoredOn } : {}),
        basis:
          claim.score?.basis ??
          (outcome === "untestable" ? "Nothing here can check it. Size zero." : "Not scored yet."),
        backsThisPair: backing.has(label),
      };
    }),
  };
}
