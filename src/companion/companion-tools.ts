import { lockedOnLadder } from "../domain/progression.js";
import { TRADE_TYPES } from "../domain/trade-types.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import { deskLedger } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { Outlook } from "../options/outlook.js";
import type { Recommendation } from "../options/recommend.js";
import type { FindSimilarFeedback } from "../server/feedback-similar.js";
import type { ParticipantProgression, ProgressionService } from "../server/progression-service.js";
import type { ReadRoadmap } from "../server/roadmap.js";
import { MAX_ISSUES_PER_LOOKUP, type ReadWorkStatus } from "../server/work-status.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";

/**
 * THE COMPANION'S ENTIRE TOOL SURFACE — a CLOSED allow-list of seven read-only lookups plus one
 * hand-off (`draft_feedback`, which files nothing: it hands the rail a draft the member still has
 * to send), and nothing else. This is the structural half of the "never fires an order" invariant (the other
 * half is the system prompt): `runCompanionTool` is a `switch` over eight literal string cases
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
 *
 * The exceptions to "the member's own" are the two SHARED WORK RECORD reads (#3952):
 * `get_work_status` (slice 1 — one named issue or PR on the public repo) and `get_roadmap`
 * (slice 3 — the open plan queue, grouped Now / Next / Later). Both are read-only, both stay
 * inside the invite gate (the chat route is authed-only), and both return only structured fields
 * with every string filtered to trusted authors in `server/work-status.ts` and
 * `server/roadmap.ts`, because on a public repo anyone on the internet can write a title or a
 * comment. `get_roadmap` returns no bodies and no comments at all.
 */

export const COMPANION_TOOL_NAMES = [
  "get_my_positions",
  "get_my_round_trips",
  "get_my_curriculum_progress",
  "get_play_catalog",
  "get_structures_for_outlook",
  "get_work_status",
  "get_roadmap",
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

/** The tools that read no member data — declared even when the session has no linked desk. */
const DESKLESS_TOOLS: ReadonlySet<CompanionToolName> = new Set([
  "get_work_status",
  "get_roadmap",
  "draft_feedback",
]);

/** The tool names one turn declares: every tool for a member with a linked desk, otherwise only
 *  the deskless two. The request's `tools` array (`companion-tool-rounds.ts`) and the unknown-name
 *  refusal both read this, so the refusal never names a tool the turn didn't offer. */
export function declaredToolNames(participantId: string | undefined): readonly CompanionToolName[] {
  return participantId
    ? COMPANION_TOOL_NAMES
    : COMPANION_TOOL_NAMES.filter((n) => DESKLESS_TOOLS.has(n));
}

/** The Anthropic `tools` array — schemas only, no executable reference. */
export const COMPANION_TOOL_DEFS = [
  {
    name: "get_my_positions",
    description:
      "The member's own current holdings on their linked paper account: cash, equity, and one row per open position with symbol, quantity, avgPrice and marketValue. Use it when a question is about what they hold or what a holding is worth now and the MEMBER CONTEXT block doesn't already answer it. Covers only this member's account; returns 'no linked desk' when they have no linked account. Read-only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_my_round_trips",
    description:
      "The member's own closed trades, FIFO-matched into round trips — the 10 most recent, oldest first. Each row: symbol, quantity, entryPrice, exitPrice, realized (P/L in dollars), returnPct, closedAt, and soldToOpen: true on a written (sold-to-open) option contract, where an exit near $0 means the writer kept the premium — read the outcome from realized, never from the price pair. Also returns openLots (lots still open), truncated (true when a stock sale had no visible opening lot, so the share record is a window, not the whole history) and writtenContracts (option contracts read as written — the options form of that caveat). It has no open dates or hold times. Returns 'no linked desk' when the member has no linked account. Read-only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_my_curriculum_progress",
    description:
      "The member's own progress on the trading ladder: wheels (true when training wheels are on, restricting trading to unlocked rungs), points, rank, earnedCount (how many ladder rungs they have earned — a count, not the list), unlocked (the rung codes open to them, e.g. 101, 102), nextUp (the rung code to chase next; absent when nothing is next: a complete ladder, or one not open yet) and ladderGated (present, true, only while the ladder is not open yet: training wheels on and no message to Moneypenny or feedback filing recorded yet, so unlocked holds only rungs already earned). Use it for questions about rank, points or what unlocks next; onboarding steps and filings are in the MEMBER CONTEXT block, not here. Returns an error when no progression data exists for this member. Read-only.",
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
    name: "get_work_status",
    description:
      "Where any issue or pull request on the Skynet Capital build queue stands: state, the member-facing status (the same words as the Feedback badge, or 'Being built — PR #N open'), open and merged PRs that reference it, its quoted title, and a short excerpt of the thread from project members only. For 'where's my feedback?', pass the issue numbers from the MEMBER CONTEXT filings line. Read-only; up to 5 numbers per call.",
    input_schema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          items: { type: "integer" },
          description: "Issue or PR numbers, e.g. [3952]. At most 5.",
        },
      },
      required: ["issues"],
    },
  },
  {
    name: "get_roadmap",
    description:
      "What is coming on the Skynet Capital build queue: openPlans (how many open plans there are), then groups — Now, Next and Later, each with its meaning, its total, and up to 8 of its most recently touched items (number, quoted title, member-facing status, labels, url). Use it for 'what's coming next', 'what's on the roadmap', 'are you building X'. The grouping is SEQUENCING derived from each plan's own labels — never a delivery date, and never a promise that an item ships; say so if the member reads it that way. truncated: true (when present) means the queue outran what one read covers, so every total is a floor, not a count. Returns no issue bodies and no comments. Takes no input; read-only.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "draft_feedback",
    description:
      "Hand the member a DRAFT feedback filing (bug, feature, or idea) distilled from this whole conversation. Files NOTHING: the rail shows the draft and only the member's own reply sends it. Call it once the member has agreed, in their latest message, to report something. Returns captured: true and a status line, plus `similar` open feedback issues when any look like duplicates; returns an error when title or details is missing (a missing or unrecognized kind is drafted as an idea).",
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
  /** Advisory dedup (#1867 slice 1): search currently-open `feedback`-labeled issues for ones a
   *  fresh draft looks like it duplicates. Optional, like every other capability here — without it
   *  `draft_feedback` behaves exactly as before (no `similar` field at all), never a blocker. */
  readonly findSimilarFeedback?: FindSimilarFeedback;
  /** #3952: where any issue stands, read off the public repo with the feedback lane's token.
   *  Optional — without it `get_work_status` says "not available", never guesses. */
  readonly readWorkStatus?: ReadWorkStatus;
  /** #3952 slice 3: what is coming — the open plan queue grouped Now / Next / Later, same token.
   *  Optional — without it `get_roadmap` says "not available", never guesses. */
  readonly readRoadmap?: ReadRoadmap;
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
      // Without this a ladder that hasn't opened (no `nextUp`) reads as a finished one.
      ...(view.ladderGate ? { ladderGated: true } : {}),
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

/** The model's issue list, bounded and typed: positive integers only, at most five. */
export function parseIssueNumbers(input: unknown): readonly number[] | { readonly error: string } {
  const raw = (input as { issues?: unknown } | null | undefined)?.issues;
  const list = Array.isArray(raw) ? raw : typeof raw === "number" ? [raw] : [];
  const numbers = list.filter((n): n is number => Number.isInteger(n) && n > 0 && n < 1e7);
  if (numbers.length === 0) {
    return {
      error:
        "name at least one issue number — for the member's own filings, use the numbers in the MEMBER CONTEXT",
    };
  }
  return [...new Set(numbers)].slice(0, MAX_ISSUES_PER_LOOKUP);
}

async function workStatusResult(
  read: ReadWorkStatus | undefined,
  input: unknown,
): Promise<CompanionToolResult> {
  const parsed = parseIssueNumbers(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (!read) {
    return {
      ok: false,
      error: "issue status isn't available on this deployment",
    };
  }
  return { ok: true, result: { issues: await read(parsed) } };
}

async function roadmapResult(read: ReadRoadmap | undefined): Promise<CompanionToolResult> {
  if (!read) return { ok: false, error: "the roadmap isn't available on this deployment" };
  const roadmap = await read();
  // A failed read is an honest refusal, never a short roadmap: "available: false" would read to
  // the model as "nothing is planned" (#3952 criterion 4).
  if (!roadmap.available) return { ok: false, error: "couldn't read the build queue right now" };
  return { ok: true, result: roadmap };
}

/**
 * Run ONE of the eight allow-listed tools. Any other name — including anything a compromised or
 * confused model might invent, like `place_order` or `submit_trade` — falls through to the
 * refusal below and touches nothing. `participantId` is the SESSION's own linked desk, resolved
 * upstream (`resolveOwnerId`) — never a client-supplied id, so this can never be pointed at
 * another member's account. `participantId` may be absent (no linked desk yet): the desk lanes
 * then refuse honestly, and only `draft_feedback`, `get_work_status` and `get_roadmap` — which
 * read no member data, only the public issue queue — still answer.
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
      if (!draft) return { ok: false, error: "a draft needs a title and details" };
      deps.onDraft?.(draft);
      // Advisory only (#1867 slice 1) — a search failure or empty match list never blocks or
      // reshapes the draft; `send` still always files it unmodified. `similar` is left OFF the
      // result entirely when nothing clears the threshold, rather than an empty array, so a
      // deployment without the rail wired for it (slice 2) sees exactly today's shape.
      const similar = (await deps.findSimilarFeedback?.(draft).catch(() => [])) ?? [];
      return {
        ok: true,
        result: {
          captured: true,
          status: "held in the rail, not sent — the member's own reply 'send' files it",
          ...(similar.length > 0 ? { similar } : {}),
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
    case "get_work_status":
      return workStatusResult(deps.readWorkStatus, input);
    case "get_roadmap":
      return roadmapResult(deps.readRoadmap);
    default:
      // Structural refusal — there is no branch above that reaches a write, so an unrecognized
      // name (a typo, a hallucination, an adversarial member steering the model) lands here and
      // nowhere else. Naming the declared tools lets a typo recover; the list is this turn's own
      // `tools` array (`declaredToolNames`), so it never offers a tool the turn didn't declare.
      return {
        ok: false,
        error: `no such tool: ${name} (the declared tools are ${declaredToolNames(participantId).join(", ")})`,
      };
  }
}
