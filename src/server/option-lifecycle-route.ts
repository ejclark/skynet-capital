import type { IncomingMessage, ServerResponse } from "node:http";
import { parseLifecycleActivity } from "../trading/option-lifecycle.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { lifecycleRows, type OptionLifecycleResponse } from "./option-lifecycle-view.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * GET /api/trade/option-lifecycle?participantId=…  (#3407 slice 4 — the last capability #4330 named)
 *
 * What happened to this account's contracts without an order: expiries, assignments, exercises and
 * the share settlements that pair with them. Every piece under this was built and specced long ago
 * (`AlpacaOptionsClient.readOptionLifecycleActivities` reads them, `option-lifecycle.ts` normalizes
 * them, `option-lifecycle-view.ts` says in words what each one means for a position) and had
 * exactly one consumer: a manual backfill script. This is the member-facing seam, and it is
 * deliberately thin — read, normalize, render.
 *
 * Identity is the session's and nowhere else: the asked-for account must be in the owned set, or it
 * does not exist for this caller. Same posture as `option-positions-route.ts`, and the reason the
 * route takes a `participantId` at all is that a member with several desks reads one desk's book at
 * a time — the trade surface's own `?desk=`.
 *
 * THE CALL BUDGET, STATED: exactly ONE broker read per load. Nothing here pages. The newest page
 * (100 rows, `direction=desc`) covers far more lifecycle events than a friends-and-family paper
 * account generates in a year, and the deep history already has its own owner — the re-runnable
 * `backfillParticipantOptionLifecycle` sweep, which is where paging and its page cap live.
 *
 * THREE ANSWERS, NEVER TWO. An unlinked session, a broker that did not answer, and an account with
 * nothing to show are three different facts, and collapsing the middle one into an empty list would
 * tell a member "nothing happened to your contracts" on the strength of a timeout. That is why the
 * client gained `readOptionLifecycleActivities`: the fail-soft array is right for a sweep that only
 * appends, and wrong for a screen.
 */

/** Rows a load renders. Enough that a week of expiries is one screen, short enough that the pane
 *  stays a summary of recent events rather than a second history page (`/activity` owns that). */
export const LIFECYCLE_ROW_LIMIT = 20;

/** The lifecycle view for one owned account, or why there is none. Exported so a spec can drive it
 *  without an HTTP server, the same seam `loadOptionPositions` offers its own route. */
export async function loadOptionLifecycle(
  id: string,
  config: DashboardServerConfig,
): Promise<OptionLifecycleResponse> {
  const client = config.optionsClientFor?.(id);
  if (!client) return { available: false, reason: "unlinked", rows: [] };
  const read = await client.readOptionLifecycleActivities();
  if (!read.ok) return { available: false, reason: "unreachable", rows: [] };
  // A row the normalizer refuses (an unknown type, a missing quantity, an unparseable date) is
  // dropped rather than rendered as a partial event — the same posture `matchRoundTrips` takes on
  // an unpriced fill. It is excluded from `more` for the same reason: a count a member can act on
  // should describe rows that exist, not rows the broker sent.
  const normalized = read.rows.map(parseLifecycleActivity).filter((a) => a !== null);
  return {
    available: true,
    asOf: (config.now?.() ?? new Date()).toISOString(),
    rows: lifecycleRows(normalized, LIFECYCLE_ROW_LIMIT),
    more: normalized.length > LIFECYCLE_ROW_LIMIT,
  };
}

export async function serveOptionLifecycleApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/trade/option-lifecycle") return false;
  if (!requireGet(req, res)) return true;
  const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("participantId") ?? "";
  const owned = config.auth ? resolveOwnedIds(session, config) : [id];
  if (!(id && owned.includes(id))) {
    sendJson(res, 404, { error: "no such account" });
    return true;
  }
  sendJson(res, 200, await loadOptionLifecycle(id, config));
  return true;
}
