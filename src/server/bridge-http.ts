/**
 * The HTTP plumbing every bots→app bridge route shares (`insights-listener.ts`): a bounded body
 * reader, a JSON responder, and the whole fail-closed POST shape. Split out so the listener stays
 * under its line cap as routes are added (#3651 slice 7a added `/cond-scout`).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  INSIGHTS_BRIDGE_SECRET_HEADER,
  INSIGHTS_BRIDGE_SHARED_SECRET,
} from "../autonomous/insight-record.js";

/**
 * One insight record, JSON-encoded, is a few hundred bytes at most. 16 KB is generous headroom
 * without letting a hostile/broken caller hold the process's memory hostage streaming a body.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/** JSON in, JSON out — matches `fetchJson` (`src/http/fetch-json.ts`), the client's one fetch
 * call site, which parses every response body as JSON regardless of status. */
export function respond(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

export type BodyResult =
  | { readonly ok: true; readonly body: string }
  | { readonly ok: false; readonly reason: "too-large" | "stream error" };

/**
 * Reads the request body, never buffering past `maxBytes`. Once the cap is crossed it stops
 * retaining further chunks (so a hostile/oversized body can't grow this process's memory) but
 * deliberately does NOT tear down the socket — this listener only reaches here after the
 * shared-secret check above passes, so the caller is always the `bots` process, never an
 * unauthenticated stranger; destroying the connection mid-body-write (as an earlier version of
 * this function did) raced the client's own request write and surfaced as a hard connection
 * reset instead of a clean 413. Letting the stream finish and *then* responding is both simpler
 * and more correct. `maxBytes` defaults to `MAX_BODY_BYTES` — the small-insight cap; a caller
 * with a different payload class (e.g. `/decisions`) passes its own.
 */
export function readBoundedBody(
  req: IncomingMessage,
  maxBytes: number = MAX_BODY_BYTES,
): Promise<BodyResult> {
  return new Promise((resolve) => {
    let bytes = 0;
    let oversized = false;
    const chunks: Buffer[] = [];
    let settled = false;
    const finish = (result: BodyResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    req.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        oversized = true;
        chunks.length = 0; // stop holding retained bytes once we know we'll reject the body
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      finish(
        oversized
          ? { ok: false, reason: "too-large" }
          : { ok: true, body: Buffer.concat(chunks).toString("utf8") },
      );
    });
    req.on("error", () => finish({ ok: false, reason: "stream error" }));
  });
}

/** The shared shape of every bots→app POST: method, shared secret, configured, bounded body,
 *  JSON, a fail-closed parse, then the write. Any failure is an HTTP error, never a throw. */
export async function handleBridgePost<T>(
  req: IncomingMessage,
  res: ServerResponse,
  route: {
    readonly name: string;
    readonly maxBytes: number;
    readonly parse: (value: unknown) => T | undefined;
    readonly invalid: string;
    readonly accept?: (value: T) => Record<string, unknown>;
  },
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    respond(res, 405, { error: "method not allowed" });
    return;
  }
  if (req.headers[INSIGHTS_BRIDGE_SECRET_HEADER] !== INSIGHTS_BRIDGE_SHARED_SECRET) {
    respond(res, 401, { error: "unauthorized" });
    return;
  }
  if (!route.accept) {
    respond(res, 404, { error: `${route.name} not configured` });
    return;
  }

  const bodyResult = await readBoundedBody(req, route.maxBytes);
  if (!bodyResult.ok) {
    try {
      respond(res, bodyResult.reason === "too-large" ? 413 : 400, { error: bodyResult.reason });
    } catch {
      /* socket already gone — nothing left to respond to */
    }
    return;
  }

  let parsed: unknown;
  try {
    parsed = bodyResult.body.length > 0 ? JSON.parse(bodyResult.body) : undefined;
  } catch {
    respond(res, 400, { error: "malformed json" });
    return;
  }

  const value = route.parse(parsed);
  if (value === undefined) {
    respond(res, 400, { error: route.invalid });
    return;
  }

  let extra: Record<string, unknown>;
  try {
    extra = route.accept(value);
  } catch (error) {
    process.emitWarning(`[insights-listener] ${route.name} write failed: ${String(error)}`);
    respond(res, 502, { error: "write failed" });
    return;
  }

  respond(res, 200, { ok: true, ...extra });
}
