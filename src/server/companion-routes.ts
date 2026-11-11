import type { IncomingMessage, ServerResponse } from "node:http";
import type { CompanionMessage } from "../companion/companion-chat.js";
import { memberContext } from "../companion/companion-context.js";
import { describeHolding } from "../companion/companion-holding.js";
import {
  COMPANION_MODEL_CALLS_MAX,
  COMPANION_THROTTLE_MAX,
  COMPANION_THROTTLE_WINDOW_MS,
} from "../companion/companion-limits.js";
import { describeOnScreen, parsePageKeys } from "../companion/companion-on-screen.js";
import { describePage, pagePath, pageSymbol } from "../companion/companion-page.js";
import { COMPANION_DISCLOSURE, FIRST_TRADE_TOUR } from "../companion/companion-system-prompt.js";
import { editions, editionView } from "../domain/edition.js";
import { regularSessionOpen } from "../domain/market-session.js";
import type { Session } from "./auth/session.js";
import { companionConvictionsFor } from "./companion-convictions-port.js";
import { recordFirstMessageSafely } from "./companion-message-log.js";
import { SCREENSHOTS_PATH, serveCompanionScreenshots } from "./companion-screenshot-routes.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { onboardingView } from "./onboarding-api-routes.js";
import { describeOwnerQueue, type OwnerQueue, type ReadOwnerQueue } from "./owner-queue.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import { openSseStream, sseFrame } from "./sse.js";

/**
 * THE COMPANION'S HTTP SURFACE — three endpoints (plus the chat screenshot pair, served from
 * `companion-screenshot-routes.ts` behind the same session check, #6007), all gated on the SAME `Session` every
 * other member-only route checks upstream (`gateRequest` in `dashboard-auth-gate.ts`, wired by
 * the caller before this file ever runs):
 *
 *   GET  /api/companion       → { enabled } — whether `ANTHROPIC_API_KEY` is set, so the client
 *                                can render "not switched on yet" instead of a dead input box.
 *   POST /api/companion/chat  → the turn, streamed back over SSE (`delta`/`done`/`error` events).
 *   POST /api/companion/ack   → records the ladder gate's own evidence: a real message reached
 *                                the rail. Deliberately independent of `/chat` — a message can be
 *                                routed to a scripted reply, or straight into a feedback draft,
 *                                without ever calling the model, and it should still count.
 *
 * THE AUTH INVARIANT THIS FILE ENFORCES: `!session` returns `false` — the route doesn't exist —
 * for BOTH endpoints, before anything else runs. `dashboard-server.ts` reaches this file only
 * after `gateRequest`, which already 302s/401s an unauthenticated visitor before a `session`
 * value even exists to check; this second check is the belt for the legacy shared-password mode,
 * where `gateRequest` can return `{handled:false, session: undefined}` for a visitor who is
 * merely past `?key=`, not a signed-in member. The companion's tools resolve a member's OWN desk
 * (`resolveOwnerId`), so "authed member" is the bar here, not "any request that reached this far."
 */

const CHAT_BODY_CAP_BYTES = 200_000;

// Companion-specific burst throttle — a conversation is several turns, so looser than a one-shot
// submission cap. Same shape as the feedback coach's (`feedback-coach.ts`'s `coachThrottled`).
const hits = new Map<string, number[]>();
function throttled(
  key: string,
  now = Date.now(),
  windowMs = COMPANION_THROTTLE_WINDOW_MS,
  max = COMPANION_THROTTLE_MAX,
): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

// The model-call budget (red-team A6): every billed call — tool round or the streamed reply —
// counts here, in the same window as the request throttle, so a turn's 4 calls cost 4.
const modelCalls = new Map<string, number[]>();
function modelCallAllowed(
  key: string,
  now = Date.now(),
  windowMs = COMPANION_THROTTLE_WINDOW_MS,
  max = COMPANION_MODEL_CALLS_MAX,
): boolean {
  const recent = (modelCalls.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    modelCalls.set(key, recent);
    return false;
  }
  recent.push(now);
  modelCalls.set(key, recent);
  return true;
}

/** Never model- or client-trusted beyond shape: role must be one of the two literals, content a
 *  string. Length/round bounds are enforced downstream in `companion-chat.ts`. */
function parseMessages(body: Record<string, unknown> | undefined): CompanionMessage[] {
  const raw = body?.messages;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is CompanionMessage =>
      !!m &&
      typeof m === "object" &&
      ((m as CompanionMessage).role === "user" || (m as CompanionMessage).role === "assistant") &&
      typeof (m as CompanionMessage).content === "string",
  );
}

/** `{ enabled }` plus the two client-facing constants a chat UI needs verbatim rather than
 *  duplicating: the standing disclosure footer, and the guided first-trade tour's steps. */
function serveCompanionIndex(res: ServerResponse, config: DashboardServerConfig): void {
  sendJson(res, 200, {
    enabled: Boolean(config.companion),
    disclosure: COMPANION_DISCLOSURE,
    firstTradeTour: FIRST_TRADE_TOUR,
  });
}

/** The member's live context for this turn — the same reads the Onboarding and Feedback pages
 *  make, folded into a few lines for the volatile half of the prompt. Any read failing degrades
 *  to "no context" rather than failing the turn: she answers from the cached help desk instead. */
async function memberContextFor(
  config: DashboardServerConfig,
  session: Session,
  page?: string,
  holding?: string,
  onScreen?: string,
): Promise<string | undefined> {
  try {
    // The owner desk (the Moneypenny operator plan): only the server's own owner check turns it
    // on — nothing in the request or the prompt can — and a slow or failed read drops the line,
    // never the turn.
    const owner = config.isOwnerEmail?.(session.email) === true;
    const [onboarding, filings, ownerQueue] = await Promise.all([
      onboardingView(config, session),
      config.readFeedback ? config.readFeedback(opaqueMemberId(session.email)) : [],
      owner && config.readOwnerQueue ? ownerQueueWithin(config.readOwnerQueue) : undefined,
    ]);
    return memberContext({
      now: new Date(),
      onboarding,
      filings: [...filings]
        .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
        .map((f) => ({ issueNumber: f.issueNumber, title: f.title, filedAt: f.filedAt })),
      marketOpen: regularSessionOpen(),
      ...(page ? { page } : {}),
      ...(holding ? { holding } : {}),
      ...(onScreen ? { onScreen } : {}),
      ...(ownerQueue ? { ownerDesk: describeOwnerQueue(ownerQueue) } : {}),
    });
  } catch {
    return undefined;
  }
}

const OWNER_QUEUE_WAIT_MS = 1_500;

/** The owner queue, or `undefined` if it fails or has not answered in a second and a half — the
 *  turn never waits on GitHub longer than that. The timer is cleared so it never holds the loop. */
async function ownerQueueWithin(read: ReadOwnerQueue): Promise<OwnerQueue | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((ok) => {
    timer = setTimeout(() => ok(undefined), OWNER_QUEUE_WAIT_MS);
  });
  try {
    return await Promise.race([read().catch(() => undefined), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** The landing page's items, by key (#7167 slice 1): only asked from `/`, and only the keys the
 *  server's own edition holds (`companion-on-screen.ts`). A failed edition read adds nothing. */
function landingOnScreen(page: unknown, keys: unknown): string | undefined {
  if (pagePath(page) !== "/") return undefined;
  const parsed = parsePageKeys(keys);
  if (!parsed) return undefined;
  try {
    return describeOnScreen(parsed, editionView(editions(), new Date(), () => undefined).edition);
  } catch {
    return undefined;
  }
}

async function serveChat(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session,
): Promise<void> {
  if (!config.companion) {
    sendJson(res, 200, { ok: false, error: "The companion isn't switched on yet." });
    return;
  }
  if (throttled(session.email)) {
    sendJson(res, 429, { ok: false, error: "Lots of chatting just now — give it a few minutes." });
    return;
  }
  const raw = await readJsonPost(req, res, CHAT_BODY_CAP_BYTES);
  if (raw === undefined) return; // readJsonPost already answered (405/415/413)
  const body = parseJsonRecord(raw);
  const messages = parseMessages(body);
  if (messages.length === 0) {
    sendJson(res, 400, { ok: false, error: "say something first" });
    return;
  }
  // The session's OWN linked desk, resolved server-side exactly like every trade surface
  // (`plays-api-routes.ts`) — never a client-supplied id, so a tool call can never be pointed at
  // another member's account.
  const participantId = resolveCurrentId(session, config.resolveOwnerId);
  // The page they asked from (#2224 shape 2), mapped onto fixed words — the raw path never
  // reaches the prompt (`companion-page.ts`).
  // …and, when that page names a symbol, what they hold on it — read from the same desk snapshot
  // her `get_my_positions` tool reads, for the session's own participant only (slice 2).
  const desk = participantId
    ? config.hub.getState().participants.find((p) => p.id === participantId)
    : undefined;
  const holding = describeHolding(pageSymbol(body?.page), desk);
  const onScreen = landingOnScreen(body?.page, body?.keys);
  const context = await memberContextFor(
    config,
    session,
    describePage(body?.page),
    holding,
    onScreen,
  );

  openSseStream(res);
  let seq = 0;
  await config.companion(
    {
      messages,
      ...(participantId ? { participantId } : {}),
      ...(context ? { context } : {}),
      convictions: companionConvictionsFor(config, session),
    },
    {
      onText: (chunk) => {
        res.write(sseFrame(JSON.stringify({ text: chunk }), "delta", seq++));
      },
      onDone: () => {
        res.write(sseFrame("{}", "done", seq++));
        res.end();
      },
      // `refused` rides the frame only when set (#6214) — the rail drops a declined partial line.
      onError: (message, detail) => {
        const frame = detail?.refused ? { error: message, refused: true } : { error: message };
        res.write(sseFrame(JSON.stringify(frame), "error", seq++));
        res.end();
      },
      // A drafted filing for the rail to hold — the member's reply there is what files it.
      onHandoff: (draft) => {
        res.write(sseFrame(JSON.stringify(draft), "handoff", seq++));
      },
      // A drafted view's card (#5482 criterion 9) — the member's tap there is what saves it.
      onConvictionDraft: (drafted) => {
        res.write(sseFrame(JSON.stringify(drafted), "conviction", seq++));
      },
      // A drafted research question — the member's tap there is what puts it on the research list.
      onResearchAskDraft: (draft) => {
        res.write(sseFrame(JSON.stringify(draft), "research-ask", seq++));
      },
      budget: () => modelCallAllowed(session.email),
    },
  );
}

/** Record that a real message reached the rail — independent of whether it triggered a live
 *  reply, so a scripted-only conversation still opens the ladder. Never checks `config.companion`:
 *  usage of the feature, not of the live model, is the bar. */
async function serveMessageAck(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session,
): Promise<void> {
  await recordFirstMessageSafely(config, opaqueMemberId(session.email));
  sendJson(res, 200, { ok: true });
}

/** Handle `/api/companion*`. Returns `false` (route doesn't exist) for anyone without a signed-in
 *  `Session` — see the file header for why that's the bar, not merely "past the auth gate." */
export async function serveCompanionApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  const screenshots = path === SCREENSHOTS_PATH || path.startsWith(`${SCREENSHOTS_PATH}/`);
  if (
    !screenshots &&
    path !== "/api/companion" &&
    path !== "/api/companion/chat" &&
    path !== "/api/companion/ack"
  )
    return false;
  if (!session) return false;
  if (screenshots) {
    const store = config.companionScreenshots;
    const member = opaqueMemberId(session.email);
    return serveCompanionScreenshots(req, res, path, store, member, config.logLine);
  }
  if (path === "/api/companion" && (req.method ?? "GET") === "GET") {
    serveCompanionIndex(res, config);
    return true;
  }
  if (path === "/api/companion/chat") {
    await serveChat(req, res, config, session);
    return true;
  }
  if (path === "/api/companion/ack" && (req.method ?? "GET") === "POST") {
    await serveMessageAck(res, config, session);
    return true;
  }
  return false;
}
