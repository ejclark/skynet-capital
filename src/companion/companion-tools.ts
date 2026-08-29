import { lockedOnLadder } from "../domain/progression.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { deskLedger } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { ParticipantProgression, ProgressionService } from "../server/progression-service.js";

/**
 * THE COMPANION'S ENTIRE TOOL SURFACE — a CLOSED allow-list of four read-only lookups, and
 * nothing else. This is the structural half of the "never fires an order" invariant (the other
 * half is the system prompt): `runCompanionTool` is a `switch` over four literal string cases
 * with no default fallthrough to anything callable, so there is no code path here — not a typo,
 * not a hallucinated tool name, not a crafted `tool_use` block — that reaches an order-placing
 * function. This file does not import `trade-service.ts`, `option-trade-service.ts`,
 * `order-ticket.ts`, `option-ticket.ts`, or either Alpaca trading client, and
 * `tests/companion/companion-no-order-path.spec.ts` asserts that stays true by scanning every
 * file under `src/companion/` for those import specifiers.
 *
 * Every tool answers from data the member already owns (their own desk, their own progress, the
 * public play catalog) — never another member's account, never a write.
 */

export const COMPANION_TOOL_NAMES = [
  "get_my_positions",
  "get_my_round_trips",
  "get_my_curriculum_progress",
  "get_play_catalog",
] as const;

export type CompanionToolName = (typeof COMPANION_TOOL_NAMES)[number];

/** The Anthropic `tools` array — schemas only, no executable reference. */
export const COMPANION_TOOL_DEFS = [
  {
    name: "get_my_positions",
    description:
      "The member's own current holdings: symbol, quantity, average price, market value, and cash. Read-only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_my_round_trips",
    description:
      "The member's own closed trades (FIFO-matched round trips): symbol, entry/exit price, realized P/L, hold time. Read-only; at most the 10 most recent.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_my_curriculum_progress",
    description:
      "The member's own learning progress: training-wheels state, points, rank, milestones earned, and the next play to unlock. Read-only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_play_catalog",
    description:
      "Every trade type this desk offers (real broker term + plain-language gloss), each marked locked/unlocked for this member. Read-only, no member data beyond lock state.",
    input_schema: { type: "object", properties: {} },
  },
] as const;

/** What the tool dispatcher needs to answer honestly — all read accessors, all optional so a
 *  deployment missing a piece degrades to "not available" rather than throwing. */
export interface CompanionDeskDeps {
  readonly snapshotFor: (participantId: string) => ParticipantSnapshot | undefined;
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  readonly progression?: ProgressionService;
}

export type CompanionToolResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string };

function positionsResult(snapshot: ParticipantSnapshot | undefined): CompanionToolResult {
  if (!snapshot) return { ok: false, error: "no linked desk" };
  return {
    ok: true,
    result: {
      cash: snapshot.cash,
      equity: snapshot.equity,
      positions: snapshot.positions.map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        marketValue: p.marketValue,
      })),
    },
  };
}

async function roundTripsResult(
  snapshot: ParticipantSnapshot | undefined,
  readTradeActivity: CompanionDeskDeps["readTradeActivity"],
  participantId: string,
): Promise<CompanionToolResult> {
  if (!snapshot) return { ok: false, error: "no linked desk" };
  const durable = readTradeActivity ? await readTradeActivity(participantId) : undefined;
  const ledger = deskLedger(snapshot, durable);
  return {
    ok: true,
    result: {
      recent: ledger.trips.slice(-10).map((t) => ({
        symbol: t.symbol,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        realized: t.realized,
        returnPct: t.returnPct,
        closedAt: t.closedAt,
        // Without this the companion reads a written contract's "$4.20 in, $0 out" as a wipeout
        // when it was the writer keeping the whole premium — `realized` says so, the price pair
        // does not.
        ...(t.short ? { soldToOpen: true } : {}),
      })),
      openLots: ledger.open.length,
      truncated: ledger.truncated,
      // `truncated` only ever speaks for shares. The options half of "is this record complete?" is
      // this count — contracts read as written rather than as a leg opened before the window.
      writtenContracts: ledger.writtenQuantity,
    },
  };
}

function progressionResult(view: ParticipantProgression | undefined): CompanionToolResult {
  if (!view) return { ok: false, error: "no progression data for this member" };
  return {
    ok: true,
    result: {
      wheels: view.wheels,
      points: view.points,
      rank: view.rank,
      nextUp: view.nextUp,
      earnedCount: view.earned.length,
      unlocked: [...view.unlocked],
    },
  };
}

function playCatalogResult(view: ParticipantProgression | undefined): CompanionToolResult {
  return {
    ok: true,
    result: TRADE_TYPES.map((t) => ({
      code: t.code,
      name: t.name,
      tldr: t.tldr,
      kind: t.kind,
      side: t.side,
      gloss: t.gloss,
      locked: lockedOnLadder(t.code, view),
    })),
  };
}

/**
 * Run ONE of the four allow-listed tools. Any other name — including anything a compromised or
 * confused model might invent, like `place_order` or `submit_trade` — falls through to the
 * refusal below and touches nothing. `participantId` is the SESSION's own linked desk, resolved
 * upstream (`resolveOwnerId`) — never a client-supplied id, so this can never be pointed at
 * another member's account.
 */
export async function runCompanionTool(
  name: string,
  deps: CompanionDeskDeps,
  participantId: string,
): Promise<CompanionToolResult> {
  const snapshot = deps.snapshotFor(participantId);
  switch (name as CompanionToolName) {
    case "get_my_positions":
      return positionsResult(snapshot);
    case "get_my_round_trips":
      return roundTripsResult(snapshot, deps.readTradeActivity, participantId);
    case "get_my_curriculum_progress":
      return progressionResult(
        deps.progression ? await deps.progression.view(participantId) : undefined,
      );
    case "get_play_catalog":
      return playCatalogResult(
        deps.progression ? await deps.progression.view(participantId) : undefined,
      );
    default:
      // Structural refusal — there is no branch above that reaches a write, so an unrecognized
      // name (a typo, a hallucination, an adversarial member steering the model) lands here and
      // nowhere else.
      return { ok: false, error: `no such tool: ${name}` };
  }
}
