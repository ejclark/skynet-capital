import type { ServerResponse } from "node:http";
import { renderCheckResult } from "../observatory/comprehension-check-view.js";
import { renderShell } from "../observatory/dashboard-shell.js";
import { localBack } from "./trade-response-pages.js";
import { html, type TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * The comprehension check's POST — the write half of the academy gate (#577).
 *
 * It rides `/trade` with the wheels toggle and the celebration claim, handled before anything
 * order-shaped so a quiz answer can never double as an order. The browser posts only what it is
 * allowed to know: which milestone is being checked and one option INDEX per question. Grading,
 * the pass/fail verdict, and the durable record all happen server-side in
 * `progression-service.ts` — nothing here believes a client that says it passed.
 *
 * A graded check answers with a full page rather than a redirect, because the result IS the
 * teaching: every question comes back with its plain-language reason, and a redirect would throw
 * that away to show a bare state change. Passing returns to the page the member came from, where
 * the celebration is now waiting; missing returns there too, where the gate simply re-renders —
 * retries are unlimited, and progress is never permanently blocked.
 */

/** Answer fields are `a_<questionId>` — namespaced so they can't collide with an order field. */
const ANSWER_PREFIX = "a_";

/** The posted answers as question id → option index. Anything else in the form is ignored. */
export function answersFromForm(form: URLSearchParams): Map<string, string> {
  const answers = new Map<string, string>();
  for (const [key, value] of form) {
    if (key.startsWith(ANSWER_PREFIX)) answers.set(key.slice(ANSWER_PREFIX.length), value);
  }
  return answers;
}

/**
 * Handle a submitted comprehension check. Returns true when the request was a check (and has
 * been answered), false when it was something else entirely — the dispatch contract the wheels
 * and claim handlers already use.
 */
export async function handleCheckPost(
  res: ServerResponse,
  form: URLSearchParams,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<boolean> {
  const milestoneId = form.get("check");
  if (milestoneId === null) return false;
  const back = localBack(form.get("back"));
  const result = await deps.progression?.submitCheck(
    requesterId,
    milestoneId,
    answersFromForm(form),
  );
  // No service wired, or an id that gates nothing: there was never a check to fail, so the member
  // goes back to where they were rather than to a fabricated verdict.
  if (!result) {
    res.writeHead(303, { location: back });
    res.end();
    return true;
  }
  html(
    res,
    200,
    deps.document(
      "Comprehension check — Skynet Capital",
      renderShell(deps.nav, renderCheckResult(result, { back }), new Date().toISOString()),
    ),
  );
  return true;
}
