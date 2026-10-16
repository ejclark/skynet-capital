import { STRATEGIES, type StrategyId } from "../playbooks/pair-table.js";
import { isRecord, survivesParse } from "../storage/parse-guards.js";
import {
  parseSubscription,
  RESERVED_KEY_PREFIX,
  type SubscriptionsState,
} from "./subscription-state.js";

/**
 * THE SUBSCRIPTIONS FILE, BEYOND THE ACCOUNTS — what `playbook-subscriptions.json` holds that
 * `parseSubscriptionsState` does not hand to a caller, and how a rewrite keeps it.
 *
 * KEEP WHAT YOU CANNOT READ (#4772). Every Store write and both seeders rewrite the file whole. A
 * build that dropped what it could not parse would, after a rollback or a mixed deploy, erase on its
 * first write a record or a file-level key a newer build added — the conviction and allocation
 * below are the first such fields. So a rewrite lays the new state over what is on disk: a record
 * this build cannot parse goes back byte for byte (and is reported), a top-level key it does not
 * own goes back as is, and a record it can parse carries its unknown fields itself
 * (`subscription-state.ts`). Two things a rewrite still drops, and says so when it does: a value
 * of a field this build owns that it judged malformed, and a record it cannot parse whose playbook
 * id the new state now holds (a subscribe replaces by playbook id, whatever the old one was).
 *
 * THE STRATEGY ALLOCATION (#4469 slice 3c, criterion 5; Eric, 2026-10-02: "Play config may also
 * have details around allocation. This should be a subset of the playbook allocation"). One record
 * per account × strategy, under the reserved top-level key `$allocations` — never copied onto a
 * subscription, so one number caps every ticker's budget on that strategy. Its own key rather than
 * its own file so the budgets and the allocation they must fit inside are written in one atomic
 * rename. Builds before this one skip a non-array key, so the key is invisible to them; from this
 * build on it survives every rewrite. Part 1 read and carried it; part 3 writes it
 * (`withAllocations`), and the budgets it caps are checked in `strategy-budgets.ts`.
 */

export const ALLOCATIONS_KEY = `${RESERVED_KEY_PREFIX}allocations`;

export interface StrategyAllocation {
  /** Dollars the owner gives the strategy; its tickers' budgets add up to at most this. */
  readonly capitalAllocated: number;
  /** ISO-8601. */
  readonly updatedAt: string;
}

/** Account id → strategy → its allocation. */
export type AllocationsState = Readonly<
  Record<string, Readonly<Partial<Record<StrategyId, StrategyAllocation>>>>
>;

export const EMPTY_ALLOCATIONS: AllocationsState = {};

const isStrategyId = (id: string): id is StrategyId => Object.hasOwn(STRATEGIES, id);

function parseAllocation(raw: unknown): StrategyAllocation | undefined {
  if (!isRecord(raw)) return undefined;
  const { capitalAllocated, updatedAt } = raw;
  if (typeof capitalAllocated !== "number" || !Number.isFinite(capitalAllocated)) return undefined;
  if (capitalAllocated <= 0 || typeof updatedAt !== "string") return undefined;
  return { capitalAllocated, updatedAt };
}

/**
 * The allocations, read leniently: a malformed record or a strategy this build does not know is
 * left out (the file keeps it — see above), never fatal to the rest. An account with none left is
 * omitted, as an account with no subscriptions is.
 */
export function parseAllocations(raw: unknown): AllocationsState {
  if (!isRecord(raw)) return EMPTY_ALLOCATIONS;
  const state: Record<string, Partial<Record<StrategyId, StrategyAllocation>>> = {};
  for (const [accountId, strategies] of Object.entries(raw)) {
    if (!isRecord(strategies)) continue;
    const parsed: Partial<Record<StrategyId, StrategyAllocation>> = {};
    for (const [strategy, entry] of Object.entries(strategies)) {
      const allocation = parseAllocation(entry);
      if (allocation && isStrategyId(strategy)) parsed[strategy] = allocation;
    }
    if (Object.keys(parsed).length > 0) state[accountId] = parsed;
  }
  return state;
}

/** The allocations in a whole subscriptions file. */
export function allocationsIn(file: unknown): AllocationsState {
  return parseAllocations(isRecord(file) ? file[ALLOCATIONS_KEY] : undefined);
}

/**
 * The file with `allocations` laid over its `$allocations` key, everything else as it is on disk —
 * the allocation write. Same rule as `rewrite`: an entry this build cannot read (a strategy it does
 * not know, a malformed record) goes back unchanged; an entry it reads is replaced by `allocations`,
 * so one it reads and `allocations` no longer holds is the one being cleared.
 */
export function withAllocations(
  allocations: AllocationsState,
  onDisk: unknown,
): Record<string, unknown> {
  const disk = isRecord(onDisk) ? onDisk : {};
  const before = isRecord(disk[ALLOCATIONS_KEY]) ? disk[ALLOCATIONS_KEY] : {};
  const merged: Record<string, unknown> = {};
  for (const accountId of new Set([...Object.keys(before), ...Object.keys(allocations)])) {
    const raw = before[accountId];
    if (raw !== undefined && !isRecord(raw) && allocations[accountId] === undefined) {
      merged[accountId] = raw;
      continue;
    }
    const unread = isRecord(raw)
      ? Object.entries(raw).filter(
          ([strategy, entry]) => !(isStrategyId(strategy) && parseAllocation(entry)),
        )
      : [];
    const entries = { ...Object.fromEntries(unread), ...(allocations[accountId] ?? {}) };
    if (Object.keys(entries).length > 0) merged[accountId] = entries;
  }
  const { [ALLOCATIONS_KEY]: _old, ...rest } = disk;
  return Object.keys(merged).length > 0 ? { ...rest, [ALLOCATIONS_KEY]: merged } : rest;
}

export interface Rewrite {
  /** What goes on disk. */
  readonly document: Record<string, unknown>;
  /** One line per account whose rewrite went around something this build could not read — said,
   *  never silent. */
  readonly notes: readonly string[];
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/** A record this build cannot read, which the new state has not replaced by playbook id. */
function stillUnread(entry: unknown, accountId: string, held: ReadonlySet<string>): boolean {
  if (parseSubscription(entry, accountId) !== null) return false;
  const id = isRecord(entry) ? entry.playbookId : undefined;
  return !(typeof id === "string" && held.has(id));
}

/** A record this build reads, but only in part — a value of a field it owns that it judged
 *  malformed (a garbled conviction or symbol filter) — which the new state still holds, so the
 *  rewrite drops that value. Said, because it is the one loss a rewrite still makes. */
function readInPart(entry: unknown, accountId: string, held: ReadonlySet<string>): boolean {
  const parsed = parseSubscription(entry, accountId);
  return parsed !== null && held.has(parsed.playbookId) && !survivesParse(entry, parsed);
}

/** Lay `state` over the file on disk, keeping everything this build could not read (#4772). */
export function rewrite(state: SubscriptionsState, onDisk: unknown): Rewrite {
  const disk = isRecord(onDisk) ? onDisk : {};
  const document: Record<string, unknown> = {};
  const notes: string[] = [];
  for (const key of new Set([...Object.keys(disk), ...Object.keys(state)])) {
    const records = state[key];
    const raw = disk[key];
    // A reserved key is never an account, and any other non-array is not one this build reads.
    const notAnAccount = key.startsWith(RESERVED_KEY_PREFIX) || !Array.isArray(raw);
    if (records === undefined && raw !== undefined && notAnAccount) {
      document[key] = raw;
      continue;
    }
    const held = new Set((records ?? []).map((sub) => sub.playbookId));
    const onDisk = Array.isArray(raw) ? raw : [];
    const unread = onDisk.filter((entry) => stillUnread(entry, key, held));
    const partial = onDisk.filter((entry) => readInPart(entry, key, held)).length;
    if (unread.length > 0) notes.push(`${key}: kept ${plural(unread.length, "record")} unchanged`);
    if (partial > 0)
      notes.push(`${key}: dropped a malformed value from ${plural(partial, "record")}`);
    const merged = [...(records ?? []), ...unread];
    if (merged.length > 0) document[key] = merged;
  }
  return { document, notes };
}

/**
 * Whether a rewrite from `parsed` would decide anything blind — the seeders' bar
 * (`JsonFileStore.loadIfReadable`). A newer build's field on a record is carried, and a reserved
 * file-level key is never the seeders' to change, so neither stops them. A record that did not
 * parse still does: a seed deciding what an account holds must see every record it holds.
 */
export function readsWhole(raw: unknown, parsed: SubscriptionsState): boolean {
  if (!isRecord(raw)) return false;
  return Object.entries(raw).every(
    ([key, value]) => key.startsWith(RESERVED_KEY_PREFIX) || survivesParse(value, parsed[key]),
  );
}
