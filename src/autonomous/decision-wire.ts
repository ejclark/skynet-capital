import { isRecord } from "../storage/parse-guards.js";
import type { DecisionRecord } from "./decision-record.js";
import {
  parseGuardRefusal,
  parseIntentOutcome,
  parseMarketContext,
  parseOrderIntent,
} from "./decision-wire-parts.js";

/**
 * The bots→app decision-replication wire format (`docs/plans/where-are-we-documenting-*.md` PR 4 /
 * issue #2287) — the cursor-based counterpart to `insight-record.ts`'s `parseInsightRecord`.
 *
 * The `bots` process already polls `GET /controls` every 30s (`bot-controls-client.ts`); that
 * response now carries an additive `decisionsCursor` field — the app's own per-persona high-water
 * mark (`DecisionDb.maxAtAll()`, read fresh off its own store, never a separate persisted cursor).
 * On each poll, `bots` sends every LOCAL row above that mark, per persona, bounded per batch, to
 * `POST /decisions` on the same bridge (`decision-replication-client.ts`). A dropped batch simply
 * resends on the next poll — the app's own high-water mark only advances once a batch lands, so
 * this is naturally idempotent and self-healing, with no receiver-side dedup logic needed beyond
 * `DecisionDb.record()`'s own `UNIQUE(persona_id, at)`.
 *
 * `kind: "decision.v1"` is versioned from day one: the two apps can run different commits after
 * the deploy split (bots ≤ app always — the listener side must ship first), so a future wire
 * change adds a new kind rather than silently reinterpreting this one.
 */

export const DECISION_BATCH_KIND = "decision.v1";

/** Bounded per POST — matches `DecisionDb`'s own `MAX_PAGE`, so one lagging persona can never make
 *  a single replication call unboundedly large. */
export const MAX_DECISION_BATCH = 100;

const MAX_PERSONA_ID_LENGTH = 128;

/**
 * Validates one `DecisionRecord` crossing the bridge. Total and defensive: a malformed, truncated,
 * or hostile payload can only ever produce `undefined` — never a throw, and never a partially
 * trusted record (every required field must be present and well-typed, or the whole record is
 * rejected — no silent coercion of a missing array to `[]`).
 */
export function parseDecisionRecord(value: unknown): DecisionRecord | undefined {
  if (!isRecord(value)) return undefined;
  const { at, personaId, mode, rawIntents, guardedIntents, outcomes } = value;
  if (typeof at !== "number" || !Number.isFinite(at)) return undefined;
  if (typeof personaId !== "string" || personaId.length === 0) return undefined;
  if (personaId.length > MAX_PERSONA_ID_LENGTH) return undefined;
  if (mode !== "observe" && mode !== "live") return undefined;
  if (!(Array.isArray(rawIntents) && Array.isArray(guardedIntents) && Array.isArray(outcomes))) {
    return undefined;
  }

  const parsedRawIntents = rawIntents.map(parseOrderIntent);
  const parsedGuardedIntents = guardedIntents.map(parseOrderIntent);
  const parsedOutcomes = outcomes.map(parseIntentOutcome);
  if (
    parsedRawIntents.some((i) => !i) ||
    parsedGuardedIntents.some((i) => !i) ||
    parsedOutcomes.some((o) => !o)
  ) {
    return undefined; // fail closed on any one malformed element, rather than silently dropping it
  }

  const context = parseMarketContext(value.context);
  const refusals = Array.isArray(value.refusals)
    ? value.refusals.map(parseGuardRefusal)
    : undefined;
  if (refusals?.some((r) => !r)) return undefined;

  return {
    at,
    personaId,
    mode,
    rawIntents: parsedRawIntents as DecisionRecord["rawIntents"],
    guardedIntents: parsedGuardedIntents as DecisionRecord["guardedIntents"],
    outcomes: parsedOutcomes as DecisionRecord["outcomes"],
    ...(typeof value.halted === "string" ? { halted: value.halted } : {}),
    ...(context ? { context } : {}),
    ...(refusals ? { refusals: refusals as DecisionRecord["refusals"] } : {}),
  };
}

export interface DecisionBatch {
  readonly personaId: string;
  readonly records: readonly DecisionRecord[];
}

/**
 * Validates the whole `POST /decisions` body: `{ kind: "decision.v1", personaId, records }`, every
 * record belonging to the SAME persona the envelope names (defense against a malformed sender
 * mixing personas into one batch), bounded to `MAX_DECISION_BATCH`.
 */
export function parseDecisionBatch(value: unknown): DecisionBatch | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind !== DECISION_BATCH_KIND) return undefined;
  const { personaId, records } = value;
  if (typeof personaId !== "string" || personaId.length === 0) return undefined;
  if (personaId.length > MAX_PERSONA_ID_LENGTH) return undefined;
  if (!Array.isArray(records) || records.length === 0 || records.length > MAX_DECISION_BATCH) {
    return undefined;
  }
  const parsed = records.map(parseDecisionRecord);
  if (parsed.some((r) => !r || r.personaId !== personaId)) return undefined;
  return { personaId, records: parsed as DecisionRecord[] };
}

/** `GET /controls`'s additive `decisionsCursor` field — a plain `{ personaId: epochMs }` map, the
 *  app's own per-persona high-water mark. Absent/malformed parses to `{}`, never a throw — a torn
 *  or old-shaped response must fail open to "replicate everything," never crash the poll it rides. */
export function parseDecisionsCursor(value: unknown): Readonly<Record<string, number>> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [personaId, at] of Object.entries(value)) {
    if (typeof at === "number" && Number.isFinite(at)) out[personaId] = at;
  }
  return out;
}
