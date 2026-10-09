import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { type Pair, pairFor, pairTable } from "../../src/playbooks/pair-table.js";
import { playbookIntents } from "../../src/playbooks/playbook.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { wheel } from "../../src/playbooks/wheel.js";
import { buildOccSymbol, humanizeOptionSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

/**
 * #4469 slice 2c — the wheel takes its ticker as a setting. `crwv-wheel.spec.ts` holds the CRWV
 * instance to every behaviour the hand-written playbook had; this file holds what the template
 * adds: the verdict, citation and retire date come from the pair row, a second ticker reads its
 * own, a pair with no dated verdict cannot be built, and CRWV-WHEEL's record — realized P/L,
 * option round trips, the guard's budget — reads exactly as it did under the same id.
 */

const CRWV_SETTING = {
  symbol: "CRWV",
  thesis:
    "Sell a cash-secured CRWV put about a month out; if assigned, sell covered calls on the shares " +
    "— run on its owner's conviction, against our own study of CRWV's premium.",
  findings:
    "AGAINST this play: implied 69.9% vs a median 88.7% realized (6th percentile); Δ0.20 puts " +
    "priced 19.4% to assign vs 33.3% delivered.",
  studySays: "our study found CRWV's option premium underpays its moves",
} as const;

// A row the real table does not have yet: a ✓ wheel on AMZN (the screen's only fit, unstudied).
const AMZN_PAIR: Pair = {
  id: "AMZN-WHEEL",
  strategy: "wheel",
  symbols: ["AMZN"],
  evidence: {
    status: "researched",
    call: "a test row",
    shelfOn: "2027-04-30",
    study: "docs/research/amzn-premium-fit.md",
  },
};
const withRow =
  (row: Pair): typeof pairFor =>
  (strategy, symbol) =>
    strategy === "wheel" && row.symbols.includes(symbol) ? row : pairFor(strategy, symbol);

// Wed 2026-11-18, 11:00 ET: the first session after CRWV's November blackout; Dec 31 is the
// latest listed expiry 30–45 days out before the February one.
const ASOF = "2026-11-18T16:00:00Z";
const EXPIRY = "2026-12-31";
const calendarFor = (symbol: string): readonly EarningsPrint[] => [
  {
    symbol,
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  },
  {
    symbol,
    date: "2027-02-25",
    status: "estimate",
    source: "test",
    window: { start: "2027-02-18", end: "2027-03-05" },
  },
];
const putAt = (symbol: string, strike: number) =>
  buildOccSymbol({ underlying: symbol, expiration: EXPIRY, type: "put", strike });

function market(symbol: string, spot = 92): MarketContext {
  const rows: readonly (readonly [number, number, number, number])[] = [
    [75, -0.15, 1.65, 1.85],
    [80, -0.21, 2.2, 2.4],
    [85, -0.28, 3.3, 3.5],
  ];
  const quotes = rows.map(([strike, delta, bid, ask]) =>
    anOptionQuote(putAt(symbol, strike), { bid, ask, delta, openInterest: 500, at: ASOF }),
  );
  return withOptionQuotes(aContext({ [symbol]: { last: spot } }, ASOF), quotes, {
    [symbol]: ["2026-11-20", "2026-12-18", EXPIRY, "2027-01-15"],
  });
}
const flat = (): Portfolio => aPortfolio({ cash: 100_000, positions: [] });

describe("CRWV-WHEEL — still the playbook it was", () => {
  it("equals main's playbook field by field (criterion 7)", () => {
    expect(CRWV_WHEEL).toMatchObject({
      id: "CRWV-WHEEL",
      symbols: ["CRWV"],
      thesis: CRWV_SETTING.thesis,
      evidence:
        "docs/research/crwv-premium-fit.md — AGAINST this play: implied 69.9% vs a median 88.7% " +
        "realized (6th percentile); Δ0.20 puts priced 19.4% to assign vs 33.3% delivered. Retires if " +
        "net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money.",
      size: { conservative: 0, standard: 0, aggressive: 0 },
      keyedOn: "earnings",
      options: { underlyings: ["CRWV"], holdsShortToExpiry: ["put", "call"], requiredLevel: 1 },
    });
    expect(CRWV_WHEEL).not.toHaveProperty("derivesFrom");
    expect(CRWV_WHEEL).not.toHaveProperty("mixedSignals");
  });

  it("sells the same put under the same id, reason and quantity as main", () => {
    const [put] = playbookIntents(
      [{ playbook: CRWV_WHEEL, mode: "standard" }],
      market("CRWV"),
      flat(),
      calendarFor("CRWV"),
    );
    expect(put).toMatchObject({
      playbookId: "CRWV-WHEEL",
      quantity: 1,
      strategy: "crwv-wheel-put",
      reason:
        `Selling one cash-secured ${humanizeOptionSymbol(putAt("CRWV", 80))} for about $2.30 a share ` +
        "($230 for the contract): $8,000 stays set aside in case CRWV finishes below $80 and the " +
        "shares are put to the bot. Run on its owner's conviction — our study found CRWV's option " +
        "premium underpays its moves.",
    });
  });
});

describe("wheel — the verdict comes from the pair row", () => {
  it("dates the retire rule by the row's check date, on the descriptor and on every order", () => {
    const crwv = pairFor("wheel", "CRWV") as Pair;
    const moved: Pair = { ...crwv, evidence: { ...crwv.evidence, checkOn: "2027-03-15" } };
    const playbook = wheel(CRWV_SETTING, withRow(moved));
    expect(playbook.evidence).toContain("below 0 on 2027-03-15");
    const [put] = playbook.decide?.(market("CRWV"), flat(), calendarFor("CRWV"), "standard") ?? [];
    expect(put?.forecast?.invalidator).toContain("net P/L is below 0 on 2027-03-15");
    expect(put?.forecast?.invalidator).not.toContain("2027-01-29");
  });

  it("frames a ✓ pair as the house's research, dated by its shelf date, on its own ticker", () => {
    const amzn = wheel(
      {
        symbol: "AMZN",
        thesis: "a test wheel",
        findings: "FOR this play: a test finding.",
        studySays: "our study found AMZN's premium pays for its moves",
      },
      withRow(AMZN_PAIR),
    );
    expect(amzn.id).toBe("AMZN-WHEEL");
    expect(amzn.symbols).toEqual(["AMZN"]);
    expect(amzn.options?.underlyings).toEqual(["AMZN"]);
    expect(amzn.evidence).toBe(
      "docs/research/amzn-premium-fit.md — FOR this play: a test finding. Retires if net P/L is " +
        "below 0 on 2027-04-30 or more than 1 in 3 sold puts finish in the money.",
    );
    const [put] = amzn.decide?.(market("AMZN"), flat(), calendarFor("AMZN"), "standard") ?? [];
    expect(put).toMatchObject({ symbol: "AMZN", quantity: 1, strategy: "amzn-wheel-put" });
    expect(put?.reason).toContain("in case AMZN finishes below $80");
    expect(put?.reason).toContain(
      "Run on the house's research — our study found AMZN's premium pays for its moves.",
    );
    expect(put?.reason).not.toContain("CRWV");
    expect(put?.forecast?.invalidator).toContain("below 0 on 2027-04-30");
  });
});

describe("wheel — a pair it cannot sell puts on", () => {
  const amznWith = (evidence: Pair["evidence"]) => () =>
    wheel({ ...CRWV_SETTING, symbol: "AMZN" }, withRow({ ...AMZN_PAIR, evidence }));

  it("throws for a ticker with no wheel row", () => {
    expect(() => wheel({ ...CRWV_SETTING, symbol: "AMZN" })).toThrow(/no pair-table row/);
  });

  it("throws for a row with no verdict: screened, stand aside, not studied", () => {
    for (const status of ["screened", "stand-aside", "not-studied", "cant-run"] as const) {
      expect(amznWith({ status, call: "x", study: "docs/research/x.md" })).toThrow(/no verdict/);
    }
  });

  it("throws for a verdict with no date to test it on, or no study to cite", () => {
    expect(amznWith({ status: "conviction", call: "x", study: "docs/research/x.md" })).toThrow(
      /no check date/,
    );
    expect(amznWith({ status: "researched", call: "x", study: "docs/research/x.md" })).toThrow(
      /no shelf date/,
    );
    expect(amznWith({ status: "researched", call: "x", shelfOn: "2027-01-01" })).toThrow(
      /no study to cite/,
    );
  });

  it("holds the real table to one wheel pair, CRWV's", () => {
    const wheels = pairTable().filter((pair) => pair.strategy === "wheel");
    expect(wheels.map((pair) => pair.id)).toEqual(["CRWV-WHEEL"]);
  });
});

/**
 * THE FIXTURE DATABASE: CRWV-WHEEL's record is keyed on its id, and the template keeps the id, so
 * the put it sells today scores into the same P/L, the same round trips and the same compounding
 * budget as the hand-written playbook's did (the plan's call 1: nothing migrates).
 */
describe("CRWV-WHEEL — its record reads unchanged on a fixture database", () => {
  const CID = "sk1-sauron-CRWV-k9x2-0";
  const T0 = Date.parse("2026-11-18T16:00:00.000Z");
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "wheel-template-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** The template's own put, placed, filled at its limit, and expired worthless. */
  function sellAndExpire(): OrderIntent {
    const [put] = playbookIntents(
      [{ playbook: CRWV_WHEEL, mode: "standard" }],
      market("CRWV"),
      flat(),
      calendarFor("CRWV"),
    );
    if (!put?.option) throw new Error("the wheel sold no put");
    const submitted = { ...put, clientOrderId: `${CID}-${T0}` };
    const cycle: DecisionRecord = {
      at: T0,
      personaId: "sauron",
      mode: "live",
      rawIntents: [put],
      guardedIntents: [put],
      outcomes: [
        {
          intent: submitted,
          action: "placed",
          result: { intent: submitted, status: "working", reason: "resting", orderId: "opt-1" },
        },
      ],
    };
    db.record(cycle);
    const occ = put.option.legs[0]?.occSymbol as string;
    db.recordSettlements([
      {
        orderId: "opt-1",
        clientOrderId: submitted.clientOrderId,
        status: "filled",
        filledQuantity: 1,
        filledPrice: put.option.limitPrice,
        legs: [{ occSymbol: occ, filledQuantity: 1, filledPrice: put.option.limitPrice }],
        settledAt: "2026-11-18T16:01:00.000Z",
      },
    ]);
    db.recordOptionLifecycle("sauron", [
      { id: "act-1", type: "OPEXP", symbol: occ, quantity: 1, at: "2026-12-31T23:59:59.999Z" },
    ]);
    return put;
  }

  it("scores the put's premium as CRWV-WHEEL's realized P/L, as one option round trip", () => {
    sellAndExpire();
    expect(db.realizedPlForPlaybook("sauron", "CRWV-WHEEL")).toBe(230);
    const trips = db.listRetrospectives("sauron");
    expect(trips).toHaveLength(1);
    expect(trips[0]).toMatchObject({ symbol: putAt("CRWV", 80), realized: 230, returnPct: 100 });
  });

  it("grows the guard's compounding budget by that P/L, so a put it could not afford now fits", () => {
    sellAndExpire();
    // One $80 put holds $8,000; $7,800 allocated is short until the $230 premium compounds in.
    const subscription = (compoundAllocation: boolean): PlaybookSubscription => ({
      accountId: "sauron",
      playbookId: CRWV_WHEEL.id,
      mode: "standard",
      capitalAllocated: 7_800,
      enabled: true,
      compoundAllocation,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    });
    const next = playbookIntents(
      [{ playbook: CRWV_WHEEL, mode: "standard" }],
      market("CRWV"),
      flat(),
      calendarFor("CRWV"),
    );
    const guard = (compound: boolean) =>
      applyGuardsWithVerdicts(next, flat(), market("CRWV"), {
        ...DEFAULT_RISK_CONFIG,
        discipline: { calendar: calendarFor("CRWV") },
        optionsLevel: 1,
        subscriptions: [subscription(compound)],
        realizedPlForPlaybook: (id) => db.realizedPlForPlaybook("sauron", id),
      });
    expect(guard(false).refused).toEqual([
      expect.objectContaining({ reason: "subscription-budget" }),
    ]);
    expect(guard(true).approved).toEqual([
      expect.objectContaining({ playbookId: "CRWV-WHEEL", quantity: 1 }),
    ]);
  });
});
