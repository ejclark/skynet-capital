import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { CONTROLS_BRIDGE_PATH, type ControlsState } from "../autonomous/bot-controls.js";
import {
  BOT_CREDENTIALS_ID_PARAM,
  BOT_CREDENTIALS_PATH,
  BOT_CREDENTIALS_SECRET_HEADER,
} from "../autonomous/bot-credentials-wire.js";
import { type CondScoutSnapshot, parseCondScoutSnapshot } from "../autonomous/cond-scout-wire.js";
import { type ControlsPollReport, controlsPollReport } from "../autonomous/controls-poll-wire.js";
import { type DecisionBatch, parseDecisionBatch } from "../autonomous/decision-wire.js";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
  type InsightRecord,
  parseInsightRecord,
} from "../autonomous/insight-record.js";
import type { SubscriptionsSnapshot } from "../autonomous/subscriptions-wire.js";
import type { BotCredentials } from "./bot-credentials-gate.js";
import { handleBridgePost, readBoundedBody, respond } from "./bridge-http.js";

/** The bots→app decision-replication bridge route (`decision-wire.ts`). */
const DECISIONS_PATH = "/decisions";
const COND_SCOUT_PATH = "/cond-scout";

/**
 * `/decisions` is a DIFFERENT payload class from `/insights` and needs its own cap — a
 * `DecisionRecord` carries the full `MarketContext` it reasoned over (quotes, momentum, sentiment
 * across every symbol the persona watches) plus its raw/guarded intents and outcomes, easily
 * multiple KB each, and a batch carries up to `MAX_DECISION_BATCH` (100) of them. Found live in
 * prod (2026-09-23): every non-trivial batch — the ascending replication leg's own catch-up step,
 * and the newest-rows preview leg added in #3581 — was silently rejected 413 against the shared
 * 16 KB cap, which is sized for a single few-hundred-byte insight, not a hundred-record decision
 * batch. This is almost certainly the real reason replication ever looked "stuck": a batch this
 * size has likely never once fit under 16 KB. 4 MB is generous headroom for a realistic batch
 * while still bounding a hostile/broken caller, the same reasoning `MAX_BODY_BYTES` (`bridge-http.ts`) states
 * for its own (much smaller) payload class.
 */
const MAX_DECISIONS_BODY_BYTES = 4 * 1024 * 1024;
/** 50 retros + 20 open probes serialize to well under this; the cap is the bound, not a target. */
const MAX_COND_SCOUT_BODY_BYTES = 512 * 1024;

export interface InsightsListenerConfig {
  readonly record: (entry: InsightRecord) => Promise<void>;
  /**
   * Current bot-controls state for `GET /controls` — the `bots` process polls it so the owner's
   * Mission Control toggles reach the runner without a restart. Omit to 404 the route (e.g. a
   * deployment with no controls store).
   */
  readonly controls?: () => ControlsState;
  /**
   * The app's own per-persona high-water mark (`DecisionDb.maxAtAll()`), folded into every
   * `GET /controls` response as an additive `decisionsCursor` field — the cursor
   * `decision-replication-client.ts` reads on the `bots` side to know what it hasn't sent yet.
   * Omit to leave the field off entirely (a deployment with no app-side decision store).
   */
  readonly decisionsCursor?: () => Record<string, number>;
  /**
   * The Playbook Store's saved subscriptions, folded into every `GET /controls` response as an
   * additive `subscriptions` field (`subscriptions-wire.ts`, issue #3595) — the ONLY channel by
   * which a member's subscribe/allocate/toggle reaches a live bot, since the two apps keep two
   * different files and the bots one is never written. Omit to leave the field off entirely, the
   * same posture as `decisionsCursor` above.
   */
  readonly subscriptions?: () => SubscriptionsSnapshot;
  /**
   * `POST /decisions` — the bots→app decision-replication bridge (PR 4). Omit to 404 the route,
   * same posture as every other optional bridge surface here.
   */
  /** `POST /cond-scout` — COND-SCOUT's ledger snapshot (#3651). Omit to 404 the route. */
  readonly condScout?: { readonly accept: (snapshot: CondScoutSnapshot) => void };
  readonly decisions?: {
    readonly recordBatch: (batch: DecisionBatch) => void;
  };
  /**
   * Fires on every AUTHENTICATED `GET /controls` poll, regardless of whether `controls` above is
   * configured — the poll itself, not its payload, is the ops-status panel's credential-free
   * proxy for "is the bots process alive and reaching this one", and the report it carries
   * (`controls-poll-wire.ts`) is that process's own word on which commit it is running.
   * Best-effort: never awaited, never allowed to fail the response it rides along with.
   */
  readonly onControlsPoll?: (report: ControlsPollReport) => void;
  /**
   * `GET /bot-credentials?id=<personaId>` — the one place a live Alpaca secret crosses this
   * bridge. Deliberately a SEPARATE, real, Eric-provisioned secret from `INSIGHTS_BRIDGE_SHARED_SECRET`
   * (which is a repo-public literal, documented as "not a credential" — an acceptable bar for
   * booleans, not for this). Omit to 404 the route entirely — a deployment with no
   * `SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET` set gets no route, not a route with no auth.
   */
  readonly botCredentials?: {
    readonly secret: string;
    readonly resolve: (personaId: string) => BotCredentials | undefined;
  };
}

/**
 * Resolves the port the insights listener binds to. **Must never collide with `[http_service]
 * internal_port` (8787, `fly.toml`)** — that's the whole isolation mechanism this listener relies
 * on. Defaults to 8788; overridable via `SKYNET_INSIGHTS_BRIDGE_PORT` for local dev port clashes.
 */
export function resolveInsightsBridgePort(env: NodeJS.ProcessEnv): number {
  const candidate = env.SKYNET_INSIGHTS_BRIDGE_PORT;
  const parsed = candidate ? Number(candidate) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8788;
}

/**
 * The internal-only insight bridge (`docs/plans/trade-insights-loop.md`, slice 2) — the `app`
 * process's side of the `bots` → `app` insight relay. Bind this to a port deliberately NOT
 * declared in `fly.toml`'s `[http_service]`: Fly's public Anycast proxy only forwards traffic to
 * the port(s) named there, so an undeclared port is unreachable from the public internet. The
 * private boundary is the ORG-WIDE 6PN network, not the app: every Fly app in this org (the
 * dashboard, `skynet-capital-bots` after the deploy split, anything created later) can reach this
 * port (verified against fly.io/docs/networking/private-networking/). The shared-secret header
 * below is defense-in-depth on top of that, never a substitute for it — and after the split this
 * wire is a CROSS-APP protocol: the two apps can run different commits, so evolve it
 * expand/contract (new field/route lands listener-first; see fly.bots.toml's contract comments).
 *
 * Every branch here is wrapped so a malformed/oversized/hostile payload can only ever produce an
 * HTTP error response — never an uncaught exception. This process ALSO serves the public
 * dashboard (a separate `http.Server`, same Node process): a crash here is a real production
 * outage, not a quietly dropped log line, so failing closed with a response is not optional.
 */
export function createInsightsListener(config: InsightsListenerConfig): Server {
  return createServer((req, res) => {
    void handleInsightPost(req, res, config).catch((error: unknown) => {
      // Last-resort net: handleInsightPost() already catches everything it can reason about, but nothing
      // here may ever escape to become an uncaught exception on the shared process. `process
      // .emitWarning`, not `console` — this is library code, and the repo reserves console for
      // scripts (see jsonl-store.ts).
      process.emitWarning(`[insights-listener] unhandled error: ${String(error)}`);
      if (!res.headersSent) {
        respond(res, 500, { error: "internal error" });
      } else {
        res.end();
      }
    });
  });
}

async function handleInsightPost(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): Promise<void> {
  const path = (req.url ?? "/").split("?")[0];

  if (path === CONTROLS_BRIDGE_PATH) {
    handleControlsGet(req, res, config);
    return;
  }

  if (path === BOT_CREDENTIALS_PATH) {
    handleBotCredentialsGet(req, res, config);
    return;
  }

  if (path === DECISIONS_PATH) {
    await handleDecisionsPost(req, res, config);
    return;
  }

  if (path === COND_SCOUT_PATH) {
    await handleCondScoutPost(req, res, config);
    return;
  }

  if (path !== "/insights") {
    respond(res, 404, { error: "not found" });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    respond(res, 405, { error: "method not allowed" });
    return;
  }
  if (req.headers[INSIGHTS_BRIDGE_SECRET_HEADER] !== INSIGHTS_BRIDGE_SHARED_SECRET) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }

  const bodyResult = await readBoundedBody(req);
  if (!bodyResult.ok) {
    // A mid-stream socket error means the connection is very likely already unusable — writing
    // here is best-effort (wrapped so a write failure can't become an uncaught exception), never
    // load-bearing for correctness.
    try {
      respond(res, bodyResult.reason === "too-large" ? 413 : 400, { error: bodyResult.reason });
    } catch {
      /* socket already gone — nothing left to respond to */
    }
    return;
  }
  const { body } = bodyResult;

  let parsed: unknown;
  try {
    parsed = body.length > 0 ? JSON.parse(body) : undefined;
  } catch {
    respond(res, 400, { error: "malformed json" });
    return;
  }

  const record = parseInsightRecord(parsed);
  if (!record) {
    respond(res, 400, { error: "invalid insight record" });
    return;
  }

  try {
    await config.record(record);
  } catch (error) {
    process.emitWarning(`[insights-listener] write failed: ${String(error)}`);
    respond(res, 502, { error: "write failed" });
    return;
  }

  respond(res, 200, { ok: true });
}

/** `GET /controls` — the runner's Mission Control poll. Same trust boundary as `/insights`:
 *  the 6PN-only port plus the shared-secret header as defense-in-depth. Read-only. */
function handleControlsGet(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): void {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    respond(res, 405, { error: "method not allowed" });
    return;
  }
  if (req.headers[INSIGHTS_BRIDGE_SECRET_HEADER] !== INSIGHTS_BRIDGE_SHARED_SECRET) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }
  // A genuine, authenticated poll — record it before the 404 branch below, since "the bridge is
  // configured but has nothing to say" is still proof the bots process reached this one.
  try {
    config.onControlsPoll?.(controlsPollReport(req.headers));
  } catch {
    /* never let an observability hook fail the poll it's observing */
  }
  if (!config.controls) {
    respond(res, 404, { error: "controls not configured" });
    return;
  }
  try {
    const state = config.controls() as unknown as Record<string, unknown>;
    const decisionsCursor = config.decisionsCursor?.();
    const subscriptions = config.subscriptions?.();
    respond(res, 200, {
      ...state,
      ...(decisionsCursor ? { decisionsCursor } : {}),
      ...(subscriptions ? { subscriptions } : {}),
    });
  } catch (error) {
    process.emitWarning(`[insights-listener] controls read failed: ${String(error)}`);
    respond(res, 502, { error: "read failed" });
  }
}

/** `POST /decisions` — the bots→app decision-replication bridge (`decision-wire.ts`). Same trust
 *  boundary and body-size cap as `/insights`; a malformed/oversized/unauthenticated body can only
 *  ever produce an HTTP error response. */
function handleDecisionsPost(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): Promise<void> {
  const decisions = config.decisions;
  return handleBridgePost(req, res, {
    name: "decisions",
    maxBytes: MAX_DECISIONS_BODY_BYTES,
    parse: parseDecisionBatch,
    invalid: "invalid decision batch",
    ...(decisions
      ? {
          accept: (batch: DecisionBatch) => {
            decisions.recordBatch(batch);
            return { count: batch.records.length };
          },
        }
      : {}),
  });
}

/** `POST /cond-scout` — COND-SCOUT's ledger snapshot (`cond-scout-wire.ts`, #3651 slice 7a). Same
 *  trust boundary and handling as `/decisions`; the snapshot replaces the last one whole. */
function handleCondScoutPost(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): Promise<void> {
  const condScout = config.condScout;
  return handleBridgePost(req, res, {
    name: "cond-scout",
    maxBytes: MAX_COND_SCOUT_BODY_BYTES,
    parse: parseCondScoutSnapshot,
    invalid: "invalid cond-scout snapshot",
    ...(condScout
      ? {
          accept: (snapshot: CondScoutSnapshot) => {
            condScout.accept(snapshot);
            return { count: snapshot.open.length + snapshot.retros.length };
          },
        }
      : {}),
  });
}

/** `GET /bot-credentials?id=<personaId>` — never logs, never echoes anything BUT the requested
 *  bot's own credential shape. Its own secret, checked BEFORE the shared bridge header — a
 *  deployment that hasn't provisioned `SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET` refuses every request
 *  here even if it happens to also know the (repo-public) shared one. */
function handleBotCredentialsGet(
  req: IncomingMessage,
  res: ServerResponse,
  config: InsightsListenerConfig,
): void {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    respond(res, 405, { error: "method not allowed" });
    return;
  }
  if (!config.botCredentials) {
    respond(res, 404, { error: "not found" });
    return;
  }
  if (req.headers[BOT_CREDENTIALS_SECRET_HEADER] !== config.botCredentials.secret) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }
  const personaId = new URL(req.url ?? "/", "http://internal").searchParams.get(
    BOT_CREDENTIALS_ID_PARAM,
  );
  if (!personaId) {
    respond(res, 400, { error: "id is required" });
    return;
  }
  let credentials: BotCredentials | undefined;
  try {
    credentials = config.botCredentials.resolve(personaId);
  } catch (error) {
    process.emitWarning(`[insights-listener] bot-credentials resolve failed: ${String(error)}`);
    respond(res, 502, { error: "resolve failed" });
    return;
  }
  if (!credentials) {
    respond(res, 404, { error: "no such bot" });
    return;
  }
  respond(res, 200, { ...credentials });
}
