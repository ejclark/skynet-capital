import type { IncomingMessage, ServerResponse } from "node:http";
import { bookWaitFrom, bookWaitState, WAIT_INPUT_ERRORS } from "../domain/book-wait.js";
import { marketDayKey } from "../domain/market-day.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { ownsDesk } from "./desk-owner-gate.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";
import { questsAccount } from "./quests-route.js";

/**
 * THE WAIT ON A BOOK (#4608 slice 1) — a member's own call to hold off on one account, with the day
 * the question reopens and why (`src/domain/book-wait.ts`, kept by `book-wait-store.ts`).
 *
 *   GET  /api/book-wait[?participantId=…]  → { wait: null | { state: "standing", wait, daysLeft }
 *                                                           | { state: "reopened", wait } }
 *   POST /api/book-wait/set   { participantId, reopensOn, reason } → { ok, wait?, error? }
 *   POST /api/book-wait/clear { participantId }                    → { ok, error? }
 *
 * A wait without a reopen day is refused (400, with the sentence the form shows). "Today" is the
 * server's market day, never the request's, so a wait's state reads the same on every device.
 *
 * Privacy: the owned-set rule every per-account route uses — a wait answers to the account's owner
 * alone, and anyone else is told the account does not exist (`GET /api/quests`'s 404). Nothing here
 * places, changes or cancels an order.
 */

export const BOOK_WAIT_PATH = "/api/book-wait";
const SET_PATH = `${BOOK_WAIT_PATH}/set`;
const CLEAR_PATH = `${BOOK_WAIT_PATH}/clear`;

/** A reopen day, a reason line and an account id fit well inside this. */
const BODY_CAP_BYTES = 2_048;
const NOT_WIRED = "Waits aren't wired in this deployment.";
const NOT_SAVED = "The wait couldn't be saved just now — try again in a moment.";

const today = (config: DashboardServerConfig): string =>
  marketDayKey((config.now?.() ?? new Date()).toISOString());

const deskExists = (config: DashboardServerConfig, id: string): boolean =>
  config.hub.getState().participants.some((p) => p.id === id);

function serveRead(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): void {
  if (!requireGet(req, res)) return;
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const id = questsAccount(params, config, session);
  if (!(id && deskExists(config, id))) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const wait = config.bookWaits?.wait(id);
  sendJson(res, 200, { wait: wait ? bookWaitState(wait, today(config)) : null });
}

/** The body's account, when the session owns it and the desk exists — else the 404 is sent. */
function ownedFromBody(
  body: Record<string, unknown> | undefined,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  const id = boundedString(body?.participantId, 100);
  if (id && ownsDesk(id, config, session) && deskExists(config, id)) return id;
  sendJson(res, 404, { error: "no such account" });
  return undefined;
}

async function serveWrite(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  const id = ownedFromBody(body, res, config, session);
  if (!(id && body)) return;
  const store = config.bookWaits;
  if (!store) {
    sendJson(res, 200, { ok: false, error: NOT_WIRED });
    return;
  }
  if (path === CLEAR_PATH) {
    sendJson(res, 200, store.clear(id) ? { ok: true } : { ok: false, error: NOT_SAVED });
    return;
  }
  const now = config.now?.() ?? new Date();
  const asked = bookWaitFrom(
    { reopensOn: body.reopensOn, reason: body.reason },
    today(config),
    now.toISOString(),
  );
  if (!asked.ok) {
    sendJson(res, 400, { ok: false, error: WAIT_INPUT_ERRORS[asked.error] });
    return;
  }
  if (!store.set(id, asked.wait)) {
    sendJson(res, 200, { ok: false, error: NOT_SAVED });
    return;
  }
  sendJson(res, 200, { ok: true, wait: bookWaitState(asked.wait, today(config)) });
}

/** Handle `/api/book-wait*`. Returns true when answered. */
export async function serveBookWaitApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === BOOK_WAIT_PATH) {
    serveRead(req, res, config, session);
    return true;
  }
  if (path !== SET_PATH && path !== CLEAR_PATH) return false;
  await serveWrite(req, res, path, config, session);
  return true;
}
