import type { IncomingMessage, ServerResponse } from "node:http";
import type { DraftLeg, DraftOrder, DraftVerdict, NewLeg } from "../trading/draft-order.js";
import {
  addLeg,
  emptyDraft,
  removeLeg,
  repriceLeg,
  review as reviewDraft,
  submitDraft,
  validate as validateDraft,
} from "../trading/draft-order.js";
import type { DraftAccountContext } from "../trading/draft-order-account.js";
import { validateDraftAccount } from "../trading/draft-order-account.js";
import { draftPreview } from "../trading/draft-order-preview.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * THE MULTI-LEG DRAFT AS A ROUTE — one endpoint, `POST /api/trade/draft`, that
 * lets a leg-add on the chain and a leg-add from a future "strategy lab" both mutate the SAME
 * draft: every call re-imports the actual functions from `draft-order.ts` and applies exactly one
 * of them, then hands the resulting draft (plus its payoff preview) straight back. That is the
 * "same state machine" the issue asks for, kept real rather than aspirational — the alternative
 * (reimplementing add/remove/reprice in the browser) would let the two copies drift the moment
 * either one changed, which is the one failure #635's own tests exist to make impossible.
 *
 * WHY A ROUND TRIP FOR EVERY EDIT, even the ones that need no account (`add-leg`, `remove-leg`,
 * `reprice-leg` are pure). Consistency: every response is server truth, so the client never carries
 * a draft the server didn't just produce, and `validate` — the one action that DOES need a live
 * account — rides the identical code path. Same "service is the gate" doctrine as the single-leg
 * ticket, just applied to the whole lifecycle instead of only review/submit.
 *
 * A NOTE FOR WHOEVER WIRES REAL EXECUTION NEXT. This route trusts the `draft` the client echoes
 * back, phase included — harmless today because `submit` below refuses to place anything (no
 * broker call exists yet, same honest "not wired up" sentence the single-leg submit already uses).
 * The day a real `mleg` submission lands, submit must NOT trust an echoed `phase: "reviewed"`; it
 * must re-derive the verdict from a fresh account read the way `option-trade-service.ts` re-reads
 * the account today, exactly the same "review is a courtesy, the service is the gate" invariant.
 */

const DRAFT_BODY_CAP_BYTES = 8_192;
const OPTION_TYPES = new Set(["call", "put"]);
const ACTIONS = new Set(["buy", "sell"]);
const PHASES = new Set(["empty", "drafting", "validated", "reviewed", "submitted"]);

function parseNewLeg(raw: unknown): NewLeg | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const body = raw as Record<string, unknown>;
  const underlying = boundedString(body.underlying, 12);
  const optionType = body.optionType;
  const expiration = boundedString(body.expiration, 10);
  const action = body.action;
  const strike = body.strike;
  const contracts = body.contracts;
  if (!(underlying && expiration)) return undefined;
  if (typeof optionType !== "string" || !OPTION_TYPES.has(optionType)) return undefined;
  if (typeof action !== "string" || !ACTIONS.has(action)) return undefined;
  if (typeof strike !== "number" || !Number.isFinite(strike)) return undefined;
  if (typeof contracts !== "number" || !Number.isFinite(contracts)) return undefined;
  const limitPrice = body.limitPrice;
  return {
    underlying,
    optionType: optionType as "call" | "put",
    strike,
    expiration,
    action: action as "buy" | "sell",
    contracts,
    ...(typeof limitPrice === "number" && Number.isFinite(limitPrice) ? { limitPrice } : {}),
  };
}

function parseLeg(raw: unknown): DraftLeg | undefined {
  const base = parseNewLeg(raw);
  const id =
    typeof raw === "object" && raw !== null
      ? boundedString((raw as Record<string, unknown>).id, 40)
      : undefined;
  return base && id ? { ...base, id } : undefined;
}

function parseVerdict(raw: unknown): DraftVerdict | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const body = raw as Record<string, unknown>;
  if (typeof body.ok !== "boolean") return undefined;
  if (!(Array.isArray(body.refusals) && Array.isArray(body.warnings))) return undefined;
  return {
    ok: body.ok,
    refusals: body.refusals.filter((r): r is string => typeof r === "string"),
    warnings: body.warnings.filter((w): w is string => typeof w === "string"),
  };
}

/** Reconstruct a `DraftOrder` from the client's echo. A malformed shape falls back to
 *  `emptyDraft()` rather than 400ing — every field the pure state machine reads is re-validated
 *  by that same machine on the very next transition, so there is nothing unsafe about a lenient
 *  parse here; the worst case is a confused user re-adding legs, never a bad order. */
function parseDraft(raw: unknown): DraftOrder {
  if (typeof raw !== "object" || raw === null) return emptyDraft();
  const body = raw as Record<string, unknown>;
  const phase = typeof body.phase === "string" && PHASES.has(body.phase) ? body.phase : "empty";
  const legs = Array.isArray(body.legs)
    ? body.legs.map(parseLeg).filter((l): l is DraftLeg => !!l)
    : [];
  const nextLegId =
    typeof body.nextLegId === "number" && Number.isInteger(body.nextLegId) && body.nextLegId > 0
      ? body.nextLegId
      : legs.length + 1;
  const verdict = parseVerdict(body.verdict);
  return {
    phase: phase as DraftOrder["phase"],
    legs,
    refusals: [],
    nextLegId,
    ...(verdict ? { verdict } : {}),
  };
}

type DraftAction =
  | { readonly kind: "add-leg"; readonly leg: unknown }
  | { readonly kind: "remove-leg"; readonly id: unknown }
  | { readonly kind: "reprice-leg"; readonly id: unknown; readonly limitPrice: unknown }
  | { readonly kind: "validate" }
  | { readonly kind: "review" }
  | { readonly kind: "submit" };

interface DraftRequestBody {
  readonly participantId: string;
  readonly draft: unknown;
  readonly action: DraftAction;
}

const ACTION_KINDS = new Set([
  "add-leg",
  "remove-leg",
  "reprice-leg",
  "validate",
  "review",
  "submit",
]);

function parseRequest(raw: string): DraftRequestBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const participantId = boundedString(body.participantId, 100);
  const action = body.action;
  if (!participantId || typeof action !== "object" || action === null) return undefined;
  const kind = (action as Record<string, unknown>).kind;
  if (typeof kind !== "string" || !ACTION_KINDS.has(kind)) return undefined;
  return { participantId, draft: body.draft, action: action as DraftAction };
}

/** Apply exactly one transition — the same functions #635/#861 already ship and test. */
function applyAction(
  draft: DraftOrder,
  action: DraftAction,
  account: DraftAccountContext,
): DraftOrder {
  if (action.kind === "add-leg") {
    const leg = parseNewLeg(action.leg);
    return leg
      ? addLeg(draft, leg)
      : { ...draft, refusals: ["That leg didn't parse — try again from the chain."] };
  }
  if (action.kind === "remove-leg") {
    const id = boundedString(action.id, 40);
    return id ? removeLeg(draft, id) : draft;
  }
  if (action.kind === "reprice-leg") {
    const id = boundedString(action.id, 40);
    const limitPrice =
      typeof action.limitPrice === "number" && Number.isFinite(action.limitPrice)
        ? action.limitPrice
        : undefined;
    return id ? repriceLeg(draft, id, limitPrice) : draft;
  }
  if (action.kind === "validate") return validateDraft(draft, validateDraftAccount(draft, account));
  if (action.kind === "review") return reviewDraft(draft);
  return submitDraft(draft);
}

/** Handle `POST /api/trade/draft`. Returns true when answered. */
export async function serveDraftOrderApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/trade/draft") return false;
  const raw = await readJsonPost(req, res, DRAFT_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  const request = parseRequest(raw);
  if (!request) {
    sendJson(res, 400, { error: "malformed draft-order body" });
    return true;
  }

  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const isSelf = requesterId !== undefined && requesterId === request.participantId;
  if (!isSelf) {
    // Same rule the single-leg desk states outright: "You can only trade your own account." A
    // draft is nobody's business but the account it would eventually be sent from.
    sendJson(res, 200, {
      draft: {
        ...parseDraft(request.draft),
        refusals: ["You can only build an order on your own account."],
      },
    });
    return true;
  }

  const snapshot = config.hub.getState().participants.find((p) => p.id === request.participantId);
  const account: DraftAccountContext = snapshot
    ? { cash: snapshot.cash, positions: snapshot.positions }
    : { cash: 0, positions: [] };
  const draft = applyAction(parseDraft(request.draft), request.action, account);
  sendJson(res, 200, {
    draft,
    preview: draftPreview(draft),
    ...(request.action.kind === "submit"
      ? {
          executed: false,
          note: "No multi-leg execution path is wired up on this deployment yet — nothing was sent to the broker.",
        }
      : {}),
  });
  return true;
}
