import type { PlaybookSubscription } from "../domain/types.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import {
  EMPTY_SUBSCRIPTIONS,
  parseSubscriptionsState,
  type SubscriptionsState,
} from "../subscriptions/subscription-state.js";

/**
 * The durable state behind an account's Playbook Store — which playbooks an
 * account subscribed to and how much capital it reserved per subscription.
 *
 * Plain JSON, deliberately NOT encrypted, same reasoning as `bot-controls-store.ts`: no
 * credentials, no personal data. Backed by the same `JsonFileStore` primitive: atomic
 * tmp+rename writes, total reads (a missing or malformed file is just `EMPTY_SUBSCRIPTIONS`,
 * reported once).
 */
export class SubscriptionStore {
  private readonly file: JsonFileStore<SubscriptionsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseSubscriptionsState(raw) ?? undefined,
      empty: EMPTY_SUBSCRIPTIONS,
      label: "subscriptions",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): SubscriptionsState {
    return this.file.load();
  }

  /**
   * Create or replace (by `playbookId`) the account's subscription to a playbook. Replacing an
   * existing subscription preserves its original `createdAt`.
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
}

/** Build the store from the environment (`SKYNET_SUBSCRIPTIONS_FILE`, default `data/playbook-subscriptions.json`). */
export function createSubscriptionStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): SubscriptionStore {
  return new SubscriptionStore(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    onReadError,
  );
}
