import type { IncomingMessage, ServerResponse } from "node:http";
import { CONVICTIONS, type ConvictionStore } from "../playbooks/conviction-store.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * THE CONVICTION RECORDS, READ (#5482 slice 2) — `GET /api/convictions`.
 *
 *   GET /api/convictions          → every stored conviction, with the pairs each one steers.
 *   GET /api/convictions?id=<id>  → one conviction, or 404.
 *
 * Read-only, and only the records the bots act on: a member's own views are drafts that steer
 * nothing yet, kept and served apart (`member-convictions-api-routes.ts`, slice 6a). It sits behind
 * the auth gate with every `/api/*` read, so only invited members see a member's view (criterion
 * 8: the shared universe is members-only), and every answer is labelled SIM — a conviction steers
 * paper trading and nothing else. No UI reads it yet.
 */
export function serveConvictionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  store: ConvictionStore = CONVICTIONS,
): boolean {
  if (path !== "/api/convictions") return false;
  if (!requireGet(req, res)) return true;
  const id = new URL(req.url ?? "", "http://localhost").searchParams.get("id");
  if (id === null) {
    sendJson(res, 200, { label: "SIM", convictions: store.all() });
    return true;
  }
  const conviction = store.get(id);
  if (!conviction) {
    sendJson(res, 404, { error: "no such conviction" });
    return true;
  }
  sendJson(res, 200, { label: "SIM", conviction });
  return true;
}
