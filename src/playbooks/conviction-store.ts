import type { PlaybookSubscription } from "../domain/types.js";
import { type Conviction, convictionProblems } from "./conviction-record.js";
import { SEEDED_CONVICTIONS } from "./conviction-seeds.js";
import type { SteerBounds } from "./conviction-steering.js";
import { findPair, type Pair } from "./pair-table.js";
import { findPlaybook } from "./registry.js";

/** The bounds a pair's playbook lets a conviction narrow, or undefined when it cannot be steered. */
export const playbookBounds = (pairId: string): SteerBounds | undefined =>
  findPlaybook(pairId)?.steerable?.bounds;

/**
 * THE CONVICTION STORE (#5482 slice 2) — every conviction record, by id, and the pairs each one
 * steers. Read-only on purpose: the records are the seeded ones (`conviction-seeds.ts`), shipped
 * with the build, so the app that serves them and the bots that act on them read the same records
 * without a second wire. A member's own views are kept apart as drafts (`member-conviction-store.ts`,
 * slice 6a) and steer nothing; the step that hands one to the bots brings it here.
 *
 * A record's narrowings (#5482 slice 4) are judged here against the bounds of the playbook each
 * names: one that would widen a bound is refused with the whole record, never clamped.
 *
 * A record that breaks a rule (`convictionProblems`) is refused at construction and listed in
 * `refused`, never served, so a bad record can never gate a pair. So is a second record with an id
 * already held: the first one stated wins.
 */
export interface RefusedConviction {
  readonly id: string;
  readonly problems: readonly string[];
}

export class ConvictionStore {
  private readonly byId: ReadonlyMap<string, Conviction>;
  readonly refused: readonly RefusedConviction[];

  constructor(
    records: readonly Conviction[],
    lookup: (id: string) => Pair | undefined = findPair,
    boundsOf: (pairId: string) => SteerBounds | undefined = playbookBounds,
  ) {
    const byId = new Map<string, Conviction>();
    const refused: RefusedConviction[] = [];
    for (const record of records) {
      const problems = [
        ...convictionProblems(record, lookup, boundsOf),
        ...(record.narrowings ?? [])
          .filter((n) => boundsOf(n.pair) === undefined)
          .map((n) => `narrows ${n.pair}, whose playbook cannot be steered`),
        ...(byId.has(record.id) ? ["a conviction with this id is already stored"] : []),
      ];
      if (problems.length > 0) refused.push({ id: record.id, problems });
      else byId.set(record.id, record);
    }
    this.byId = byId;
    this.refused = refused;
  }

  all(): readonly Conviction[] {
    return [...this.byId.values()];
  }

  get(id: string): Conviction | undefined {
    return this.byId.get(id);
  }

  /** The convictions that steer one pair. */
  steering(pairId: string): readonly Conviction[] {
    return this.all().filter((c) => c.steers.includes(pairId));
  }
}

/** The build's store: the seeded records. */
export const CONVICTIONS = new ConvictionStore(SEEDED_CONVICTIONS);

/** The record a subscription's pointer names, or undefined. */
export type ConvictionLookup = (id: string) => Conviction | undefined;

export const lookupConviction: ConvictionLookup = (id) => CONVICTIONS.get(id);

/**
 * The check a subscription is held to (#4469 criterion 12), and where it came from. A subscription
 * that points at a record steering its pair is checked on the record's date — one date for every
 * pair the view steers. A subscription with no pointer has no check (see POINTERS ONLY below).
 *
 * ONE WAY, NEVER BOTH (#5482 slice 2, the contract step's piece 2, bots first). A pointed
 * subscription's inline conviction is never read, even when the pointer cannot be used: the pointer
 * is the whole of its check, so the app dropping the inline copy changes nothing a bot does. A
 * pointer that resolves to nothing usable — not held, or a record that does not steer the pair — is
 * said in `note` and gives no check day; the pair is held safe by steering instead, which runs it
 * exits-only until the pointer resolves (`steeredBy`). A dangling id can never clear a check by
 * itself, because nothing new opens while it dangles.
 *
 * POINTERS ONLY (the contract step's piece 4, bots first). An inline conviction is never read, on
 * any subscription: since piece 3 the app keeps an owner's reason and day as a one-pair view and
 * points at it, and its poll moved every older inline copy onto one. Once the live count read zero
 * copies (#6046) the inline field went from the subscription (the last contract piece).
 *
 * A ◆ PAIR NEEDS A VIEW, COPY OR NOT (the inline carry's replacement, bots first). A ◆ pair trades
 * only on a conviction (#4469 criterion 2), so one with no pointer is held the same way whether or
 * not an inline copy rides beside it. Before, only the ◆ row's carried copy held it; with neither
 * it read "conviction not stated", which never stops a pair, so it would have traded unchecked. This
 * is what let the app stop writing that copy (its app half dropped the poll's inline carry): the
 * state block's default for "may the bots run a ◆ pair with no usable pointer exits-only?" was yes.
 */
export interface StatedCheck {
  readonly checkOn?: string;
  readonly convictionId?: string;
  readonly note?: string;
}

/** Why an unpointed subscription that trades on a conviction runs exits-only. */
export const CONVICTION_NOT_ON_VIEW = "its conviction is not on a view yet";

/** A subscription whose conviction is on no view: a ◆ row (which trades only on a conviction) with
 *  no pointer. The one test the bots' exits-only rule (`subscriptionRoster`), the gate's note and
 *  the owner's row (`withUnmovedConvictions`) share, so they cannot disagree. An authored play or an
 *  id that is no pair is left out: no view can be stated on one. So is a non-◆ pair with no
 *  pointer: that is criterion 11's "conviction not stated", a label and never a stop. Until #5482's
 *  last contract piece an unmoved inline copy also counted; the field is gone, and the live count
 *  read zero copies before it went (#6046). */
export function isConvictionOffView(sub: PlaybookSubscription): boolean {
  if (sub.convictionId !== undefined) return false;
  return findPair(sub.playbookId)?.evidence.status === "conviction";
}

export function statedCheck(
  sub: PlaybookSubscription,
  lookup: ConvictionLookup = lookupConviction,
): StatedCheck {
  const id = sub.convictionId;
  if (id === undefined) {
    return isConvictionOffView(sub) ? { note: `${sub.playbookId}: ${CONVICTION_NOT_ON_VIEW}` } : {};
  }
  const record = lookup(id);
  if (!record) {
    return { note: `${sub.playbookId} points at conviction "${id}", which is not stored` };
  }
  if (!record.steers.includes(sub.playbookId)) {
    return { note: `${sub.playbookId} points at conviction "${id}", which does not steer it` };
  }
  return { checkOn: record.checkOn, convictionId: id };
}
