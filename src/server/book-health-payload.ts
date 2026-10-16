import {
  type BookHealthView,
  bookHealthView,
  type HealthCounts,
} from "../observatory/book-health-view.js";
import { WEEK_BUCKET_MS } from "../observatory/check-week-view.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { OpenLot } from "../trading/round-trips.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * The book's health on `GET /api/desk/:id` (#5493 slice 1) — a field on the account's existing
 * payload, never a route of its own (the IA decision: the book is the page). The owner reads every
 * finding and every play's numbers; anyone else reads the counts by level and detector only, since
 * a finding names the playbook behind it and which playbooks an account runs is its owner's (#885).
 *
 * Absent inputs degrade honestly: a failed broker read serves `available: false` (no book to
 * judge); a human account has no decision passes, so it simply gets no LOOPING findings; an unwired
 * or unreadable subscription store leaves the per-play rows empty rather than guessing.
 */

/** The most passes the store hands back in one page (`decision-db.ts`'s `MAX_PAGE`). */
const PASSES_READ = 100;

export type DeskHealth =
  | { readonly available: false }
  | ({ readonly available: true } & BookHealthView)
  | { readonly available: true; readonly counts: HealthCounts };

export async function deskHealthPayload(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  owner: boolean,
  openLots: readonly OpenLot[] | undefined,
): Promise<DeskHealth> {
  if (found.error) return { available: false };
  const bot = found.kind === "bot";
  const records = bot ? await config.readDecisions?.(found.id, { limit: PASSES_READ }) : undefined;
  const weekRows = bot ? config.readCheckWeek?.(found.id) : undefined;
  const view = bookHealthView({
    asOf: (config.now?.() ?? new Date()).toISOString(),
    portfolio: { cash: found.cash, positions: found.positions },
    subscriptions: config.subscriptions?.loadIfReadable()?.[found.id] ?? [],
    ...(records ? { records } : {}),
    ...(weekRows ? { week: { rows: weekRows, bucketMs: WEEK_BUCKET_MS } } : {}),
    ...(openLots ? { openLots } : {}),
    ownerView: owner,
  });
  return owner ? { available: true, ...view } : { available: true, counts: view.counts };
}
