import type { IncomingMessage, ServerResponse } from "node:http";
import type { CompanionMessage } from "../companion/companion-chat.js";
import { memberContext } from "../companion/companion-context.js";
import {
  COMPANION_THROTTLE_MAX,
  COMPANION_THROTTLE_WINDOW_MS,
} from "../companion/companion-limits.js";
import { COMPANION_DISCLOSURE, FIRST_TRADE_TOUR } from "../companion/companion-system-prompt.js";
import { regularSessionOpen } from "../domain/market-session.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { onboardingView } from "./onboarding-api-routes.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import { openSseStream, sseFrame } from "./sse.js";

/**
 * THE COMPANION'S HTTP SURFACE — two endpoints, both gated on the SAME `Session` every
 * other member-only route checks upstream (`gateRequest` in `dashboard-auth-gate.ts`, wired by
 * the caller before this file ever runs):
 *
 *   GET  /api/companion       → { enabled } — whether `ANTHROPIC_API_KEY` is set, so the client
 *                                can render "not switched on yet" instead of a dead input box.
 *   POST /api/companion/chat  → the turn, streamed back over SSE (`delta`/`done`/`error` events).
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
): Promise<string | undefined> {
  try {
    const [onboarding, filings] = await Promise.all([
      onboardingView(config, session),
      config.readFeedback ? config.readFeedback(opaqueMemberId(session.email)) : [],
    ]);
    return memberContext({
      onboarding,
      filings: [...filings]
        .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
        .map((f) => ({ issueNumber: f.issueNumber, title: f.title, filedAt: f.filedAt })),
      marketOpen: regularSessionOpen(),
    });
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
  const messages = parseMessages(parseJsonRecord(raw));
  if (messages.length === 0) {
    sendJson(res, 400, { ok: false, error: "say something first" });
    return;
  }
  // The session's OWN linked desk, resolved server-side exactly like every trade surface
  // (`plays-api-routes.ts`) — never a client-supplied id, so a tool call can never be pointed at
  // another member's account.
  const participantId = resolveCurrentId(session, config.resolveOwnerId);
  const context = await memberContextFor(config, session);

  openSseStream(res);
  let seq = 0;
  await config.companion(
    {
      messages,
      ...(participantId ? { participantId } : {}),
      ...(context ? { context } : {}),
    },
    {
      onText: (chunk) => {
        res.write(sseFrame(JSON.stringify({ text: chunk }), "delta", seq++));
      },
      onDone: () => {
        res.write(sseFrame("{}", "done", seq++));
        res.end();
      },
      onError: (message) => {
        res.write(sseFrame(JSON.stringify({ error: message }), "error", seq++));
        res.end();
      },
    },
  );
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
  if (path !== "/api/companion" && path !== "/api/companion/chat") return false;
  if (!session) return false;
  if (path === "/api/companion" && (req.method ?? "GET") === "GET") {
    serveCompanionIndex(res, config);
    return true;
  }
  if (path === "/api/companion/chat") {
    await serveChat(req, res, config, session);
    return true;
  }
  return false;
}
