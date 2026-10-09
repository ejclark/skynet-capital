import type { PlaybookSubscription, SubscriptionConviction } from "../domain/types.js";
import type { StrategyId } from "../playbooks/pair-table.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import {
  carriedOnResubscribe,
  EMPTY_SUBSCRIPTIONS,
  parseSubscriptionsState,
  type SubscriptionsState,
} from "../subscriptions/subscription-state.js";
import {
  type AllocationsState,
  allocationsIn,
  EMPTY_ALLOCATIONS,
  readsWhole,
  rewrite,
  withAllocations,
} from "../subscriptions/subscriptions-file.js";

/**
 * What an owner re-tunes on an existing subscription (#4649): every field the subscriptions.v1
 * wire carries except `enabled`. Absent capital = uncapped; absent or empty symbols = the whole
 * basket; absent compounding = off. The same meanings `PlaybookSubscription` documents.
 */
export type SubscriptionTuning = Pick<
  PlaybookSubscription,
  "mode" | "capitalAllocated" | "symbols" | "compoundAllocation"
>;

/**
 * The durable state behind an account's Playbook Store — which playbooks an
 * account subscribed to and how much capital it reserved per subscription.
 *
 * Plain JSON, deliberately NOT encrypted, same reasoning as `bot-controls-store.ts`: no
 * credentials, no personal data. Backed by the same `JsonFileStore` primitive: atomic
 * tmp+rename writes, total reads (a missing or malformed file is just `EMPTY_SUBSCRIPTIONS`,
 * reported once). Every write keeps what this build could not read (#4772,
 * `subscriptions-file.ts`).
 */
export class SubscriptionStore {
  private readonly file: JsonFileStore<SubscriptionsState>;
  /** The same file, read for its `$allocations` key; a write lays that key over the file on disk
   *  and leaves every account's records as they are (`withAllocations`). */
  private readonly allocations: JsonFileStore<AllocationsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    const report = onReadError ?? (() => undefined);
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseSubscriptionsState(raw) ?? undefined,
      empty: EMPTY_SUBSCRIPTIONS,
      label: "subscriptions",
      onReadError: report,
      readsWhole,
      serialize: (state, onDisk) => {
        const { document, notes } = rewrite(state, onDisk);
        if (notes.length > 0) {
          report(
            `[subscriptions] ${path}: rewrote around what this build could not read — ${notes.join("; ")}`,
          );
        }
        return document;
      },
    });
    // No reporter: a torn file is already reported by the subscriptions read of the same path.
    this.allocations = new JsonFileStore({
      path,
      parse: (raw) => (parseSubscriptionsState(raw) ? allocationsIn(raw) : undefined),
      empty: EMPTY_ALLOCATIONS,
      label: "allocations",
      serialize: withAllocations,
    });
  }

  load(): SubscriptionsState {
    return this.file.load();
  }

  /** Each account's allocation per strategy (#4469 slice 3c). */
  loadAllocations(): AllocationsState {
    return this.allocations.load();
  }

  /**
   * Set (or, with `undefined`, clear) the account's allocation for one strategy (#4469 slice 3c
   * part 3). Whether the budgets already set fit under it is the caller's check
   * (`allocationChangeRefusal`); this only writes.
   */
  setAllocation(
    accountId: string,
    strategy: StrategyId,
    capitalAllocated: number | undefined,
    at = new Date(),
  ): AllocationsState {
    const all = this.loadAllocations();
    const { [strategy]: _old, ...others } = all[accountId] ?? {};
    const mine =
      capitalAllocated === undefined
        ? others
        : { ...others, [strategy]: { capitalAllocated, updatedAt: at.toISOString() } };
    const { [accountId]: _account, ...rest } = all;
    const next: AllocationsState =
      Object.keys(mine).length > 0 ? { ...rest, [accountId]: mine } : rest;
    this.allocations.write(next);
    return next;
  }

  /**
   * The owner's conviction on an existing subscription (#4469 criteria 2 and 12): why they hold the
   * pair, and the market day it is checked. Setting a new date is how a pair stopped by a failed
   * check resumes. Every other field is kept, so it never resumes a paused subscription or touches
   * a budget. Returns undefined and writes nothing when the account has no such subscription.
   */
  setConviction(
    accountId: string,
    playbookId: string,
    conviction: SubscriptionConviction,
    at = new Date(),
  ): SubscriptionsState | undefined {
    const state = this.load();
    const existing = state[accountId] ?? [];
    const prior = existing.find((s) => s.playbookId === playbookId);
    if (!prior) return undefined;
    const next: PlaybookSubscription = { ...prior, conviction, updatedAt: at.toISOString() };
    const nextState: SubscriptionsState = {
      ...state,
      [accountId]: existing.map((s) => (s === prior ? next : s)),
    };
    this.file.write(nextState);
    return nextState;
  }

  /** `load`, but `undefined` for a file that exists and cannot be read — the seeders' read, so a
   *  seed never rewrites a subscriptions file it could not see (`JsonFileStore.loadIfReadable`). */
  loadIfReadable(): SubscriptionsState | undefined {
    return this.file.loadIfReadable();
  }

  /**
   * Create or replace (by `playbookId`) the account's subscription to a playbook. Replacing an
   * existing subscription preserves its original `createdAt`, and every field a subscribe does not
   * set — a conviction, a newer build's field (#4772).
   */
  subscribe(
    accountId: string,
    sub: Omit<PlaybookSubscription, "accountId" | "createdAt" | "updatedAt">,
    at = new Date(),
  ): SubscriptionsState {
    const state = this.load();
    const existing = state[accountId] ?? [];
    const prior = existing.find((s) => s.playbookId === sub.playbookId);
    const next: PlaybookSubscription = {
      ...(prior ? carriedOnResubscribe(prior) : {}),
      ...sub,
      accountId,
      createdAt: prior?.createdAt ?? at.toISOString(),
      updatedAt: at.toISOString(),
    };
    const nextState: SubscriptionsState = {
      ...state,
      [accountId]: [...existing.filter((s) => s.playbookId !== sub.playbookId), next],
    };
    this.file.write(nextState);
    return nextState;
  }

  unsubscribe(accountId: string, playbookId: string): SubscriptionsState {
    const state = this.load();
    const existing = state[accountId] ?? [];
    const remaining = existing.filter((s) => s.playbookId !== playbookId);
    const nextState: SubscriptionsState =
      remaining.length > 0
        ? { ...state, [accountId]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([id]) => id !== accountId));
    this.file.write(nextState);
    return nextState;
  }

  /** Replace the whole state — the seeder's write (`subscription-seed-store.ts`), which computes
   *  its next state purely and must land it in one atomic write. */
  replace(state: SubscriptionsState): void {
    this.file.write(state);
  }

  /** Flip a subscription's enabled flag. A no-op (state unchanged) if no such subscription exists. */
  setEnabled(
    accountId: string,
    playbookId: string,
    enabled: boolean,
    at = new Date(),
  ): SubscriptionsState {
    const state = this.load();
    const existing = state[accountId] ?? [];
    if (!existing.some((s) => s.playbookId === playbookId)) return state;
    const nextState: SubscriptionsState = {
      ...state,
      [accountId]: existing.map((s) =>
        s.playbookId === playbookId ? { ...s, enabled, updatedAt: at.toISOString() } : s,
      ),
    };
    this.file.write(nextState);
    return nextState;
  }

  /**
   * Re-tune an existing subscription without changing whether it runs (#4649). Mode, capital,
   * symbols and compounding are replaced. `enabled` and `createdAt` are kept, so editing a paused
   * subscription never resumes it. A resubscribe would, because `subscribe` writes whatever
   * `enabled` it is handed. Returns undefined and writes nothing when the account has no such
   * subscription: configure never creates one.
   */
  configure(
    accountId: string,
    playbookId: string,
    tuning: SubscriptionTuning,
    at = new Date(),
  ): SubscriptionsState | undefined {
    const state = this.load();
    const existing = state[accountId] ?? [];
    const prior = existing.find((s) => s.playbookId === playbookId);
    if (!prior) return undefined;
    // Drop the four tunables, keep everything else the record carries — including any field a
    // later wire version adds, which a rebuilt literal would silently lose.
    const {
      capitalAllocated: _capital,
      symbols: _symbols,
      compoundAllocation: _compound,
      ...kept
    } = prior;
    const next: PlaybookSubscription = {
      ...kept,
      mode: tuning.mode,
      ...(tuning.capitalAllocated !== undefined
        ? { capitalAllocated: tuning.capitalAllocated }
        : {}),
      ...(tuning.symbols && tuning.symbols.length > 0 ? { symbols: tuning.symbols } : {}),
      ...(tuning.compoundAllocation ? { compoundAllocation: true } : {}),
      updatedAt: at.toISOString(),
    };
    const nextState: SubscriptionsState = {
      ...state,
      [accountId]: existing.map((s) => (s === prior ? next : s)),
    };
    this.file.write(nextState);
    return nextState;
  }
}

/** Build the store from the environment (`SKYNET_SUBSCRIPTIONS_FILE`, default `data/playbook-subscriptions.json`). */
export function createSubscriptionStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): SubscriptionStore {
  return new SubscriptionStore(subscriptionsFilePath(env), onReadError);
}

/** Where the subscription store lives — shared with the seed-marker file beside it. */
export function subscriptionsFilePath(env: NodeJS.ProcessEnv): string {
  return env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json";
}
