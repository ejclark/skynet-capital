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

import { renderFeedbackFormBody, renderFeedbackResultBody } from "../observatory/feedback-view.js";
import type { NavContext } from "../observatory/render-dashboard.js";
import type { Session } from "./auth/session.js";
import {
  type CoachTurn,
  type FeedbackSpec,
  handleFeedbackCoach,
  toSpec,
} from "./feedback-coach.js";
import { handleFeedbackPreview } from "./feedback-preview.js";
import type { FeedbackInput, FeedbackKind, FeedbackResult } from "./feedback-service.js";
import { readBody, shellDocument } from "./page-shell.js";

/** What the feedback surface needs from the server config — never the whole config object. */
export interface FeedbackRouteDeps {
  readonly submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>;
  readonly coachFeedback?: CoachTurn;
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
  await handleFeedback(
    req,
    res,
    method,
    session,
    nav,
    config.submitFeedback,
    Boolean(config.coachFeedback),
  );
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

async function handleFeedback(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  session: Session | undefined,
  nav: NavContext,
  submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>,
  coachEnabled = false,
): Promise<void> {
  if (method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      shellDocument(
        "Feedback — Skynet Capital",
        renderFeedbackFormBody({ nav, enabled: Boolean(submitFeedback), coachEnabled }),
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

  const form = new URLSearchParams(await readBody(req));
  const kindRaw = form.get("kind");
  const kind: FeedbackKind = kindRaw === "bug" || kindRaw === "idea" ? kindRaw : "feature";
  const result = await submitFeedback({
    kind,
    title: form.get("title") ?? "",
    details: form.get("details") ?? "",
    ...(form.get("area") ? { area: form.get("area") as string } : {}),
    ...(session?.email ? { submitterEmail: session.email } : {}),
    ...(specFromForm(form.get("spec")) ?? {}),
  });
  res.writeHead(result.ok ? 200 : 502, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument("Feedback — Skynet Capital", renderFeedbackResultBody({ nav, result })));
}
