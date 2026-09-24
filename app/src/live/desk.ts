/**
 * The desk's client model (#738 phase 2c) — the JSON twin of `/u/:id`'s blotter, plus the
 * Issues-style filter grammar the desk's filter bar speaks. Types mirror
 * `src/observatory/desk-json-view.ts` by hand (same contract note as board.ts). Every displayed
 * value arrives server-formatted; the one raw numeric (`totalPlRaw`) exists for FILTERING only.
 */

export type Tone = "pos" | "neg" | "flat";

/** One still-open tax lot inside a position — same column shape as `DeskPosition` (#3186 slice
 *  1), only ever present when the server could account for the whole position from its lots. */
export interface PositionLot {
  readonly lotId: string;
  readonly openedAt: string;
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly returnPct: string;
  readonly totalTone: Tone;
}

export interface DeskPosition {
  readonly symbol: string;
  readonly display: string;
  readonly detail: string;
  readonly isOption: boolean;
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayPct: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly totalPlRaw: number;
  readonly returnPct: string;
  readonly totalTone: Tone;
  readonly weightPct: number;
  readonly lots?: readonly PositionLot[];
  /** Plain words (#3689 slice 6; `src/observatory/position-plain.ts`). Optional so an older payload
   *  or fixture without them still renders, showing "—". */
  readonly plainName?: string;
  /** "37 days", "today", or "no expiry". */
  readonly expiresIn?: string;
  readonly expiresInDays?: number;
  readonly breakeven?: string;
  /** "+$13,440" or "unlimited". */
  readonly best?: string;
  /** "−$6,560" or "unlimited". */
  readonly worst?: string;
  /** The next dated thing that can move it (`src/observatory/position-event.ts`). */
  readonly nextEvent?: PositionEvent;
}

/** Mirrors the server's `NextEvent`: "Earnings Oct 28" and whether it lands before expiry. */
export interface PositionEvent {
  readonly label: string;
  readonly at: string;
  readonly beforeExpiry: boolean;
  readonly scope: "stock" | "market";
}

/** The stock's own event (its earnings print) lands while the option is alive — the case the
 *  "Earnings before expiry" chip and `event:before-expiry` keep. A Fed date doesn't count. */
export const eventBeforeExpiry = (p: Pick<DeskPosition, "nextEvent">): boolean =>
  p.nextEvent?.scope === "stock" && p.nextEvent.beforeExpiry;

/** One card in "Needs a decision" (#3689 slice 7) — mirrors `Decision` in
 *  `src/observatory/decisions-view.ts`. Every string is server-written; `stakeRaw` only sorts. */
export interface Decision {
  readonly id: string;
  readonly kind: "at-risk" | "lock-in" | "idea";
  readonly symbol: string;
  readonly display: string;
  readonly plainName: string;
  readonly pl: string;
  readonly plTone: Tone;
  readonly title: string;
  readonly captionShort: string;
  readonly caption: string;
  readonly why: string;
  readonly clocks: readonly string[];
  readonly primary: { readonly label: string; readonly href: string };
  readonly secondary?: { readonly label: string; readonly href: string };
  readonly stakeRaw: number;
  /** A single-leg option's outcome numbers; the client adds the live spot. */
  readonly range?: {
    readonly type: "call" | "put";
    readonly side: "long" | "short";
    readonly strike: number;
    readonly breakeven: number;
  };
}

/** One considerations-rail chip (#3186 slice 3) — mirrors `ConsiderationChip` in
 *  `src/observatory/considerations-view.ts`. */
export interface ConsiderationChip {
  readonly id: string;
  readonly kind: "at-risk" | "opportunity";
  readonly symbol: string;
  readonly display: string;
  readonly notional: string;
  readonly delta: string;
  readonly deltaTone: Tone;
  readonly reason: string;
  readonly action: { readonly label: string; readonly href: string };
}

export interface DeskTiles {
  readonly openPositions: number;
  readonly invested: string;
  /** Raw twin of `invested`, for cross-account summing (#2321) — never for display. */
  readonly investedRaw: number;
  readonly dayPl: string;
  readonly dayTone: Tone;
  /** Raw twin of `dayPl`. */
  readonly dayPlRaw: number;
  readonly unrealized: string;
  readonly unrealizedNote: string;
  readonly unrealizedTone: Tone;
  /** Raw twin of `unrealized`. */
  readonly unrealizedRaw: number;
  readonly cash: string;
  /** Raw twin of `cash`. */
  readonly cashRaw: number;
}

/** Where the money is (#3689 slice 5) — mirrors `DeskAllocation` in desk-json-view.ts. The three
 *  percentages are of long shares + long options + cash, and add to 100. */
export interface DeskAllocation {
  readonly shares: string;
  readonly options: string;
  readonly cash: string;
  readonly sharesPct: number;
  readonly optionsPct: number;
  readonly cashPct: number;
  readonly cashShare: string;
  /** Signed shares held across stock positions — their delta, for "market exposure". */
  readonly shareCount: number;
}

export interface Desk {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly error?: string;
  readonly tiles: DeskTiles;
  readonly positions: readonly DeskPosition[];
  readonly considerations: readonly ConsiderationChip[];
  /** Optional on the client so an older payload still renders (the pager then hides). */
  readonly decisions?: readonly Decision[];
  /** Optional on the client so an older server (or fixture) without it still renders. */
  readonly allocation?: DeskAllocation;
}

export interface DeskSnapshot {
  readonly generatedAt: string;
  readonly desk: Desk;
  /** Present only for desks the world projection gives a landmark (persona-mapped bots). */
  readonly landmark?: { readonly power: number; readonly health: number };
}

export async function fetchDesk(id: string): Promise<DeskSnapshot> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/desk/${id} → ${res.status}`);
  return (await res.json()) as DeskSnapshot;
}

/**
 * The filter grammar — the blotter's subset of the Issues bar: bare terms match the display name,
 * `is:option`/`is:share` split by instrument, `pl:>0`/`pl:<0` split by the sign of total P/L, and
 * `dte:<N` / `dte:<=N` keeps what expires within N days (#3689 slice 6b; shares never match,
 * since they don't expire), and `event:before-expiry` keeps options whose stock prints before
 * they expire. Chips and the query text are ONE model; both sides write this string.
 */
export interface DeskFilter {
  readonly terms: readonly string[];
  readonly option?: boolean;
  readonly plSign?: 1 | -1;
  /** Keep positions expiring in at most this many days. */
  readonly maxDays?: number;
  /** Keep only options with their stock's own event before expiry. */
  readonly eventBeforeExpiry?: boolean;
}

export function parseDeskQuery(query: string): DeskFilter {
  const terms: string[] = [];
  let option: boolean | undefined;
  let plSign: 1 | -1 | undefined;
  let maxDays: number | undefined;
  let beforeExpiry = false;
  for (const token of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const dte = /^dte:<(=?)(\d{1,4})$/.exec(token);
    if (dte) maxDays = Number(dte[2]) - (dte[1] ? 0 : 1);
    else if (token === "event:before-expiry") beforeExpiry = true;
    else if (token === "is:option") option = true;
    else if (token === "is:share") option = false;
    else if (token === "pl:>0") plSign = 1;
    else if (token === "pl:<0") plSign = -1;
    else terms.push(token);
  }
  return {
    terms,
    ...(option === undefined ? {} : { option }),
    ...(plSign ? { plSign } : {}),
    ...(maxDays === undefined ? {} : { maxDays }),
    ...(beforeExpiry ? { eventBeforeExpiry: true } : {}),
  };
}

export function matchesFilter(position: DeskPosition, filter: DeskFilter): boolean {
  if (filter.option !== undefined && position.isOption !== filter.option) return false;
  if (filter.plSign === 1 && position.totalPlRaw <= 0) return false;
  if (filter.plSign === -1 && position.totalPlRaw >= 0) return false;
  if (
    filter.maxDays !== undefined &&
    (position.expiresInDays === undefined || position.expiresInDays > filter.maxDays)
  )
    return false;
  if (filter.eventBeforeExpiry && !eventBeforeExpiry(position)) return false;
  const haystack = `${position.display} ${position.symbol}`.toLowerCase();
  return filter.terms.every((term) => haystack.includes(term));
}

/** Qualifiers that contradict each other — turning one on turns its siblings off, the way
 *  GitHub's is:open/is:closed replace rather than stack (a book can't be both in profit and
 *  under water; both armed guaranteed an empty ladder — Eric's live-review screenshot). */
const EXCLUSIVE_GROUPS: readonly (readonly string[])[] = [
  // Only options expire, so "expiring within 3 weeks" and "earnings before expiry" already mean
  // options, and a share can never match either: the four replace one another rather than stack.
  ["is:option", "is:share", "dte:<21", "event:before-expiry"],
  ["pl:>0", "pl:<0"],
];

/** Toggle one qualifier in the query string — the chip side of the bidirectional model. */
export function toggleQualifier(query: string, qualifier: string): string {
  const parts = query.split(/\s+/).filter(Boolean);
  const without = parts.filter((p) => p.toLowerCase() !== qualifier);
  if (without.length !== parts.length) return without.join(" ");
  const siblings = EXCLUSIVE_GROUPS.find((g) => g.includes(qualifier)) ?? [];
  return [...without.filter((p) => !siblings.includes(p.toLowerCase())), qualifier].join(" ");
}

/** Who placed an order, as far as the audit log honestly reaches (`src/observatory/order-origin.ts`).
 *  `unknown` is the honest default — a bot desk, or an order outside the log's coverage. */
export type OrderOrigin = "desk" | "alpaca-direct" | "unknown";

export interface DeskActivityEvent {
  readonly orderId: string;
  readonly symbol: string;
  readonly display: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly filled: number;
  readonly price: string;
  readonly status: string;
  readonly at: string;
  readonly backfilled: boolean;
  readonly origin: OrderOrigin;
  /** Realized P/L on a closing fill — absent on opening fills. */
  readonly realizedPl?: string;
  /** Return percentage on a closing fill — absent on opening fills. */
  readonly returnPct?: string;
  /** Tone for the realized P/L — absent when no P/L. */
  readonly realizedTone?: Tone;
  /** The decision that placed this order — bot accounts only, when the audit trail resolves it
   *  (#3687 slice 4). Absent means none was found, never an empty placeholder. */
  readonly reasoning?: ActivityReasoning;
}

export interface ActivityReasoning {
  readonly reason: string;
  /** Whose decision it was — not always the account's own persona (beta-scout trades on Sauron's). */
  readonly personaId: string;
  readonly strategy?: string;
  readonly expectation?: string;
  readonly guardDelta?: string;
  readonly playbookId?: string;
  readonly playbookMode?: string;
}

export interface DeskActivity {
  readonly available: boolean;
  readonly activity: readonly DeskActivityEvent[];
}

export async function fetchDeskActivity(id: string): Promise<DeskActivity> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/activity`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/desk/${id}/activity → ${res.status}`);
  return (await res.json()) as DeskActivity;
}

/** Mirrors `domain/types.ts`'s `OrderForecast` — the structured, scoreable half of a persona's
 *  forward claim, kept alongside the free-form `expectation` prose. */
export interface DecisionForecast {
  readonly direction: "up" | "down";
  readonly magnitudePct?: number;
  readonly horizonMs?: number;
  readonly invalidator: string;
}

export interface DecisionOutcome {
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly playbook?: string;
  /** Only meaningful alongside `playbook`. */
  readonly playbookMode?: "conservative" | "standard" | "aggressive";
  readonly strategy?: string;
  readonly reason: string;
  readonly expectation?: string;
  readonly forecast?: DecisionForecast;
  readonly action: "placed" | "rejected" | "observed" | "cooldown-skipped";
  readonly resultStatus?: string;
  readonly fill?: string;
  /** The cycle's market context at this symbol, when captured — see `decision-json-view.ts`. */
  readonly momentum?: number;
  readonly sentiment?: number;
  /** The raw→guarded quantity delta, when the risk guards resized this outcome's ask. */
  readonly guardDelta?: string;
  /** Cross-links to the matching Activity/blotter row (`id="act-<orderId>"`). */
  readonly activityAnchor?: string;
}

/** A raw intent the guards refused in full this cycle — see `decision-json-view.ts`. */
export interface RefusedIntent {
  readonly symbol: string;
  readonly side: string;
  readonly quantity: number;
  readonly strategy?: string;
  readonly reason: string;
  readonly expectation?: string;
}

export interface DecisionCycle {
  readonly at: string;
  readonly mode: "observe" | "live";
  readonly status: "halted" | "placed" | "rejected" | "observed" | "refused" | "quiet";
  readonly headline: string;
  readonly rawCount: number;
  readonly guardedCount: number;
  readonly outcomes: readonly DecisionOutcome[];
  readonly refusedIntents?: readonly RefusedIntent[];
  readonly halted?: string;
  /** Present only on a collapsed quiet run (`decision-json-view.ts`'s `quietRunView`) — the
   *  oldest cycle's timestamp in the run, so the UI can render the full idle span alongside `at`
   *  (the run's newest). */
  readonly quietSince?: string;
  /** Present only when this cycle was recorded by a persona OTHER than the account being viewed —
   *  a fallback mechanism like beta-scout, pooled in by `decision-account-view.ts` because it
   *  trades on this account's broker while keeping its own decision history separately. */
  readonly authorPersona?: string;
}

export interface DeskDecisions {
  readonly available: boolean;
  readonly kind: "human" | "bot";
  readonly cycles: readonly DecisionCycle[];
  /** Epoch ms cursor for the next older page (PR 5, issue #2287) — absent means this page wasn't
   *  full, so there's nothing further back to fetch. Mirrors `WireData.nextCursor` in `wire.ts`. */
  readonly nextCursor?: number;
}

export async function fetchDeskDecisions(
  id: string,
  before?: number,
  opts: { readonly noTrades?: boolean } = {},
): Promise<DeskDecisions> {
  const query = new URLSearchParams();
  if (before !== undefined) query.set("before", String(before));
  if (opts.noTrades) query.set("trades", "none");
  const qs = query.toString();
  const params = qs ? `?${qs}` : "";
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/decisions${params}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/desk/${id}/decisions → ${res.status}`);
  return (await res.json()) as DeskDecisions;
}

/** The Thesis Drawer shell's data (#3186 slice 4a) — mirrors `ThesisView` in
 *  `src/observatory/thesis-json-view.ts`. */
export type ThesisVerdict = "entering" | "exiting" | "holding" | "standing aside" | "no data yet";

export interface ThesisCall {
  readonly verdict: ThesisVerdict;
  readonly why: string;
  readonly window?: string;
  readonly invalidator?: string;
  readonly asOf?: string;
}

/** The decision behind a Thesis marker's fill — see `src/observatory/wire-reasoning.ts`. */
export interface ThesisMarkerReasoning {
  readonly reason: string;
  readonly strategy?: string;
  readonly expectation?: string;
  readonly guardDelta?: string;
}

export interface ThesisMarker {
  readonly n: number;
  readonly kind: "entry" | "exit";
  readonly at: string;
  readonly label: string;
  readonly activityAnchor: string;
  /** Absent for a fill that predates the audit trail, or when no lookup is configured — never
   *  fabricated. */
  readonly reasoning?: ThesisMarkerReasoning;
}

export interface ThesisHealth {
  readonly measured: boolean;
  readonly label: string;
  readonly detail?: string;
}

export interface ThesisEquityPoint {
  readonly t: string;
  readonly value: number;
}

export interface ThesisData {
  readonly personaId?: string;
  readonly thesis?: string;
  readonly call: ThesisCall;
  readonly health: ThesisHealth;
  readonly equity: readonly ThesisEquityPoint[];
  readonly markers: readonly ThesisMarker[];
}

export interface DeskThesis {
  readonly available: boolean;
  readonly kind: "human" | "bot";
  readonly thesis?: ThesisData;
}

export async function fetchDeskThesis(id: string): Promise<DeskThesis> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/thesis`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/desk/${id}/thesis → ${res.status}`);
  return (await res.json()) as DeskThesis;
}
