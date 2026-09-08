import { lockedOnLadder } from "../domain/progression.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { deskLedger } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { Outlook } from "../options/outlook.js";
import type { Recommendation } from "../options/recommend.js";
import type { ParticipantProgression, ProgressionService } from "../server/progression-service.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";

/**
 * THE COMPANION'S ENTIRE TOOL SURFACE — a CLOSED allow-list of five read-only lookups plus one
 * hand-off (`draft_feedback`, which files nothing: it hands the rail a draft the member still has
 * to send), and nothing else. This is the structural half of the "never fires an order" invariant (the other
 * half is the system prompt): `runCompanionTool` is a `switch` over five literal string cases
 * with no default fallthrough to anything callable, so there is no code path here — not a typo,
 * not a hallucinated tool name, not a crafted `tool_use` block — that reaches an order-placing
 * function. This file does not import `trade-service.ts`, `option-trade-service.ts`,
 * `order-ticket.ts`, `option-ticket.ts`, or either Alpaca trading client, and
 * `tests/companion/companion-no-order-path.spec.ts` asserts that stays true by scanning every
 * file under `src/companion/` for those import specifiers. The one tool that needs live chain
 * data (`get_structures_for_outlook`) gets it through an injected `rankFor` closure: the
 * `AlpacaOptionsClient` import lives in `adapters/alpaca-recommend-chain.ts` and the boot wiring
 * (`scripts/dashboard-companion.ts`), never here — this file imports only the `Outlook` and
 * `Recommendation` TYPES, which are pure data shapes, not clients.
 *
 * Every tool answers from data the member already owns (their own desk, their own progress, the
 * public play catalog, a chain read through their own linked account) — never another member's
 * account, never a write.
 */

export const COMPANION_TOOL_NAMES = [
  "get_my_positions",
  "get_my_round_trips",
  "get_my_curriculum_progress",
  "get_play_catalog",
  "get_structures_for_outlook",
  "draft_feedback",
] as const;

/** What `draft_feedback` carries to the rail — a filing the MEMBER still has to send. */
export interface FeedbackDraft {
  readonly kind: "bug" | "feature" | "idea";
  readonly title: string;
  readonly details: string;
}

const KINDS = new Set(["bug", "feature", "idea"]);

/** The model's draft, bounded and typed — anything else is refused as no draft at all. */
export function parseFeedbackDraft(input: unknown): FeedbackDraft | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as { kind?: unknown; title?: unknown; details?: unknown };
  const kind = typeof raw.kind === "string" && KINDS.has(raw.kind) ? raw.kind : "idea";
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 80) : "";
  const details = typeof raw.details === "string" ? raw.details.trim().slice(0, 4000) : "";
  if (!(title && details)) return undefined;
  return { kind: kind as FeedbackDraft["kind"], title, details };
}

const DIRECTIONS = new Set<Outlook["direction"]>(["bullish", "bearish", "neutral"]);
const MAGNITUDES = new Set<Outlook["magnitude"]>(["slight", "moderate", "strong"]);

/**
 * The model's stated view, bounded and typed — anything else is refused with the field named,
 * same spirit as `parseFeedbackDraft`. The ticker is checked against the same `UNDERLYING_PATTERN`
 * the ticket and the quote routes use, so an OCC option symbol (or anything order-shaped smuggled
 * into the field) is refused as "not an underlying" before it reaches any chain read.
 */
export function parseOutlook(input: unknown): Outlook | { readonly error: string } {
  if (!input || typeof input !== "object") return { error: "an outlook needs an object input" };
  const raw = input as {
    underlying?: unknown;
    direction?: unknown;
    magnitude?: unknown;
    horizonDays?: unknown;
  };
  const symbol = typeof raw.underlying === "string" ? raw.underlying.trim().toUpperCase() : "";
  if (!UNDERLYING_PATTERN.test(symbol)) {
    return { error: "underlying must be a stock ticker like NVDA, never an option symbol" };
  }
  const direction = raw.direction;
  if (typeof direction !== "string" || !DIRECTIONS.has(direction as Outlook["direction"])) {
    return { error: "direction must be one of bullish, bearish, neutral" };
  }
  const magnitude = raw.magnitude;
  if (typeof magnitude !== "string" || !MAGNITUDES.has(magnitude as Outlook["magnitude"])) {
    return { error: "magnitude must be one of slight, moderate, strong" };
  }
  const horizonDays = raw.horizonDays;
  if (typeof horizonDays !== "number" || !Number.isFinite(horizonDays) || horizonDays <= 0) {
    return { error: "horizonDays must be a positive number of calendar days" };
  }
  return {
    symbol,
    direction: direction as Outlook["direction"],
    magnitude: magnitude as Outlook["magnitude"],
    horizonDays,
  };
}

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
  {
    name: "get_structures_for_outlook",
    description:
      "Ranked candidate options structures for a stated market view on one underlying — a directional/neutral outlook in, a ranked list of structures out, each explained by mechanics only (never advice). Read-only; uses the member's own linked account for live chain data.",
    input_schema: {
      type: "object",
      properties: {
        underlying: {
          type: "string",
          description: "The underlying ticker, e.g. NVDA. Never an OCC option symbol.",
        },
        direction: { type: "string", enum: ["bullish", "bearish", "neutral"] },
        magnitude: { type: "string", enum: ["slight", "moderate", "strong"] },
        horizonDays: { type: "number", description: "Calendar days the view is held over." },
      },
      required: ["underlying", "direction", "magnitude", "horizonDays"],
    },
  },
  {
    name: "draft_feedback",
    description:
      "Hand the member a DRAFT feedback filing (bug, feature, or idea) distilled from this whole conversation. Files NOTHING: the rail shows the draft and only the member's own reply sends it. Call it once the member has agreed to report something; then ask them exactly one clarifying question, or tell them to reply 'send' if nothing is missing.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["bug", "feature", "idea"] },
        title: { type: "string", description: "Imperative summary of the ask, max 80 chars." },
        details: {
          type: "string",
          description:
            "What / where in the app / expected vs. actual (bug) or what 'done' looks like (feature, idea), in the member's own words where possible. Facts from this conversation only.",
        },
      },
      required: ["kind", "title", "details"],
    },
  },
] as const;

/** What the tool dispatcher needs to answer honestly — all read accessors, all optional so a
 *  deployment missing a piece degrades to "not available" rather than throwing. */
export interface CompanionDeskDeps {
  readonly snapshotFor: (participantId: string) => ParticipantSnapshot | undefined;
  /** Where a captured draft goes — the chat engine's own handoff hook, never a write. */
  readonly onDraft?: (draft: FeedbackDraft) => void;
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  readonly progression?: ProgressionService;
  /** Rank candidate structures for a stated outlook, through the PARTICIPANT'S OWN linked broker
   *  client — never another member's. Optional, like every other capability here: a deployment
   *  without options data wired degrades to "not available" rather than throwing. */
  readonly rankFor?: (
    participantId: string,
    outlook: Outlook,
  ) => Promise<Recommendation | undefined>;
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

async function structuresResult(
  rankFor: CompanionDeskDeps["rankFor"],
  participantId: string | undefined,
  input: unknown,
): Promise<CompanionToolResult> {
  const parsed = parseOutlook(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (!participantId) return { ok: false, error: "no linked desk" };
  if (!rankFor) {
    return { ok: false, error: "structure recommendations aren't available on this deployment" };
  }
  const recommendation = await rankFor(participantId, parsed);
  if (!recommendation) {
    return { ok: false, error: `couldn't read a live chain for ${parsed.symbol} right now` };
  }
  // The whole object, verbatim — `disclosure` rides along so no rendering can drop it.
  return { ok: true, result: recommendation };
}

/**
 * Run ONE of the five allow-listed tools. Any other name — including anything a compromised or
 * confused model might invent, like `place_order` or `submit_trade` — falls through to the
 * refusal below and touches nothing. `participantId` is the SESSION's own linked desk, resolved
 * upstream (`resolveOwnerId`) — never a client-supplied id, so this can never be pointed at
 * another member's account. `participantId` may be absent (no linked desk yet): the desk lanes
 * then refuse honestly, and only `draft_feedback` — which reads nothing — still answers.
 */
export async function runCompanionTool(
  name: string,
  deps: CompanionDeskDeps,
  participantId: string | undefined,
  input?: unknown,
): Promise<CompanionToolResult> {
  const snapshot = participantId ? deps.snapshotFor(participantId) : undefined;
  switch (name as CompanionToolName) {
    case "draft_feedback": {
      const draft = parseFeedbackDraft(input);
      if (!draft) return { ok: false, error: "a draft needs a kind, a title and details" };
      deps.onDraft?.(draft);
      return {
        ok: true,
        result: {
          captured: true,
          next: "The rail now holds this draft. Ask the member exactly one clarifying question if something material is missing; otherwise tell them to reply 'send'. Their reply files it — nothing is sent yet.",
        },
      };
    }
    case "get_my_positions":
      return positionsResult(snapshot);
    case "get_my_round_trips":
      return participantId
        ? roundTripsResult(snapshot, deps.readTradeActivity, participantId)
        : { ok: false, error: "no linked desk" };
    case "get_my_curriculum_progress":
      return progressionResult(
        deps.progression && participantId ? await deps.progression.view(participantId) : undefined,
      );
    case "get_play_catalog":
      return playCatalogResult(
        deps.progression && participantId ? await deps.progression.view(participantId) : undefined,
      );
    case "get_structures_for_outlook":
      return structuresResult(deps.rankFor, participantId, input);
    default:
      // Structural refusal — there is no branch above that reaches a write, so an unrecognized
      // name (a typo, a hallucination, an adversarial member steering the model) lands here and
      // nowhere else.
      return { ok: false, error: `no such tool: ${name}` };
  }
}
