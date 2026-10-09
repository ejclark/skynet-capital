import type { IncomingMessage, ServerResponse } from "node:http";
import type { Session } from "./auth/session.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { feedbackThrottled } from "./feedback-routes.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * `POST /api/client-error` — the shell's error beacon lands here (#4618, slice 6 of #4612). Before
 * it, a member's crash lived only in their own console: production had no client log at all, so a
 * stale-chunk blank or a render throw was invisible until someone described it. This turns each
 * caught route error into one `[client-error]` stdout line beside the server's own gauge.
 *
 * Behind the gate like every other `/api` write (a signed-out tab is redirected before it gets
 * here), JSON-only and 2 KB-capped by `readJsonPost`, and throttled per member — a render loop on
 * one tab must not flood the log the gauge shares. The member is named by `opaqueMemberId`, never
 * an email: the log buffer is readable by anyone with deploy access.
 */
export const CLIENT_ERROR_PATH = "/api/client-error";
const CAP_BYTES = 2_048;
const KINDS = new Set(["stale-chunk", "render"]);
/** 20 a member per 10 minutes — enough to see a pattern, too few to drown the gauge. */
const THROTTLE_MAX = 20;
const THROTTLE_WINDOW_MS = 600_000;

export interface ClientErrorReport {
  kind: "stale-chunk" | "render";
  name: string;
  message: string;
  path: string;
}

/** The strict shape gate: every field present and bounded, `kind` one of the two the shell sends. */
export function parseClientError(raw: string): ClientErrorReport | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const kind = boundedString(body.kind, 20);
  const name = boundedString(body.name, 100);
  const message = boundedString(body.message, 500);
  // An empty path is legal (the shell sends "" where `location` is missing); a non-string is not.
  const path = typeof body.path === "string" && body.path.length <= 300 ? body.path : undefined;
  if (!(kind && KINDS.has(kind) && name && message && path !== undefined)) return undefined;
  return { kind: kind as ClientErrorReport["kind"], name, message, path };
}

/** One line, every value JSON-quoted so a newline or a forged `[gauge]` in a message cannot
 *  start a second log line. */
export function formatClientError(report: ClientErrorReport, member: string): string {
  return (
    `[client-error] ${report.kind} on ${JSON.stringify(report.path)} for ${member}: ` +
    `${JSON.stringify(report.name)} ${JSON.stringify(report.message)}`
  );
}

/** Handle `/api/client-error`. Returns true when the request was answered. */
export async function serveClientErrorApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  session: Session | undefined,
  log: (line: string) => void = (line) => process.emitWarning(line),
  now: () => number = Date.now,
): Promise<boolean> {
  if (path !== CLIENT_ERROR_PATH) return false;
  const raw = await readJsonPost(req, res, CAP_BYTES);
  if (raw === undefined) return true;
  const report = parseClientError(raw);
  if (!report) {
    sendJson(res, 400, { error: "malformed error report" });
    return true;
  }
  const member = session?.email ? opaqueMemberId(session.email) : "anon";
  if (!feedbackThrottled(`client-error:${member}`, now(), THROTTLE_WINDOW_MS, THROTTLE_MAX)) {
    log(formatClientError(report, member));
  }
  // 204 either way: a throttled beacon has nothing to retry and nothing to show the member.
  res.writeHead(204);
  res.end();
  return true;
}
