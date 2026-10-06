import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent, Portfolio, Position } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, type RiskConfig } from "../../src/engine/guards.js";
import { buildOccSymbol, parseOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, withOptionQuotes } from "../support/builders.js";

// A PROPERTY, not an example: every batch the guards approve must leave the book covered in EVERY
// fill/no-fill combination of what they approved. The checker below is independent of the code under
// test — it searches every one-to-one cover assignment itself and never calls `coverNeeds` or
// `coverShortfall` — so it judges the guards against the definition, not against their own
// arithmetic. It is the #4645 red-team's oracle, kept: its first runs found a buy-back paid out of a
// put's collateral, a covered book read as short of cash, and a spread's premium counted against an
// outcome where it never filled (1,753 failing batches in 20,000; 0 after the fix).
//
// Covered means: each sold call has 100 free shares or a distinct long call expiring no earlier (plus
// the strikes' width in cash when the long is higher); each sold put has its strike in cash or a
// distinct long put expiring no earlier (plus the width when the long is lower); premiums and share
// buys paid out of the same cash. Premiums RECEIVED are not counted — the guards' own stance.

const AS_OF = "2026-10-07T15:00:00Z";
const UNIVERSE: Record<string, { last: number; strikes: readonly number[] }> = {
  CRWV: { last: 90, strikes: [80, 85, 90, 95, 100, 105] },
  NVDA: { last: 180, strikes: [160, 170, 180, 190, 200, 210] },
};
const EXPIRIES = ["2026-10-16", "2026-10-30", "2026-11-06"];
const CALENDAR: readonly EarningsPrint[] = [
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
  {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-17", end: "2026-11-20" },
  },
];
// Only cover, cash and shares may refuse: every level, print, quote and budget rule is satisfied.
const CONFIG: RiskConfig = {
  maxPositionPct: 1_000,
  optionsLevel: 3,
  discipline: { calendar: CALENDAR },
  subscriptions: [
    {
      accountId: "test",
      playbookId: "WHEEL",
      mode: "standard",
      capitalAllocated: 1e9,
      enabled: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ],
  playbookSymbols: new Map([["WHEEL", ["CRWV", "NVDA"]]]),
};

interface Contract {
  readonly occ: string;
  readonly underlying: string;
  readonly type: "call" | "put";
  readonly strike: number;
  readonly expiry: number;
  readonly bid: number;
  readonly ask: number;
}
const cents = (x: number): number => Math.round(x * 100) / 100;
const CONTRACTS: readonly Contract[] = Object.entries(UNIVERSE).flatMap(([underlying, u]) =>
  EXPIRIES.flatMap((expiration, expiry) =>
    u.strikes.flatMap((strike) =>
      (["call", "put"] as const).map((type) => {
        const intrinsic = Math.max(0, type === "call" ? u.last - strike : strike - u.last);
        const mid = Math.max(
          0.3,
          intrinsic + (expiry + 1) * 3 * Math.exp(-Math.abs(u.last - strike) / 15),
        );
        const occ = buildOccSymbol({ underlying, expiration, type, strike });
        return {
          occ,
          underlying,
          type,
          strike,
          expiry,
          bid: cents(mid - 0.1),
          ask: cents(mid + 0.1),
        };
      }),
    ),
  ),
);
const BY_OCC = new Map(CONTRACTS.map((c) => [c.occ, c]));
const CONTEXT = withOptionQuotes(
  aContext(
    Object.fromEntries(Object.entries(UNIVERSE).map(([s, u]) => [s, { last: u.last }])),
    AS_OF,
  ),
  CONTRACTS.map((c) => anOptionQuote(c.occ, { bid: c.bid, ask: c.ask, at: AS_OF })),
);

// ---- the independent checker ----

interface Book {
  readonly cash: number;
  readonly shares: ReadonlyMap<string, number>;
  readonly contracts: ReadonlyMap<string, number>;
}
const bookOf = (p: Portfolio): Book => {
  const shares = new Map<string, number>();
  const contracts = new Map<string, number>();
  for (const { symbol, quantity } of p.positions) {
    const into = parseOccSymbol(symbol) ? contracts : shares;
    into.set(symbol, (into.get(symbol) ?? 0) + quantity);
  }
  return { cash: p.cash, shares, contracts };
};

/** The book once `intent` filled whole. Premiums and share-sale proceeds received are not counted. */
function fill(book: Book, intent: OrderIntent): Book {
  const shares = new Map(book.shares);
  const contracts = new Map(book.contracts);
  let cash = book.cash;
  if (intent.option) {
    const { legs, limitPrice } = intent.option;
    for (const leg of legs) {
      const signed = (leg.side === "buy" ? 1 : -1) * leg.ratio * intent.quantity;
      contracts.set(leg.occSymbol, (contracts.get(leg.occSymbol) ?? 0) + signed);
    }
    const paysPerShare =
      legs.length === 2 ? Math.max(0, limitPrice) : legs[0]?.side === "buy" ? limitPrice : 0;
    cash -= paysPerShare * 100 * intent.quantity;
  } else {
    const delta = intent.side === "buy" ? intent.quantity : -intent.quantity;
    shares.set(intent.symbol, (shares.get(intent.symbol) ?? 0) + delta);
    if (intent.side === "buy") cash -= (CONTEXT.quotes[intent.symbol]?.ask ?? 0) * intent.quantity;
  }
  return { cash, shares, contracts };
}

type Unit = { readonly strike: number; readonly expiry: number };

/** Every (shares, cash) one underlying's sold contracts of one type can be covered at, best only. */
function frontier(
  shorts: readonly Unit[],
  longs: readonly Unit[],
  type: "call" | "put",
): [number, number][] {
  const search = (i: number, used: number): [number, number][] => {
    const short = shorts[i];
    if (!short) return [[0, 0]];
    const out: [number, number][] = [];
    const bare: [number, number] = type === "call" ? [100, 0] : [0, short.strike * 100];
    for (const [s, c] of search(i + 1, used)) out.push([s + bare[0], c + bare[1]]);
    longs.forEach((long, j) => {
      if (used & (1 << j) || long.expiry < short.expiry) return;
      const width =
        Math.max(0, type === "call" ? long.strike - short.strike : short.strike - long.strike) *
        100;
      for (const [s, c] of search(i + 1, used | (1 << j))) out.push([s, c + width]);
    });
    return out;
  };
  return search(0, 0);
}

/** Whether every sold contract in `book` is covered, under the best assignment. */
function covered(book: Book): boolean {
  let cashNeeded = 0;
  for (const underlying of Object.keys(UNIVERSE)) {
    const units = {
      call: { s: [] as Unit[], l: [] as Unit[] },
      put: { s: [] as Unit[], l: [] as Unit[] },
    };
    for (const [occ, quantity] of book.contracts) {
      const c = BY_OCC.get(occ);
      if (!c || c.underlying !== underlying) continue;
      for (let n = 0; n < Math.abs(quantity); n += 1) {
        (quantity < 0 ? units[c.type].s : units[c.type].l).push({
          strike: c.strike,
          expiry: c.expiry,
        });
      }
    }
    const held = Math.max(0, book.shares.get(underlying) ?? 0);
    const calls = frontier(units.call.s, units.call.l, "call").filter(([s]) => s <= held);
    if (calls.length === 0) return false;
    cashNeeded += Math.min(...calls.map(([, c]) => c));
    cashNeeded += Math.min(...frontier(units.put.s, units.put.l, "put").map(([, c]) => c));
  }
  return cashNeeded <= book.cash + 1e-6;
}

/** The first way an approved batch breaks: an outcome left uncovered, shares sold short, or more
 *  contracts closed than held. Insolvency with nothing left to cover (a buy-back the account cannot
 *  pay) is the broker's to refuse, and is not counted. */
function breaks(start: Portfolio, approved: readonly OrderIntent[]): string | undefined {
  const origin = bookOf(start);
  for (let filled = 1; filled < 2 ** approved.length; filled++) {
    let book = origin;
    approved.forEach((intent, i) => {
      if (filled & (2 ** i)) book = fill(book, intent);
    });
    for (const [symbol, quantity] of book.shares) {
      if (quantity < 0) return `outcome ${filled.toString(2)}: ${symbol} sold short`;
    }
    const shortsLeft = [...book.contracts.values()].some((q) => q < 0);
    if (!covered(book) && (shortsLeft || book.cash >= 0))
      return `outcome ${filled.toString(2)}: uncovered`;
  }
  const closed = new Map<string, number>();
  for (const intent of approved) {
    if (intent.option?.effect !== "close") continue;
    for (const leg of intent.option.legs) {
      const key = `${leg.side}:${leg.occSymbol}`;
      closed.set(key, (closed.get(key) ?? 0) + leg.ratio * intent.quantity);
    }
  }
  for (const [key, quantity] of closed) {
    const [side, occ] = key.split(":") as [string, string];
    const held = origin.contracts.get(occ) ?? 0;
    if (quantity > Math.max(0, side === "sell" ? held : -held))
      return `closes ${quantity} of ${occ}`;
  }
  return undefined;
}

// ---- seeded batches ----

function rng(seed: number) {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number): number => lo + Math.floor(next() * (hi - lo + 1));
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)] as T;
  return { next, int, pick };
}

const order = (
  symbol: string,
  side: "buy" | "sell",
  quantity: number,
  option: OrderIntent["option"],
  owned = true,
): OrderIntent => ({
  symbol,
  side,
  quantity,
  type: "limit",
  reason: "property",
  ...(owned ? { playbookId: "WHEEL", playbookMode: "standard" } : {}),
  ...(option ? { option } : {}),
});
const one = (
  c: Contract,
  side: "buy" | "sell",
  effect: "open" | "close",
  limitPrice: number,
  quantity = 1,
): OrderIntent =>
  order(
    c.underlying,
    side,
    quantity,
    {
      effect,
      structure:
        effect === "close" ? "close" : c.type === "put" ? "cash-secured-put" : "covered-call",
      legs: [{ occSymbol: c.occ, side, ratio: 1 }],
      limitPrice,
    },
    effect === "open",
  );

/** A book every sold contract of which is covered (else none), and a batch of 2–6 intents on it. */
function aCase(
  seed: number,
): { readonly portfolio: Portfolio; readonly batch: readonly OrderIntent[] } | undefined {
  const r = rng(seed);
  const names = Object.keys(UNIVERSE);
  const focus = r.next() < 0.7 ? [r.pick(names)] : names;
  const positions: Position[] = [];
  for (const u of focus) {
    const q = r.pick([0, 0, 0, 50, 100, 100, 150, 200, 200, 300]);
    if (q > 0) positions.push({ symbol: u, quantity: q, avgPrice: UNIVERSE[u]?.last ?? 0 });
  }
  const pool = CONTRACTS.filter((c) => focus.includes(c.underlying));
  const used = new Set<string>();
  for (let k = r.int(0, 4); k > 0; k -= 1) {
    const c = r.pick(pool);
    if (used.has(c.occ)) continue;
    used.add(c.occ);
    positions.push({
      symbol: c.occ,
      quantity: r.pick([-2, -1, -1, 1, 1, 2]),
      avgPrice: cents((c.bid + c.ask) / 2),
    });
  }
  // Cash: exactly what the best cover needs, plus a random slack — so tight books are common.
  let need = 0;
  for (const tryCash of [0, 1e3, 1e4, 3e4, 1e5, 3e5]) {
    if (covered(bookOf({ cash: tryCash, positions }))) {
      need = tryCash;
      break;
    }
    if (tryCash === 3e5) return undefined;
  }
  let low = need > 0 ? need / 10 - 1 : 0;
  while (need - low > 1) {
    const mid = Math.floor((low + need) / 2);
    if (covered(bookOf({ cash: mid, positions }))) need = mid;
    else low = mid;
  }
  const cash =
    need + r.pick([0, 0, 0, r.int(0, 300), r.int(0, 1_000), r.int(0, 9_000), r.int(0, 30_000)]);
  const held = positions.flatMap((p) => {
    const c = BY_OCC.get(p.symbol);
    return c ? [{ c, quantity: p.quantity }] : [];
  });
  const inside = (lo: number, hi: number): number => cents(lo + r.next() * (hi - lo));
  const batch: OrderIntent[] = [];
  for (let tries = 0; batch.length < r.int(2, 6) && tries < 40; tries += 1) {
    const u = r.pick(focus);
    const kind = r.pick([
      "put",
      "call",
      "spread",
      "close",
      "close",
      "vertical",
      "buy",
      "sell",
    ] as const);
    const ofType = (type: "call" | "put") =>
      pool.filter((c) => c.underlying === u && c.type === type);
    if (kind === "put" || kind === "call") {
      const c = r.pick(ofType(kind));
      batch.push(one(c, "sell", "open", inside(c.bid, c.ask)));
    } else if (kind === "spread") {
      const e = r.int(0, EXPIRIES.length - 1);
      const calls = ofType("call").filter((c) => c.expiry === e);
      const a = r.int(0, calls.length - 2);
      const lo = calls[a] as Contract;
      const hi = calls[r.int(a + 1, calls.length - 1)] as Contract;
      const high = cents(lo.ask - hi.bid);
      if (high <= 0.01) continue;
      batch.push(
        order(u, "buy", 1, {
          effect: "open",
          structure: "call-debit-spread",
          legs: [
            { occSymbol: lo.occ, side: "buy", ratio: 1 },
            { occSymbol: hi.occ, side: "sell", ratio: 1 },
          ],
          limitPrice: inside(Math.max(0.01, cents(lo.bid - hi.ask)), high),
        }),
      );
    } else if (kind === "close") {
      if (held.length === 0) continue;
      const h = r.pick(held);
      batch.push(
        one(
          h.c,
          h.quantity > 0 ? "sell" : "buy",
          "close",
          inside(h.c.bid, h.c.ask),
          r.int(1, Math.abs(h.quantity) + 1),
        ),
      );
    } else if (kind === "vertical") {
      const pairs = held.flatMap((a) =>
        held
          .filter(
            (b) =>
              a.quantity > 0 &&
              b.quantity < 0 &&
              a.c.underlying === b.c.underlying &&
              a.c.type === b.c.type &&
              a.c.expiry === b.c.expiry,
          )
          .map((b) => [a, b] as const),
      );
      if (pairs.length === 0) continue;
      const [long, short] = r.pick(pairs);
      let limit = inside(cents(short.c.bid - long.c.ask), cents(short.c.ask - long.c.bid));
      if (limit === 0) limit = 0.01;
      batch.push(
        order(
          long.c.underlying,
          limit > 0 ? "buy" : "sell",
          r.int(1, Math.min(long.quantity, -short.quantity)),
          {
            effect: "close",
            structure: "close",
            legs: [
              { occSymbol: long.c.occ, side: "sell", ratio: 1 },
              { occSymbol: short.c.occ, side: "buy", ratio: 1 },
            ],
            limitPrice: limit,
          },
          false,
        ),
      );
    } else {
      const quantity =
        kind === "buy" ? r.pick([1, 10, 50, 100, 200]) : r.pick([50, 100, 150, 200, 300]);
      batch.push({ symbol: u, side: kind, quantity, type: "market", reason: "property" });
    }
  }
  return { portfolio: { cash, positions }, batch };
}

const SEEDS = 1_500;

describe("the guards — soundness over every fill/no-fill outcome (property)", () => {
  it(`never approves a batch that leaves any outcome uncovered, oversold or overclosed (${SEEDS} seeded books)`, () => {
    const broken: string[] = [];
    let checked = 0;
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const c = aCase(seed);
      if (!c) continue;
      checked += 1;
      const { approved } = applyGuardsWithVerdicts(c.batch, c.portfolio, CONTEXT, CONFIG);
      const why = breaks(c.portfolio, approved);
      if (why) broken.push(`seed ${seed}: ${why}`);
    }
    expect(checked).toBeGreaterThan(SEEDS / 2);
    expect(broken).toEqual([]);
  });
});
