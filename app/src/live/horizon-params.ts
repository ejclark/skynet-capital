import { useNavigate, useSearch } from "@tanstack/react-router";
import { type DayRange, marketToday, rangeFor, stepAnchor } from "./horizon-range";
import {
  DEFAULT_LENS,
  LENSES,
  type Lens,
  parseResearchQuery,
  setLens as setLensToken,
  setOnDate,
} from "./research";

/**
 * THE RANGE AS ROOT URL STATE (#3807 slice 2·1; the design panel's F5 and F10, 2026-09-26). The
 * market calendar's date key — the anchor day and the lens — is `?on=YYYY-MM-DD&span=<lens>` on
 * the ROOT route: validated here, retained across client-side navigation by `retainSearchParams`
 * in `routes/__root.tsx`, so the week a member picks on the Profile page is the week R&D opens
 * on and the week Trade sees (docs/members/eric.md: j1, the Monday read, flows into j2 ending on
 * Trade). ONE MODEL, TWO CARRIERS: the head's arrows and lenses write these params, and R&D's
 * filter box still accepts `on:`/`lens:` tokens, which `routes/research.tsx` lifts out of `?q=`
 * into them (`liftHorizonTokens`).
 *
 * `span`, not `lens`: `?lens=` is taken on `/accounts` for List · Map · Runway. The all lens
 * (`span=all` — no time filter) stays a first-class value, so R&D's "tap the pressed lens to
 * clear" means the same thing everywhere.
 *
 * DEFAULTS. No `on` reads today on the exchange's wall clock; no `span` reads the WEEK (#1704,
 * Eric 2026-09-06: "Week seems like a good tempo for now"). Its falsifier stays where it was
 * written: the week lens driving short-horizon trading — a member stepping weeks to find a
 * month's events — sends the default to month. A default never writes a param, so a plain URL
 * stays plain.
 *
 * A hard navigation (a server-rendered `<a href>`, a reload of a link that lost its query) reads
 * the defaults again — retention is a client-side courtesy, never a stored preference.
 */

export interface HorizonSearch {
  readonly on?: string;
  readonly span?: Lens;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` that is a real calendar day, or undefined — never a guess. */
export function parseOn(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !ISO_DAY.test(raw)) return undefined;
  const day = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === raw ? raw : undefined;
}

/** One of the five lenses, or undefined — an unknown span falls back to the default silently. */
export function parseSpan(raw: unknown): Lens | undefined {
  return typeof raw === "string" && (LENSES as readonly string[]).includes(raw)
    ? (raw as Lens)
    : undefined;
}

/** The root route's `validateSearch` for the range: a malformed value drops, never strands. */
export function horizonSearch(search: Record<string, unknown>): HorizonSearch {
  const on = parseOn(search.on);
  const span = parseSpan(search.span);
  return { ...(on ? { on } : {}), ...(span ? { span } : {}) };
}

export interface LiftedTokens {
  readonly on?: string;
  readonly lens?: Lens;
  /** The query with both tokens removed — what `?q=` should carry. */
  readonly rest: string;
}

/**
 * The `on:` / `lens:` tokens typed into a filter box, lifted out of the text: `rest` is the query
 * without them, `on` and `lens` are what the root params should become. A token is reported only
 * when it was present — `lens:week` is still a token, so it can put an explicit month back to the
 * default — and its absence leaves the params alone.
 */
export function liftHorizonTokens(query: string): LiftedTokens {
  const parsed = parseResearchQuery(query);
  const plain = query.split(/\s+/).filter(Boolean).join(" ");
  const withoutLens = setLensToken(query, DEFAULT_LENS);
  return {
    ...(parsed.on ? { on: parsed.on } : {}),
    ...(withoutLens !== plain ? { lens: parsed.lens } : {}),
    rest: setOnDate(withoutLens, undefined),
  };
}

export interface HorizonRange {
  /** The day the range is built around — `?on=`, or today when none is pinned. */
  readonly anchor: string;
  /** The lens in force — `?span=`, the week by default, the week for a fogged day lens. */
  readonly lens: Lens;
  readonly range: DayRange;
  /** Whether `anchor` came from the URL (true) or defaulted to today (false). */
  readonly pinned: boolean;
  readonly today: string;
  /** Pin a day; `undefined` clears the pin back to today. */
  readonly setOn: (date: string | undefined) => void;
  /** Pick a lens; the default writes no param at all. */
  readonly setLens: (lens: Lens) => void;
  /** Move the anchor one lens-span forward (+1) or back (−1). */
  readonly step: (direction: 1 | -1) => void;
}

/**
 * The range, read from the root params on any route, with the three writes every head makes.
 * `fogged` (docs/FOG-OF-WAR.md, the day lens behind rung 501): a fogged member who asks for the
 * day lens reads the week, and the head says so beside the chip. `fiscalYearEndMonth` (#1736)
 * snaps the quarter lens to one company's fiscal quarter — R&D passes it when exactly one symbol
 * is in scope; the Profile page never does.
 */
export function useHorizonRange(
  options: { readonly fogged?: boolean; readonly fiscalYearEndMonth?: number } = {},
): HorizonRange {
  const search: Record<string, unknown> = useSearch({ strict: false });
  const navigate = useNavigate();
  const today = marketToday();
  const on = parseOn(search.on);
  const asked = parseSpan(search.span) ?? DEFAULT_LENS;
  const lens: Lens = options.fogged && asked === "day" ? "week" : asked;
  const anchor = on ?? today;
  const fiscalYearEndMonth = options.fiscalYearEndMonth;
  const write = (patch: { on?: string | undefined; span?: Lens | undefined }): void => {
    // `useNavigate()` without a `from` types the target route's search as `never` — the route is
    // only known at runtime — while this write is a plain merge into whatever route is current.
    void navigate({
      search: ((prev: Record<string, unknown>) => ({ ...prev, ...patch })) as never,
      replace: true,
    });
  };
  return {
    anchor,
    lens,
    today,
    range: rangeFor(anchor, lens, fiscalYearEndMonth),
    pinned: on !== undefined,
    setOn: (date) => write({ on: date }),
    setLens: (next) => write({ span: next === DEFAULT_LENS ? undefined : next }),
    step: (direction) => write({ on: stepAnchor(anchor, lens, direction, fiscalYearEndMonth) }),
  };
}
