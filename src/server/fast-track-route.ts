import type { IncomingMessage, ServerResponse } from "node:http";
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import {
  FAST_TRACK_HORIZON_DAYS,
  type FastTrackEvent,
  type FastTrackInput,
  KILL_SWITCHES_SHOWN,
} from "../domain/fast-track.js";
import { marketDayKey } from "../domain/market-day.js";
import { eventsWithin, type MarketEvent } from "../domain/market-events.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";
import { RESEARCH_DIR } from "./research-service.js";
import { heldNames, withLedger } from "./upcoming-events.js";
import { memberFor } from "./watchlist-route.js";

/**
 * GET /api/fast-track — what the landing page's first fast track reads (#7034 slice 2): the
 * fortnight's events, each with its house stance and live kill switches, and the member's own book
 * (held names, then watched ones). The page runs the card walk itself over this one answer
 * (`src/domain/fast-track.ts`'s `nextStep` and `choose`), so a card costs no request and no model
 * tokens — the plan's constraint for slices 1–2.
 *
 * ONE RANKING. The engine's `rankEvents` orders the list on the page, the same function the chat's
 * calendar lookup (`upcoming-events.ts`) uses, so the card and the chat can't order one fortnight
 * two ways. Unlike the chat, this route has the session, so it reads the watchlist too.
 *
 * EVERY LEDGER IN THE FORTNIGHT, ONCE A DAY. A folded event is still pickable (criterion 1), so its
 * stop card needs its kill switches; the ~110 ledgers are local files baked into the image, read on
 * the first request of a market day and kept until the day turns.
 *
 * Privacy: the book is the session's own — the current account's positions and that member's
 * watchlist, never a parameter. A session with no account still gets the calendar, with an empty
 * book; nothing here trades.
 */

export const FAST_TRACK_PATH = "/api/fast-track";

/** Specs pass a frozen calendar, its prints and a fixture shelf; production reads the real ones. */
export interface FastTrackDeps {
  readonly events?: readonly MarketEvent[];
  readonly prints?: readonly EarningsPrint[];
  readonly root?: string;
}

let cached: { readonly key: string; readonly events: readonly FastTrackEvent[] } | undefined;

/** The fortnight's events with their ledgers, kill switches capped at what a card offers. */
export function fortnightEvents(asOf: string, deps: FastTrackDeps = {}): readonly FastTrackEvent[] {
  const root = deps.root ?? RESEARCH_DIR();
  const key = `${root}|${asOf}`;
  const shared = !(deps.events || deps.prints);
  if (shared && cached?.key === key) return cached.events;
  const events = eventsWithin(asOf, FAST_TRACK_HORIZON_DAYS, deps.events, deps.prints).map(
    (event) => {
      const item = withLedger(root, event, asOf);
      return { ...item, killSwitches: item.killSwitches.slice(0, KILL_SWITCHES_SHOWN) };
    },
  );
  if (shared) cached = { key, events };
  return events;
}

/** The session's own names: its account's positions (a contract reads as its underlying), then its
 *  watchlist, keyed exactly as the watchlist route keys it (`memberFor`). */
async function bookFor(
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<FastTrackInput["book"]> {
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const desk = id ? config.hub.getState().participants.find((p) => p.id === id) : undefined;
  const held = heldNames((desk?.positions ?? []).map((p) => p.symbol));
  const member = memberFor(config, session);
  let watched: string[] = [];
  if (member && config.watchlist) {
    try {
      watched = (await config.watchlist.load(member)).map((w) => w.symbol);
    } catch {
      // A watchlist that can't be read costs the ranking its second key, never the list.
    }
  }
  return { held, watched: watched.filter((s) => !held.includes(s)) };
}

/** Handle `/api/fast-track`. Returns true when answered. */
export async function serveFastTrackApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  deps?: FastTrackDeps,
): Promise<boolean> {
  if (path !== FAST_TRACK_PATH) return false;
  if (!requireGet(req, res)) return true;
  // New York's market day, so an evening tap doesn't read tomorrow's fortnight (the chat's rule).
  const asOf = marketDayKey((config.now?.() ?? new Date()).toISOString());
  const answer: FastTrackInput = {
    asOf,
    events: fortnightEvents(asOf, deps),
    book: await bookFor(config, session),
  };
  sendJson(res, 200, answer);
  return true;
}
