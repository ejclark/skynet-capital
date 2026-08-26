/**
 * The interim insight-bridge wire format (`docs/plans/trade-insights-loop.md`, slice 2).
 *
 * `bots` has zero persistent storage in prod (a Fly Volume attaches to a single machine, and
 * `app`/`bots` run as separate machines — see `fly.toml` `[mounts]`). Until slice 4's dedicated
 * SQLite volume exists, `bots` ships every retrospective/insight record to `app` (which already
 * has one) over an internal-only HTTP listener (`insights-listener.ts`), reached over Fly's
 * private 6PN network — never the public `[http_service]` port. `app` appends it to a JSONL file
 * on the mounted volume, mirroring the `DecisionRecord`/`JsonlAuditStore` pattern already used
 * for the autonomy audit trail.
 *
 * Deliberately generic: slice 1 (the structured retrospective — entry thesis, exit reason,
 * realized outcome, sentiment delta) hasn't landed yet, so `kind`/`data` stay an open envelope
 * rather than guessing its final shape. `at`/`personaId` mirror `DecisionRecord` so the two
 * audit trails read the same at a glance.
 */

/** Generous but bounded — this is a small structured note, never a blob. */
export const MAX_INSIGHT_KIND_LENGTH = 64;
export const MAX_INSIGHT_PERSONA_ID_LENGTH = 128;

export interface InsightRecord {
  /** Epoch ms the insight was captured. */
  readonly at: number;
  readonly personaId: string;
  /** Open vocabulary (e.g. "retrospective", "observation") — future slices define the values. */
  readonly kind: string;
  /** Free-form structured payload specific to `kind`. Never a nested array/object graph deep
   * enough to matter — the whole record is bounded by the listener's request-body cap. */
  readonly data: Readonly<Record<string, unknown>>;
}

/**
 * The shared-secret header the bridge client and listener both use. Defense-in-depth only — the
 * listener's port is never declared in `fly.toml`'s `[http_service]`, so it isn't reachable from
 * the public internet at all (verified against Fly's private-networking docs; see
 * `insights-listener.ts`). The real boundary is the org's private 6PN network — which every app
 * in the org sits inside, `skynet-capital-bots` included after the deploy split — and this
 * constant is repo-public. That's fine: it is basic input hygiene for a network listener parsing
 * JSON, not a credential. Because the two apps can run different commits after the split, treat
 * the header name, routes, and port as a frozen cross-app contract: evolve the wire
 * expand/contract (listener-first), never rename any of the three in a single commit.
 */
export const INSIGHTS_BRIDGE_SECRET_HEADER = "x-skynet-insights-secret";
export const INSIGHTS_BRIDGE_SHARED_SECRET = "skynet-insights-bridge-v1";

/** One bounded-fetch budget for every bridge client — a slow bridge must never stall a trade loop. */
export const BRIDGE_REQUEST_TIMEOUT_MS = 2_000;

/** A plain JSON object — not an array, not null, not a primitive. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates an arbitrary parsed-JSON value as an `InsightRecord` before it's trusted anywhere
 * (written to disk, echoed back). Rejects anything that doesn't match — never throws, so a
 * malformed/malicious payload can only ever fail closed as "invalid," not crash the process
 * parsing it.
 */
export function parseInsightRecord(value: unknown): InsightRecord | undefined {
  if (!isPlainObject(value)) return undefined;
  const { at, personaId, kind, data } = value;
  if (typeof at !== "number" || !Number.isFinite(at)) return undefined;
  if (typeof personaId !== "string" || personaId.length === 0) return undefined;
  if (personaId.length > MAX_INSIGHT_PERSONA_ID_LENGTH) return undefined;
  if (typeof kind !== "string" || kind.length === 0) return undefined;
  if (kind.length > MAX_INSIGHT_KIND_LENGTH) return undefined;
  if (!isPlainObject(data)) return undefined;
  return { at, personaId, kind, data };
}
