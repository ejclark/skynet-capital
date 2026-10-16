import type { PlaybookSubscription } from "../domain/types.js";
import { type Conviction, convictionProblems } from "./conviction-record.js";
import { SEEDED_CONVICTIONS } from "./conviction-seeds.js";
import { findPair, type Pair } from "./pair-table.js";

/**
 * THE CONVICTION STORE (#5482 slice 2) — every conviction record, by id, and the pairs each one
 * steers. Read-only on purpose: the records are the seeded ones (`conviction-seeds.ts`), shipped
 * with the build, so the app that serves them and the bots that act on them read the same records
 * without a second wire. A file-backed store with a write route arrives with the slice that lets a
 * member state one (slice 6); it implements the same reads.
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

  constructor(records: readonly Conviction[], lookup: (id: string) => Pair | undefined = findPair) {
    const byId = new Map<string, Conviction>();
    const refused: RefusedConviction[] = [];
    for (const record of records) {
      const problems = [
        ...convictionProblems(record, lookup),
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
