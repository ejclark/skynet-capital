/**
 * The multi-leg draft's client model (#582, slices 3-4) — mirrors the server's
 * `draft-order-route.ts`. Same doctrine as `options.ts`: this file renders the server's answers
 * verbatim and decides nothing — every add/remove/reprice/validate/review/submit call goes to
 * `/api/trade/draft`, which applies the actual `draft-order.ts` state machine and hands the whole
 * new draft (and its payoff preview) straight back. The client never mutates a draft locally.
 */

import { postJson } from "./post";
import type { TicketTimeInForce } from "./ticket";

export type DraftPhase = "empty" | "drafting" | "validated" | "reviewed" | "submitted";

export interface DraftLeg {
  readonly id: string;
  readonly underlying: string;
  readonly optionType: "call" | "put";
  readonly strike: number;
  readonly expiration: string;
  readonly action: "buy" | "sell";
  readonly contracts: number;
  readonly limitPrice?: number;
}

export type NewLeg = Omit<DraftLeg, "id">;

export interface DraftVerdict {
  readonly ok: boolean;
  readonly refusals: readonly string[];
  readonly warnings: readonly string[];
}

export interface DraftOrder {
  readonly phase: DraftPhase;
  readonly legs: readonly DraftLeg[];
  readonly verdict?: DraftVerdict;
  readonly refusals: readonly string[];
  readonly nextLegId: number;
}

export interface PayoffPoint {
  readonly price: number;
  readonly pnl: number;
}

/** The server-sampled at-expiration curve (`draft-order-preview.ts`'s `payoffCurve`). */
export interface PayoffCurve {
  readonly points: readonly PayoffPoint[];
  readonly breakevens: readonly number[];
  readonly from: number;
  readonly to: number;
}

export interface DraftPreview {
  readonly legCount: number;
  readonly pricedFully: boolean;
  readonly netPremium?: number;
  readonly maxGain: number | "uncapped";
  readonly maxLoss: number | "unlimited";
  readonly unlimitedLoss: boolean;
  readonly undefinedRiskLegIds: readonly string[];
  readonly payoff?: PayoffCurve;
}

export const emptyDraft = (): DraftOrder => ({
  phase: "empty",
  legs: [],
  refusals: [],
  nextLegId: 1,
});

type DraftAction =
  | { readonly kind: "add-leg"; readonly leg: NewLeg }
  | { readonly kind: "remove-leg"; readonly id: string }
  | { readonly kind: "reprice-leg"; readonly id: string; readonly limitPrice?: number }
  | { readonly kind: "validate" }
  | { readonly kind: "review" }
  | { readonly kind: "submit"; readonly timeInForce?: TicketTimeInForce };

export interface DraftResponse {
  readonly draft: DraftOrder;
  readonly preview: DraftPreview;
  /** The server's own word on whether the submit reached the broker — never inferred from phase. */
  readonly executed?: boolean;
  readonly note?: string;
  /** The broker's echo on an executed submit (#3407 P3 slice 1). */
  readonly orderId?: string;
  readonly status?: string;
  readonly timeInForce?: string;
}

function applyDraftAction(
  participantId: string,
  draft: DraftOrder,
  action: DraftAction,
): Promise<DraftResponse> {
  return postJson("/api/trade/draft", { participantId, draft, action });
}

export const addDraftLeg = (participantId: string, draft: DraftOrder, leg: NewLeg) =>
  applyDraftAction(participantId, draft, { kind: "add-leg", leg });

export const removeDraftLeg = (participantId: string, draft: DraftOrder, id: string) =>
  applyDraftAction(participantId, draft, { kind: "remove-leg", id });

export const repriceDraftLeg = (
  participantId: string,
  draft: DraftOrder,
  id: string,
  limitPrice: number | undefined,
) => applyDraftAction(participantId, draft, { kind: "reprice-leg", id, limitPrice });

export const validateDraft = (participantId: string, draft: DraftOrder) =>
  applyDraftAction(participantId, draft, { kind: "validate" });

export const reviewDraft = (participantId: string, draft: DraftOrder) =>
  applyDraftAction(participantId, draft, { kind: "review" });

export const submitDraftOrder = (
  participantId: string,
  draft: DraftOrder,
  timeInForce?: TicketTimeInForce,
) =>
  applyDraftAction(participantId, draft, {
    kind: "submit",
    ...(timeInForce ? { timeInForce } : {}),
  });
