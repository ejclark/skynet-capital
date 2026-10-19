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
 * pair the view steers. Otherwise it is checked on its own conviction's date, exactly as before.
 * A pointer that resolves to nothing usable is said in `note`, never acted on: the subscription
 * falls back to its own conviction, so a dangling id can neither stop a pair nor clear a check.
 */
export interface StatedCheck {
  readonly checkOn?: string;
  readonly from?: "record" | "subscription";
  readonly convictionId?: string;
  readonly note?: string;
}

export function statedCheck(
  sub: PlaybookSubscription,
  lookup: ConvictionLookup = lookupConviction,
): StatedCheck {
  const own: StatedCheck = sub.conviction
    ? { checkOn: sub.conviction.checkOn, from: "subscription" }
    : {};
  const id = sub.convictionId;
  if (id === undefined) return own;
  const record = lookup(id);
  if (!record) {
    return { ...own, note: `${sub.playbookId} points at conviction "${id}", which is not stored` };
  }
  if (!record.steers.includes(sub.playbookId)) {
    return {
      ...own,
      note: `${sub.playbookId} points at conviction "${id}", which does not steer it`,
    };
  }
  return { checkOn: record.checkOn, from: "record", convictionId: id };
}
