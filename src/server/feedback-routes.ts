/**
 * The `/feedback` routes — the form, the submission, the coach turn, and the markdown preview.
 *
 * Split out of dashboard-server.ts when the preview route landed (2026-08-22): the router file was
 * one line under its architecture budget, and the feedback surface had grown its own dependencies
 * (a GitHub filer, an AI coach, a markdown renderer). Same shape as trade-routes.ts and
 * research-routes.ts — the router dispatches, the surface owns its own handlers.
 *
 * Behaviour is unchanged by the move: GET renders the form, POST files the issue behind a
 * per-member throttle, and neither the coach nor the preview ever posts anything anywhere — only
 * the member's explicit Send does.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

import {
  renderFeedbackFollowupResultBody,
  renderFeedbackFormBody,
  renderFeedbackResultBody,
} from "../observatory/feedback-view.js";
import type { NavContext } from "../observatory/render-dashboard.js";
import type { Session } from "./auth/session.js";
import {
  type CoachTurn,
  type FeedbackSpec,
  handleFeedbackCoach,
  toSpec,
} from "./feedback-coach.js";
import type { FollowupResult, SubmitFollowup } from "./feedback-followup.js";
import { type FeedbackImageInput, parseImages } from "./feedback-images.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { type FeedbackLogEntry, feedbackLogEntry } from "./feedback-log.js";
import { handleFeedbackPreview } from "./feedback-preview.js";
import type { FeedbackInput, FeedbackKind, FeedbackResult } from "./feedback-service.js";
import type { FetchFeedbackStatuses } from "./feedback-status.js";
import { readBody, shellDocument } from "./page-shell.js";

/** What the feedback surface needs from the server config — never the whole config object. */
export interface FeedbackRouteDeps {
  readonly submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>;
  readonly coachFeedback?: CoachTurn;
  /** Records a successful filing (#429 slice: the feedback log). Failure never fails the submit —
   *  it's recorded in a try/catch so a store hiccup can't cost the member their filed issue. */
  readonly recordFeedback?: (entry: FeedbackLogEntry) => Promise<void>;
  /** Reads a member's own filing history, for the "Your recent feedback" list under the form. */
  readonly readFeedback?: (opaqueMemberId: string) => Promise<readonly FeedbackLogEntry[]>;
  /** Live status (open/needs-info/needs-eric/next-slice/shipped) for that same list — omitted
   *  (undefined) means unwired, same as the other feedback deps; the list still renders, just
   *  without status badges. */
  readonly fetchFeedbackStatus?: FetchFeedbackStatuses;
  /** Posts a follow-up comment on an issue the signed-in member already filed, and re-triggers a
   *  build (feedback-followup.ts). Requires `readFeedback` too — ownership is checked against the
   *  member's own logged filings, never trusted from the form. */
  readonly submitFollowup?: SubmitFollowup;
}

/** The feedback paths, dispatched together so the main router stays one branch. */
export async function serveFeedbackRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  session: Session | undefined,
  config: FeedbackRouteDeps,
  nav: NavContext,
): Promise<void> {
  const method = req.method ?? "GET";
  if (path === "/feedback/coach") {
    await handleFeedbackCoach(req, res, method, session?.email, config.coachFeedback);
    return;
  }
  if (path === "/feedback/preview") {
    await handleFeedbackPreview(req, res, method);
    return;
  }
  if (path === "/feedback/followup") {
    await handleFollowup(req, res, method, session, nav, config);
    return;
  }
  await handleFeedback(req, res, method, session, nav, config);
}

// Light per-submitter throttle — the codebase has no rate-limiting, and this route writes to the
// repo, so cap bursts (5 / 10 min) keyed by the signed-in email. In-memory is fine (single process).
const feedbackHits = new Map<string, number[]>();
function throttled(key: string, now = Date.now(), windowMs = 600_000, max = 5): boolean {
  const recent = (feedbackHits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    feedbackHits.set(key, recent);
    return true;
  }
  recent.push(now);
  feedbackHits.set(key, recent);
  return false;
}

/**
 * The build spec as it comes back off the form. It rides a hidden field, so it is member-editable
 * like every other field — `toSpec` re-normalizes it server-side (bounded strings, no backticks,
 * and `spec-complete` re-earned rather than asserted), so a hand-crafted POST cannot inject
 * markdown into a public issue body. What a forged spec CAN do is claim curation; that is bounded
 * by `scripts/envelope-scan.mjs`, which no prompt or payload can argue past.
 */
function specFromForm(raw: string | null): { spec: FeedbackSpec } | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return { spec: toSpec(JSON.parse(raw.slice(0, 8000)) as unknown) };
  } catch {
    return undefined;
  }
}

/** Attached screenshots off the hidden `images` field — bounded/sanitized by `parseImages`
 *  (feedback-images.ts). Wrapped the same way as `specFromForm` so the spread below never
 *  branches on its own. */
function imagesFromForm(raw: string | null): { images: readonly FeedbackImageInput[] } | undefined {
  const images = parseImages(raw);
  return images.length ? { images } : undefined;
}

/** Assembles the submission from the posted form — pulled out of `handleFeedback` so its four
 *  optional fields (area, submitter, spec, images) don't inflate that function's own complexity. */
function feedbackInputFromForm(form: URLSearchParams, session: Session | undefined): FeedbackInput {
  const kindRaw = form.get("kind");
  const kind: FeedbackKind = kindRaw === "bug" || kindRaw === "idea" ? kindRaw : "feature";
  return {
    kind,
    title: form.get("title") ?? "",
    details: form.get("details") ?? "",
    ...(form.get("area") ? { area: form.get("area") as string } : {}),
    ...(session?.email ? { submitterEmail: session.email } : {}),
    ...(session?.name ? { submitterName: session.name } : {}),
    ...(specFromForm(form.get("spec")) ?? {}),
    ...(imagesFromForm(form.get("images")) ?? {}),
  };
}

async function handleFeedback(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  session: Session | undefined,
  nav: NavContext,
  config: FeedbackRouteDeps,
): Promise<void> {
  const { submitFeedback, recordFeedback, readFeedback, fetchFeedbackStatus, submitFollowup } =
    config;
  if (method === "GET") {
    const recent =
      readFeedback && session?.email ? await readFeedback(opaqueMemberId(session.email)) : [];
    const statuses =
      fetchFeedbackStatus && recent.length
        ? await fetchFeedbackStatus(recent.map((e) => e.issueNumber))
        : undefined;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      shellDocument(
        "Feedback — Skynet Capital",
        renderFeedbackFormBody({
          nav,
          enabled: Boolean(submitFeedback),
          coachEnabled: Boolean(config.coachFeedback),
          recent,
          followupEnabled: Boolean(submitFollowup && readFeedback),
          ...(statuses ? { statuses } : {}),
        }),
      ),
    );
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  if (!submitFeedback) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      shellDocument(
        "Feedback — Skynet Capital",
        renderFeedbackResultBody({
          nav,
          result: {
            ok: false,
            error:
              "Feedback isn't switched on yet — ask Eric to set the feedback token. Your note wasn't sent.",
          },
        }),
      ),
    );
    return;
  }
  if (session && throttled(session.email)) {
    res.writeHead(429, { "content-type": "text/html; charset=utf-8" });
    res.end(
      shellDocument(
        "Feedback — Skynet Capital",
        renderFeedbackResultBody({
          nav,
          result: {
            ok: false,
            error: "You've sent a bunch just now — give it a few minutes and try again.",
          },
        }),
      ),
    );
    return;
  }

  // Raised past the shared 1MB default: up to 3 attached screenshots ride this same POST as
  // base64 in the `images` hidden field (feedback-view.ts) — plain text submissions stay tiny.
  const form = new URLSearchParams(await readBody(req, 8_000_000));
  const input = feedbackInputFromForm(form, session);
  const result = await submitFeedback(input);
  if (result.ok && recordFeedback && session?.email) {
    try {
      await recordFeedback(
        feedbackLogEntry(
          { kind: input.kind, title: input.title },
          opaqueMemberId(session.email),
          result,
          new Date().toISOString(),
        ),
      );
    } catch (error) {
      process.emitWarning(`[feedback-log] record failed: ${String(error)}`);
    }
  }
  res.writeHead(result.ok ? 200 : 502, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument("Feedback — Skynet Capital", renderFeedbackResultBody({ nav, result })));
}

/** A follow-up comment on a filed issue, and the retrigger that comes with it (feedback-followup.ts).
 *  Ownership is checked against the member's own logged filings — never trusted from the posted
 *  `issueNumber` — so a member can only ever follow up on their own feedback. */
async function handleFollowup(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  session: Session | undefined,
  nav: NavContext,
  config: FeedbackRouteDeps,
): Promise<void> {
  const respond = (status: number, result: FollowupResult) => {
    res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
    res.end(
      shellDocument("Feedback — Skynet Capital", renderFeedbackFollowupResultBody({ nav, result })),
    );
  };
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  const { submitFollowup, readFeedback } = config;
  if (!(submitFollowup && readFeedback && session)) {
    respond(200, { ok: false, error: "Following up isn't switched on yet." });
    return;
  }
  if (throttled(session.email)) {
    respond(429, {
      ok: false,
      error: "You've sent a bunch just now — give it a few minutes and try again.",
    });
    return;
  }
  const form = new URLSearchParams(await readBody(req, 8_000));
  const issueNumber = Number(form.get("issueNumber"));
  const details = form.get("details") ?? "";
  const owned = await readFeedback(opaqueMemberId(session.email));
  if (!(Number.isInteger(issueNumber) && owned.some((e) => e.issueNumber === issueNumber))) {
    respond(200, { ok: false, error: "That doesn't look like one of your own filings." });
    return;
  }
  const result = await submitFollowup({
    issueNumber,
    body: details,
    submitterEmail: session.email,
    ...(session.name ? { submitterName: session.name } : {}),
  });
  respond(result.ok ? 200 : 502, result);
}
