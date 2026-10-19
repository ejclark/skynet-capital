import { type Standing, standingOf } from "../observatory/book-health-history.js";
import {
  type BookHealthView,
  bookHealthView,
  type HealthCounts,
  type HealthFinding,
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

/** A finding with how long it has stood and which way it is going (#5493 slice 5); absent when no
 *  history is wired, so the finding simply says nothing about its age. */
export type StandingFinding = HealthFinding & { readonly standing?: Standing };

export type DeskHealth =
  | { readonly available: false }
  | ({ readonly available: true } & Omit<BookHealthView, "findings"> & {
        readonly findings: readonly StandingFinding[];
      })
  | { readonly available: true; readonly counts: HealthCounts };

/** The view for one account, as its owner reads it — what the desk route serves and what the
 *  hourly sampler records (`book-health-sampler.ts`). Undefined when the broker read failed. */
export async function deskHealthView(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  openLots: readonly OpenLot[] | undefined,
): Promise<BookHealthView | undefined> {
  if (found.error) return undefined;
  const bot = found.kind === "bot";
  const records = bot ? await config.readDecisions?.(found.id, { limit: PASSES_READ }) : undefined;
  const weekRows = bot ? config.readCheckWeek?.(found.id) : undefined;
  return bookHealthView({
    asOf: (config.now?.() ?? new Date()).toISOString(),
    accountId: found.id,
    portfolio: { cash: found.cash, positions: found.positions },
    subscriptions: config.subscriptions?.loadIfReadable()?.[found.id] ?? [],
    ...(records ? { records } : {}),
    ...(weekRows ? { week: { rows: weekRows, bucketMs: WEEK_BUCKET_MS } } : {}),
    ...(openLots ? { openLots } : {}),
    ownerView: true,
  });
}

export async function deskHealthPayload(
  found: ParticipantSnapshot,
  config: DashboardServerConfig,
  owner: boolean,
  openLots: readonly OpenLot[] | undefined,
): Promise<DeskHealth> {
  if (found.error) return { available: false };
  const view = await deskHealthView(found, config, openLots);
  if (!view) return { available: false };
  if (!owner) {
    // Counts only: what the owner's view names (play, symbol) is theirs (#885).
    return { available: true, counts: view.counts };
  }
  const history = config.healthHistory?.samples(found.id);
  if (!history) return { available: true, ...view };
  return {
    available: true,
    ...view,
    findings: view.findings.map((finding) => ({
      ...finding,
      standing: standingOf(history, finding, view.asOf),
    })),
  };
}
