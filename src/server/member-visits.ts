/**
 * MEMBER VISITS — the day each member last opened the app, and which screens they opened (#8169).
 *
 * Before this, a member who signed in and only watched left no trace: the app recorded fills and
 * filings, nothing else, so #8161's stage-0 read could not tell a member who stopped visiting from
 * one who visits and never trades. This is that record, kept as small as the question allows:
 *
 *  - **One row per member per market day** (New York, through `market-day.ts`, the one place an
 *    instant becomes a day): the page-load count and the set of top-level screens. No query
 *    strings, no ids, no symbols, no free text — a path segment counts only when it names a screen
 *    the shell actually has (`APP_SCREENS`); anything else is `/app/other`.
 *  - **Inside the invite gate only.** The caller is the authorized branch of the dashboard server,
 *    after `gateRequest`; the public pages never reach it. Keyed by the same opaque id the feedback
 *    log uses (`opaqueMemberId`), never the email. Bots hold no session, so they never appear.
 *  - **A page load is a server hit for the shell's page** (`index.html`), not each screen change
 *    inside the app: the shell routes client-side, so `routes` is the screens a member LANDED on.
 *  - **A day counts as active on any signed-in `/api/*` request, page load or not** (#8262). A tab
 *    left open (or a phone resuming one from memory) never loads the shell again: it only calls
 *    the API, so counting loads alone said a member active five days had been seen once. Such a
 *    day keeps a row with `loads: 0` and no screens. `/events` does not count: the board stream
 *    stays connected in a hidden tab, while the API queries pause there (TanStack Query polls only
 *    a visible tab), so an API call is a member actually using the app. One write per member per
 *    day at most: the store remembers who it has already marked today.
 *  - **Never fails a request.** A store error is reported once per call and swallowed.
 *  - **Keeps 180 days.** One JSON file per day under the dir; older files are deleted on the first
 *    write of each new day, and ignored on read if a prune ever missed them.
 *
 * Read side: `memberActivity` answers "last seen" and "days active in the last 7 / 30" per member,
 * for the weekly newsletter and #8161's scorecard.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { marketDayKey } from "../domain/market-day.js";
import { storePath } from "../runtime/volume-guard.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import type { Session } from "./auth/session.js";
import { opaqueMemberId } from "./feedback-attribution.js";

/** How many days of rows the store keeps, today included. */
export const VISIT_RETENTION_DAYS = 180;

/**
 * The shell's top-level screens — the first path segment of every route file in `app/src/routes`
 * (`u` is a member's page, `/app/u/<id>`; the id is dropped). `tests/server/member-visits.spec.ts`
 * fails when a route file is added without its word here, so a new screen is never silently
 * counted as `other`.
 */
export const APP_SCREENS: readonly string[] = [
  "accounts",
  "activity",
  "feedback",
  "join",
  "leaderboard",
  "learn",
  "onboarding",
  "playbooks",
  "research",
  "saved-positions",
  "settings",
  "trade",
  "u",
];

/** One member's visits on one day. */
export interface MemberVisitDay {
  readonly memberId: string;
  /** Market day, YYYY-MM-DD (New York). */
  readonly day: string;
  /** Page loads of the shell that day — 0 when the member only used a tab already open. */
  readonly loads: number;
  /** Top-level screens opened, e.g. `/app/trade` — sorted, each once. */
  readonly routes: readonly string[];
}

/** What `memberActivity` answers per member. */
export interface MemberActivity {
  /** The latest market day with a visit, YYYY-MM-DD. */
  readonly lastSeen: string;
  /** Distinct days with a visit in the last 7 / 30 days, today included. */
  readonly activeDays7: number;
  readonly activeDays30: number;
}

export interface MemberVisitStore {
  /** Count one page load of `route` (already reduced by `appScreenOf`) for this member today. */
  record(memberId: string, route: string, now: Date): void;
  /** Mark this member present today without counting a page load (an API call from an open tab). */
  touch(memberId: string, now: Date): void;
  /** Every kept row, oldest day first. */
  list(now: Date): readonly MemberVisitDay[];
}

/**
 * The screen a shell request opens, or undefined when the request is not a page load: a built
 * asset (`/app/static/…`) or any file with an extension. `/app` and `/app/` are the home screen.
 */
export function appScreenOf(path: string): string | undefined {
  if (path !== "/app" && !path.startsWith("/app/")) return undefined;
  const segments = path.slice("/app".length).split("/").filter(Boolean);
  const first = segments[0];
  if (first === undefined) return "/app";
  if (first === "static" || segments.some((s) => s.includes("."))) return undefined;
  return APP_SCREENS.includes(first) ? `/app/${first}` : "/app/other";
}

/** The YYYY-MM-DD `n` calendar days before `day`. */
function daysBefore(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/** The first day still kept on `today`: today and the 179 before it. */
function oldestKept(today: string): string {
  return daysBefore(today, VISIT_RETENTION_DAYS - 1);
}

type DayFile = Readonly<Record<string, { readonly loads: number; readonly routes: string[] }>>;

/** Total shape check for one day's file — anything else degrades to unreadable, never half-read. */
function parseDayFile(raw: unknown): DayFile | undefined {
  if (!isRecord(raw)) return undefined;
  for (const row of Object.values(raw)) {
    if (!isRecord(row)) return undefined;
    if (typeof row.loads !== "number" || !Number.isInteger(row.loads) || row.loads < 0) {
      return undefined;
    }
    if (!(Array.isArray(row.routes) && row.routes.every((r) => typeof r === "string"))) {
      return undefined;
    }
  }
  return raw as DayFile;
}

const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;

/** File-backed store: `<dir>/<YYYY-MM-DD>.json`, one small object keyed by opaque member id. */
export class JsonMemberVisitStore implements MemberVisitStore {
  private prunedFor: string | undefined;
  /** Members already holding a row on `seenOn` — so `touch` writes once a day, not per request. */
  private seenOn: string | undefined;
  private readonly seen = new Set<string>();

  constructor(
    private readonly dir: string,
    private readonly warn: (message: string) => void = () => undefined,
  ) {}

  record(memberId: string, route: string, now: Date): void {
    this.upsert(memberId, now, (row) => {
      const routes = new Set(row?.routes ?? []);
      routes.add(route);
      return { loads: (row?.loads ?? 0) + 1, routes: [...routes].sort() };
    });
  }

  touch(memberId: string, now: Date): void {
    const day = marketDayKey(now.toISOString());
    if (this.seenOn === day && this.seen.has(memberId)) return;
    this.upsert(memberId, now, (row) => row ?? { loads: 0, routes: [] });
  }

  /** Rewrite one member's row for today, pruning on the first write of a new day. */
  private upsert(
    memberId: string,
    now: Date,
    next: (row: DayFile[string] | undefined) => DayFile[string],
  ): void {
    const day = marketDayKey(now.toISOString());
    if (this.prunedFor !== day) {
      this.prune(day);
      this.prunedFor = day;
    }
    if (this.seenOn !== day) {
      this.seenOn = day;
      this.seen.clear();
    }
    // Marked before the read: a day's file that cannot be read stays unwritten either way, and
    // `touch` must not re-read (and re-warn about) it on every API call.
    this.seen.add(memberId);
    const file = this.dayFile(day);
    // A file that exists but cannot be read whole is left alone: rewriting it would erase the day.
    const state = file.loadIfReadable();
    if (state === undefined) return;
    const row = state[memberId];
    const updated = next(row);
    if (updated !== row) file.write({ ...state, [memberId]: updated });
  }

  list(now: Date): readonly MemberVisitDay[] {
    const from = oldestKept(marketDayKey(now.toISOString()));
    return this.days()
      .filter((day) => day >= from)
      .flatMap((day) =>
        Object.entries(this.dayFile(day).load()).map(([memberId, row]) => ({
          memberId,
          day,
          loads: row.loads,
          routes: row.routes,
        })),
      );
  }

  private dayFile(day: string): JsonFileStore<DayFile> {
    return new JsonFileStore<DayFile>({
      path: join(this.dir, `${day}.json`),
      parse: parseDayFile,
      empty: {},
      label: "member-visits",
      onReadError: this.warn,
    });
  }

  /** Kept days, oldest first. */
  private days(): string[] {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir)
      .flatMap((name) => DAY_FILE.exec(name)?.[1] ?? [])
      .sort();
  }

  private prune(today: string): void {
    const from = oldestKept(today);
    for (const day of this.days()) {
      if (day < from) rmSync(join(this.dir, `${day}.json`), { force: true });
    }
  }
}

/** Build the store under the derived-store root (`SKYNET_MEMBER_VISITS_DIR` overrides): on Fly
 *  that is `/data/member-visits` on the volume, locally `data/member-visits`. */
export function createMemberVisitStore(
  env: Readonly<Record<string, string | undefined>>,
  warn?: (message: string) => void,
): MemberVisitStore {
  return new JsonMemberVisitStore(storePath(env, "SKYNET_MEMBER_VISITS_DIR"), warn);
}

/**
 * Count this shell request for the signed-in member, if it is a page load. Never throws: the
 * visit record is a side note on a request that must be served regardless.
 */
export function noteAppVisit(
  store: MemberVisitStore | undefined,
  session: Session | undefined,
  path: string,
  now: Date = new Date(),
): void {
  if (!(store && session)) return;
  const route = appScreenOf(path);
  if (route === undefined) return;
  try {
    store.record(opaqueMemberId(session.email), route, now);
  } catch (error) {
    process.emitWarning(`[member-visits] record failed: ${String(error)}`);
  }
}

/**
 * Mark the signed-in member present today when the request is an API call (#8262): the one kind
 * of request an already-open tab still makes. Never throws, like `noteAppVisit`.
 */
export function noteMemberPresence(
  store: MemberVisitStore | undefined,
  session: Session | undefined,
  path: string,
  now: Date = new Date(),
): void {
  if (!(store && session && path.startsWith("/api/"))) return;
  try {
    store.touch(opaqueMemberId(session.email), now);
  } catch (error) {
    process.emitWarning(`[member-visits] presence failed: ${String(error)}`);
  }
}

/**
 * "Last seen" and "days active in the last 7 / 30" per member, from the kept rows. Any row is a
 * day seen, page load or not (`loads: 0` is a day spent in a tab already open).
 */
export function memberActivity(
  rows: readonly MemberVisitDay[],
  now: Date,
): ReadonlyMap<string, MemberActivity> {
  const today = marketDayKey(now.toISOString());
  const from7 = daysBefore(today, 6);
  const from30 = daysBefore(today, 29);
  const byMember = new Map<string, Set<string>>();
  for (const row of rows) {
    if (row.day > today) continue;
    const days = byMember.get(row.memberId) ?? new Set<string>();
    days.add(row.day);
    byMember.set(row.memberId, days);
  }
  const out = new Map<string, MemberActivity>();
  for (const [memberId, days] of byMember) {
    const sorted = [...days].sort();
    out.set(memberId, {
      lastSeen: sorted[sorted.length - 1] as string,
      activeDays7: sorted.filter((d) => d >= from7).length,
      activeDays30: sorted.filter((d) => d >= from30).length,
    });
  }
  return out;
}
