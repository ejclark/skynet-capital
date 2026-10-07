/**
 * THE PLAYBOOK STORE's client model (issue #885) — mirrors `PlaybookStoreView` in
 * `src/observatory/playbook-store-json-view.ts`. The client renders the server's answer verbatim
 * and decides nothing; ownership (whether subscribe/unsubscribe is even offered) is the server's
 * call, reflected here only as `canManage`.
 */
import { postJson } from "./post";

export type PlaybookMode = "conservative" | "standard" | "aggressive";

/** A probe-proven trait ("Confirmed dates only") — mirrors `PlayTrait` in `playbook-probe.ts`. */
export interface PlaybookTraitView {
  readonly id: string;
  readonly label: string;
  readonly claim: string;
}

export interface PlaybookStoreCardView {
  readonly id: string;
  readonly symbol: string;
  /** The whole basket; `symbol` is its first entry. */
  readonly symbols: readonly string[];
  /** The registry's citation, and its research-doc route when it names one (#3623). */
  readonly evidence: string;
  readonly evidenceHref?: string;
  /** The probe's date window and per-mode target exposure — absent for a tactical playbook. */
  readonly window?: string;
  readonly size?: Readonly<Record<PlaybookMode, number>>;
  readonly traits: readonly PlaybookTraitView[];
  readonly description: string;
  readonly enter: string;
  readonly exitTakeProfit: string;
  readonly exitCutLosses: string;
  readonly hold: string;
  /** Labelled rows drawn after Hold, in order — absent on a card that needs none. Mirrors
   *  `PlaybookCardNote` in `src/discovery/playbook-store.ts`. */
  readonly notes?: readonly { readonly label: string; readonly text: string }[];
  readonly metrics: readonly never[];
  /** Enabled subscriptions to this playbook across every account (#3970) — a bare count, never
   *  who. Absent when the deployment has no subscription store wired. */
  readonly subscribers?: number;
  readonly subscription?: SubscriptionView;
}

/** One account's own subscription to one playbook, as the server sends it to its owner. */
export interface SubscriptionView {
  readonly mode: PlaybookMode;
  /** Absent = uncapped: no subscription budget (#4535's seeded house roster). */
  readonly capitalAllocated?: number;
  readonly enabled: boolean;
  /** The symbols filter (#885): new entries only in these, never outside the card's basket.
   *  Absent = the whole basket. */
  readonly symbols?: readonly string[];
  /** Owner opt-in to compound this subscription's budget with its own realized P/L (issue
   *  #3527 slice 3) — absent means off, the flat-budget default. */
  readonly compoundAllocation?: boolean;
}

/** The delegation fog (#1707) — mirrors `DelegationGateView`. The server owns the copy. */
export interface DelegationGateView {
  readonly locked: boolean;
  readonly unlocksAfter: string;
  readonly unlocksAfterName: string;
  readonly note: string;
}

/** Only bot accounts subscribe for now (#4610) — mirrors `BotsOnlyGateView`. The server owns the
 *  copy and the call; `locked` is true on a human account the viewer owns. */
export interface BotsOnlyGateView {
  readonly locked: boolean;
  readonly note: string;
}

/** How a pair's evidence reads — mirrors `EvidenceStatus` in `src/playbooks/pair-table.ts`. */
export type PairStatus =
  | "researched"
  | "conviction"
  | "screened"
  | "stand-aside"
  | "not-studied"
  | "cant-run";

/** One pair (a strategy on a ticker) on a strategy card — mirrors `PairRowView` in
 *  `src/observatory/playbook-store-json-view.ts`. `id` is the playbook id every subscription and
 *  write keys on (criterion 8): the client looks it up in `cards`, never builds or splits it. */
export interface PairRowView {
  readonly id: string;
  readonly symbols: readonly string[];
  readonly status: PairStatus;
  /** "✓ researched, weakened" — glyph plus words, "· past its shelf date" once stale. */
  readonly statusLabel: string;
  readonly stale: boolean;
  readonly call: string;
  readonly confidence?: "high" | "medium" | "low";
  readonly measuredExit?: string;
  readonly number?: string;
  readonly verdictOn?: string;
  readonly shelfOn?: string;
  readonly checkOn?: string;
  readonly reason?: string;
  readonly studyHref?: string;
  readonly subscription?: SubscriptionView;
  /** Why a NEW subscription would be refused, in the server's own sentence (criterion 9). */
  readonly subscribeRefusal?: string;
  /** "the call spread trades NVDA on this bot; the run-up yields it" — a hand-off, not a refusal. */
  readonly handOff?: string;
  /** "not trading — the call spread owns NVDA" — the bots skip this held pair. */
  readonly notTrading?: string;
}

/** One strategy and the pairs it runs on, ✓ first — mirrors `StrategyCardView`. */
export interface StrategyCardView {
  readonly strategy: string;
  /** Read as "<name> on <TICKER>": lower-case, with its article ("the wheel"). */
  readonly name: string;
  readonly instrument: "shares" | "options";
  readonly summary: string;
  readonly pairs: readonly PairRowView[];
}

export interface PlaybookStoreView {
  readonly cards: readonly PlaybookStoreCardView[];
  /** One card per strategy, a row per pair — what the Store draws (#4469 slice 3b). `cards` stays
   *  beside it as the rules and numbers each row joins on its pair id. */
  readonly strategies: readonly StrategyCardView[];
  readonly capitalUnderManagement: number;
  readonly canManage: boolean;
  readonly delegation: DelegationGateView;
  /** Optional on the wire's client side only so a page loaded before #4610 shipped still renders:
   *  absent reads as open, the server's refusal being the real gate. */
  readonly botsOnly?: BotsOnlyGateView;
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
  readonly symbols?: readonly string[];
  readonly compoundAllocation?: boolean;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/subscribe", input);

/** Re-tune an existing subscription without touching whether it runs (#4649). Every field is the
 *  whole new value: `capitalAllocated: null` is uncapped, `symbols: []` is the whole basket. */
export const configureRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number | null;
  readonly symbols: readonly string[];
  readonly compoundAllocation: boolean;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/configure", input);

export const unsubscribeRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/unsubscribe", input);

export const setSubscriptionEnabledRequest = (input: {
  readonly id: string;
  readonly playbookId: string;
  readonly enabled: boolean;
}): Promise<SubscriptionWriteResult> => postJson("/api/playbook-store/set-enabled", input);
