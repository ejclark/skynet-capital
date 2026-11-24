import type { IncomingMessage, ServerResponse } from "node:http";

import {
  type JournalNoteBody,
  parseJournalPost,
  type WishPost,
  wishTitle,
} from "../domain/journal-entry.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { recordFilingSafely } from "./feedback-log.js";
import { feedbackThrottled } from "./feedback-routes.js";
import type { FeedbackInput } from "./feedback-service.js";
import { journalNote } from "./journal-store.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * THE WISH JOURNAL'S API (#8190, a slice of #8161) — two endpoints, both the signed-in member's own:
 *
 *   GET  /api/journal → `{ available, wishesEnabled, notes }`: this member's experience and trade
 *                       notes, newest first. Their wishes are filings, and `GET /api/feedback`
 *                       already lists those with their status words (marked `source: "journal"`).
 *   POST /api/journal → a wish, an experience note or a trade note (`parseJournalPost`).
 *
 * A WISH IS A FILING. It goes through `config.submitFeedback` as kind `idea`, the member's words
 * unedited as the body and a title cut from their first sentence (`wishTitle`), under the SAME
 * per-member throttle as every other filing, then into the feedback log with `source: "journal"`.
 * The journal store never gets a copy: one concept, one home.
 *
 * A NOTE IS PRIVATE. It is appended to the journal store and goes nowhere else: not filed, not
 * posted, not sent to Moneypenny. A trade note is words; nothing here reads or touches an order.
 *
 * IDENTITY IS THE SESSION'S. Both endpoints refuse without a signed-in session, and read and write
 * only `opaqueMemberId(session.email)` — no field of the body names whose journal this is.
 */

export const JOURNAL_PATH = "/api/journal";

/** Three 4,000-character boxes plus a symbol, in UTF-8 (up to 3 bytes a character), and the JSON. */
const JOURNAL_BODY_CAP_BYTES = 40_000;

/** Notes write only to the member's own file, but the volume is shared: cap bursts per member,
 *  on a key apart from the filing throttle so notes never spend a member's wish budget. */
const NOTE_BURST_MAX = 30;
const NOTE_BURST_WINDOW_MS = 600_000;

const SIGN_IN = "Sign in to keep a journal.";
const NOT_STORED = "Notes aren't stored on this deployment yet, so this one wasn't saved.";
const TOO_MANY = "You've sent a bunch just now — give it a few minutes and try again.";
const NOT_SAVED =
  "Your note wasn't saved — something went wrong on our side. Try again in a moment.";

/** The most notes one read returns, newest first: a journal open stays one screen's worth. */
export const JOURNAL_LIST_LIMIT = 200;

async function serveList(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const wishesEnabled = Boolean(config.submitFeedback);
  if (!session?.email) {
    sendJson(res, 401, { available: false, wishesEnabled, notes: [], reason: SIGN_IN });
    return;
  }
  if (!config.journal) {
    sendJson(res, 200, {
      available: false,
      wishesEnabled,
      notes: [],
      reason: "Notes aren't stored on this deployment yet.",
    });
    return;
  }
  const notes = await config.journal.list(opaqueMemberId(session.email));
  sendJson(res, 200, {
    available: true,
    wishesEnabled,
    // Saved in order, so newest first is the reverse; a copy, never the store's own array.
    notes: notes
      .slice(-JOURNAL_LIST_LIMIT)
      .reverse()
      .map(({ opaqueMemberId: _id, ...note }) => note),
  });
}

/** A wish → a filing through the feedback path, recorded once in the feedback log. */
async function serveWish(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session,
  wish: WishPost,
): Promise<void> {
  if (!config.submitFeedback) {
    sendJson(res, 200, {
      ok: false,
      error: "Filing isn't switched on in this deployment yet, so your wish wasn't sent.",
    });
    return;
  }
  if (feedbackThrottled(session.email)) {
    sendJson(res, 429, { ok: false, error: TOO_MANY });
    return;
  }
  const input: FeedbackInput = {
    kind: "idea",
    title: wishTitle(wish.text),
    details: wish.text,
    source: "journal",
    submitterEmail: session.email,
    ...(session.name ? { submitterName: session.name } : {}),
  };
  const result = await config.submitFeedback(input);
  if (!result.ok) {
    sendJson(res, 502, { ok: false, error: `Your wish wasn't sent: ${result.error}` });
    return;
  }
  await recordFilingSafely(config.recordFeedback, input, opaqueMemberId(session.email), result);
  sendJson(res, 200, { ok: true, kind: "wish", url: result.url, number: result.number });
}

/** A note → the member's own journal file, and nowhere else. */
async function serveNote(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session,
  body: JournalNoteBody,
): Promise<void> {
  if (!config.journal) {
    sendJson(res, 200, { ok: false, error: NOT_STORED });
    return;
  }
  const throttleKey = `journal-note:${session.email}`;
  if (feedbackThrottled(throttleKey, Date.now(), NOTE_BURST_WINDOW_MS, NOTE_BURST_MAX)) {
    sendJson(res, 429, { ok: false, error: TOO_MANY });
    return;
  }
  const note = journalNote(body, opaqueMemberId(session.email), new Date().toISOString());
  try {
    await config.journal.append(note);
  } catch (error) {
    process.emitWarning(`[journal] note save failed: ${String(error)}`);
    sendJson(res, 500, { ok: false, error: NOT_SAVED });
    return;
  }
  const { opaqueMemberId: _id, ...shown } = note;
  sendJson(res, 200, { ok: true, kind: body.kind, note: shown });
}

async function serveWrite(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, JOURNAL_BODY_CAP_BYTES);
  if (raw === undefined) return;
  if (!session?.email) {
    sendJson(res, 401, { ok: false, error: SIGN_IN });
    return;
  }
  const body = parseJsonRecord(raw);
  const parsed = body
    ? parseJournalPost(body)
    : { ok: false as const, reason: "That journal entry didn't arrive whole — send it again." };
  if (!parsed.ok) {
    sendJson(res, 400, { ok: false, error: parsed.reason });
    return;
  }
  if (parsed.post.kind === "wish") await serveWish(res, config, session, parsed.post);
  else await serveNote(res, config, session, parsed.post);
}

/** Handle `/api/journal`. Returns true when the request was answered. */
export async function serveJournalApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== JOURNAL_PATH) return false;
  if ((req.method ?? "GET") === "GET") await serveList(res, config, session);
  else await serveWrite(req, res, config, session);
  return true;
}
