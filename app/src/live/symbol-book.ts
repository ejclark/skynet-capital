import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import { type BookDesk, underlyingOf } from "./book-events";
import type { Decision, DeskPosition } from "./desk";
import { dollarsOf } from "./playbook-rule";
import { held } from "./quantity";

/**
 * ONE SYMBOL'S BOOK (#6082; #5154 round 4, option C — Eric's Build pick): what Events shows when
 * it is narrowed to one ticker (`?symbol=`). Pure — the section draws it, a spec pins it.
 *
 *   invested  the symbol's positions at market value, summed — the cockpit head's own "invested"
 *             (`participantInvested`: a sold option's liability nets against it), so the symbols
 *             add up to the figure the head prints above them. Worded "Invested", never "In play"
 *             (Eric, round 4: "In play feels to cute, bound to cause confusion").
 *   pl        unrealized P/L, the positions' `totalPlRaw` summed.
 *   rows      one per position: its name, its target and its own P/L.
 *   soonest   the first date something must be decided on the symbol — a decision card's `due`, else
 *             an option's expiry (Eric, round 3: "Soonest dates to act take precedent").
 *
 * HONEST TARGETS (criteria 5 and 9). A sold option's target is keeping its premium — what it was
 * sold for is the most it can make. Shares a wheel holds have no price target: the wheel takes no
 * early profit, it sells the next option. Anything else has no target on record and says so; no
 * number here is ever illustrative.
 */

/** The fields a symbol's head reads — `DeskSnapshot` fits, so does the Events fixture. */
export type SymbolPosition = Pick<
  DeskPosition,
  "symbol" | "isOption" | "quantity" | "value" | "costBasis" | "totalPlRaw"
> &
  Partial<Pick<DeskPosition, "playbookId">>;

export interface SymbolDesk extends BookDesk {
  readonly desk: Omit<BookDesk["desk"], "positions" | "decisions"> & {
    readonly positions: readonly (BookDesk["desk"]["positions"][number] & SymbolPosition)[];
    readonly decisions?: readonly Pick<Decision, "id" | "symbol" | "display" | "title" | "due">[];
  };
}

export interface SymbolRow {
  readonly key: string;
  /** The position's own OCC/ticker symbol — the Overview row it lands on. */
  readonly symbol: string;
  /** "Sold $80 put", "55 shares". */
  readonly name: string;
  /** "expires Nov 6", "hold" — said beside the name. */
  readonly state: string;
  /** "target: keep the $255 premium", "no price target · the wheel holds", "no target recorded". */
  readonly target: string;
  readonly pl: number;
  /** "$550 to close" — a sold option's cost to buy back today; absent for anything else. */
  readonly toClose?: string;
  /** The contract's terms, for saying what its dates mean (`symbol-why.ts`); absent for shares. */
  readonly option?: SymbolOption;
}

export interface SymbolOption {
  readonly type: "call" | "put";
  readonly strike: number;
  /** `YYYY-MM-DD`. */
  readonly expiry: string;
  readonly short: boolean;
  readonly contracts: number;
  /** What it was sold or bought for, whole dollars; absent when the basis is unreadable. */
  readonly premium?: number;
}

export interface SymbolAction {
  /** `YYYY-MM-DD`. */
  readonly date: string;
  /** What is due, in plain words: "the $80 put expires first". */
  readonly what: string;
}

export interface SymbolBook {
  readonly symbol: string;
  readonly invested: number;
  readonly pl: number;
  readonly rows: readonly SymbolRow[];
  readonly soonest?: SymbolAction;
}

const SHORT_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const shortDay = (iso: string): string => SHORT_DAY.format(new Date(`${iso}T00:00:00Z`));

/** Whole dollars, no sign — the glyph and the box carry the direction. */
export const wholeDollars = (value: number): string =>
  `$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;

/** The desks narrowed to one ticker's positions and decisions; desks holding none drop out. */
export function narrowDesks<D extends BookDesk>(desks: readonly D[], symbol: string): D[] {
  return desks
    .map((d) => ({
      ...d,
      desk: {
        ...d.desk,
        positions: d.desk.positions.filter((p) => underlyingOf(p.symbol) === symbol),
        ...(d.desk.decisions
          ? { decisions: d.desk.decisions.filter((x) => underlyingOf(x.symbol) === symbol) }
          : {}),
      },
    }))
    .filter((d) => d.desk.positions.length > 0);
}

function rowOf(deskId: string, p: SymbolPosition, wheel: boolean): SymbolRow {
  const { count, short } = held(p.quantity);
  const occ = parseOccSymbol(p.symbol);
  const pl = Number.isFinite(p.totalPlRaw) ? p.totalPlRaw : 0;
  const key = `${deskId} ${p.symbol}`;
  if (occ) {
    const contracts = count === 1 ? "" : `${count.toLocaleString("en-US")} × `;
    const name = `${contracts}${short ? "Sold" : "Bought"} ${occStrikeLabel(occ.strike)} ${occ.type}`;
    const premium = dollarsOf(p.costBasis);
    const owed = dollarsOf(p.value);
    return {
      key,
      symbol: p.symbol,
      name,
      state: `expires ${shortDay(occ.expiration)}`,
      target:
        short && premium !== undefined
          ? `target: keep the ${wholeDollars(premium)} premium`
          : "no target recorded",
      pl,
      ...(short && owed !== undefined ? { toClose: `${wholeDollars(owed)} to close` } : {}),
      option: {
        type: occ.type,
        strike: occ.strike,
        expiry: occ.expiration,
        short,
        contracts: count,
        ...(premium !== undefined ? { premium: Math.abs(premium) } : {}),
      },
    };
  }
  return {
    key,
    symbol: p.symbol,
    name: `${count.toLocaleString("en-US")} ${count === 1 ? "share" : "shares"}${short ? " short" : ""}`,
    state: "hold",
    target: wheel && !short ? "no price target · the wheel holds" : "no target recorded",
    pl,
  };
}

interface Candidate {
  readonly date: string;
  readonly what: string;
  /** 0 a decision card, 1 a bare expiry — a decision wins its day (it says what to decide). */
  readonly rank: number;
}

const expires = (symbol: string, many: boolean): string | undefined => {
  const occ = parseOccSymbol(symbol);
  return occ
    ? `the ${occStrikeLabel(occ.strike)} ${occ.type} expires${many ? " first" : ""}`
    : undefined;
};

/** Every dated thing to act on across the desks: each option's expiry, each decision's due day. */
function candidatesOf(desks: readonly SymbolDesk[], many: boolean): Candidate[] {
  const out: Candidate[] = [];
  for (const { desk } of desks) {
    for (const p of desk.positions) {
      const occ = parseOccSymbol(p.symbol);
      const what = expires(p.symbol, many);
      if (occ && what) out.push({ date: occ.expiration, what, rank: 1 });
    }
    for (const d of desk.decisions ?? []) {
      if (!d.due) continue;
      const what = d.due.reason === "expiry" ? expires(d.symbol, many) : undefined;
      out.push({ date: d.due.at, what: what ?? d.title, rank: 0 });
    }
  }
  return out;
}

/** The first date to act: the earliest candidate; a decision beats an expiry on the same day. */
function soonestOf(
  desks: readonly SymbolDesk[],
  rows: readonly SymbolRow[],
): SymbolAction | undefined {
  const first = candidatesOf(desks, rows.length > 1).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : a.rank - b.rank,
  )[0];
  return first ? { date: first.date, what: first.what } : undefined;
}

/** The symbol's book across the desks given — undefined when none of them holds it. */
export function symbolBook(desks: readonly SymbolDesk[], symbol: string): SymbolBook | undefined {
  const mine = narrowDesks<SymbolDesk>(desks, symbol);
  if (mine.length === 0) return undefined;
  const wheel = mine.some(({ desk }) =>
    desk.positions.some((p) => p.playbookId?.startsWith("wheel-")),
  );
  const rows = mine.flatMap(({ desk }) => desk.positions.map((p) => rowOf(desk.id, p, wheel)));
  // Sold options first — they carry a date — then shares; the order the drawing reads in.
  const ordered = [...rows].sort(
    (a, b) => Number(!parseOccSymbol(a.symbol)) - Number(!parseOccSymbol(b.symbol)),
  );
  const invested = mine
    .flatMap(({ desk }) => desk.positions)
    .reduce((sum, p) => sum + (dollarsOf(p.value) ?? 0), 0);
  const pl = rows.reduce((sum, r) => sum + r.pl, 0);
  const soonest = soonestOf(mine, rows);
  return { symbol, invested, pl, rows: ordered, ...(soonest ? { soonest } : {}) };
}

/** What Events draws under `?symbol=`: the desks narrowed to it, its book, and the section's name.
 *  No symbol → every desk, as before. */
export function symbolView(
  desks: readonly SymbolDesk[] | undefined,
  symbol: string | undefined,
): {
  readonly desks: readonly SymbolDesk[];
  readonly book: SymbolBook | undefined;
  readonly named: string;
} {
  const all = desks ?? [];
  if (!symbol) return { desks: all, book: undefined, named: "Events" };
  return {
    desks: narrowDesks<SymbolDesk>(all, symbol),
    book: symbolBook(all, symbol),
    named: `Events on ${symbol}`,
  };
}

/** "Nov 6" — the day an action is due, short. */
export const actionDay = shortDay;
