/**
 * THE PLAYBOOK STORE's client model (issue #885) — mirrors `PlaybookStoreView` in
 * `src/observatory/playbook-store-json-view.ts`. The client renders the server's answer verbatim
 * and decides nothing; ownership (whether subscribe/unsubscribe is even offered) is the server's
 * call, reflected here only as `canManage`.
 */
import { postJson } from "./post";

export type PlaybookMode = "conservative" | "standard" | "aggressive";

export interface PlaybookStoreCardView {
  readonly id: string;
  readonly symbol: string;
  readonly description: string;
  readonly enter: string;
  readonly exitTakeProfit: string;
  readonly exitCutLosses: string;
  readonly hold: string;
  readonly metrics: readonly never[];
  readonly subscription?: {
    readonly mode: PlaybookMode;
    readonly capitalAllocated: number;
    readonly enabled: boolean;
  };
}

/** The delegation fog (#1707) — mirrors `DelegationGateView`. The server owns the copy. */
export interface DelegationGateView {
  readonly locked: boolean;
  readonly unlocksAfter: string;
  readonly unlocksAfterName: string;
  readonly note: string;
}

export interface PlaybookStoreView {
  readonly cards: readonly PlaybookStoreCardView[];
  readonly capitalUnderManagement: number;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
}

export interface SubscriptionWriteResult {
  readonly ok: boolean;
  readonly error?: string;
}

export async function fetchPlaybookStore(id: string): Promise<PlaybookStoreView> {
  const res = await fetch(`/api/playbook-store?id=${encodeURIComponent(id)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`playbook-store ${res.status}`);
  return (await res.json()) as PlaybookStoreView;
}

export const subscribeRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/subscribe", input);

export const unsubscribeRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/unsubscribe", input);

export const setSubscriptionEnabledRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
  readonly enabled: boolean;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/set-enabled", input);
