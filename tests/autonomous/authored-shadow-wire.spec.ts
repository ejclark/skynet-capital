import {
  buildShadowOrders,
  MAX_SHADOW_PLAYS,
  parseShadowOrders,
  parseShadowReport,
  RECENT_TRADES,
  SHADOW_ORDERS_KIND,
  SHADOW_REPORT_KIND,
  type ShadowReportEntry,
} from "../../src/autonomous/authored-shadow-wire.js";
import type { AuthoredPlayRecord } from "../../src/playbooks/authored-play-draft.js";
import { aSpec } from "../support/authored-shadow.js";

/**
 * THE SHADOW-TEST WIRE (#5457 slice 2). Orders go app → bots on the `/controls` poll; the report
 * comes back bots → app. Both fail closed: anything short of a clean payload is "not reported",
 * never a partial set — a partial set of tests would show a member someone else's ledger or lose
 * their own.
 */

const record = (over: Partial<AuthoredPlayRecord> = {}): AuthoredPlayRecord => ({
  id: "U-futurist-amd-run-up",
  name: "AMD run-up",
  status: "shadow",
  shadowSince: "2026-10-17T12:00:00.000Z",
  spec: aSpec(),
  createdAt: "2026-10-16T12:00:00.000Z",
  updatedAt: "2026-10-17T12:00:00.000Z",
  ...over,
});

describe("orders: app → bots", () => {
  it("carries every play in its test, whoever's, and nothing else", () => {
    const orders = buildShadowOrders(
      {
        a: [record(), record({ id: "U-futurist-draft", status: "draft" })],
        b: [record({ id: "U-sauron-x" })],
      },
      42,
    );
    expect(orders).toMatchObject({ kind: SHADOW_ORDERS_KIND, at: 42 });
    expect(orders.plays.map((p) => p.id)).toEqual(["U-futurist-amd-run-up", "U-sauron-x"]);
  });

  it("round-trips through JSON", () => {
    const orders = buildShadowOrders({ a: [record()] }, 1);
    expect(parseShadowOrders(JSON.parse(JSON.stringify(orders)))).toEqual(orders);
  });

  it("an empty set is a real answer: it is how a test is taken out", () => {
    expect(parseShadowOrders(buildShadowOrders({}, 1))).toMatchObject({ plays: [] });
  });

  it("is not reported for anything short of a clean set", () => {
    const good = JSON.parse(JSON.stringify(buildShadowOrders({ a: [record()] }, 1)));
    expect(parseShadowOrders(undefined)).toBeUndefined();
    expect(parseShadowOrders({ ...good, kind: "authored-shadow-orders.v0" })).toBeUndefined();
    expect(parseShadowOrders({ ...good, at: "now" })).toBeUndefined();
    expect(parseShadowOrders({ ...good, plays: "x" })).toBeUndefined();
    // One unreadable play voids the set: a partial set reads as the member's test being gone.
    expect(parseShadowOrders({ ...good, plays: [...good.plays, { id: "x" }] })).toBeUndefined();
    const basket = { ...good.plays[0], spec: { ...good.plays[0].spec, symbols: ["AMD", "NVDA"] } };
    expect(parseShadowOrders({ ...good, plays: [basket] })).toBeUndefined();
    const tooMany = Array.from({ length: MAX_SHADOW_PLAYS + 1 }, () => good.plays[0]);
    expect(parseShadowOrders({ ...good, plays: tooMany })).toBeUndefined();
  });

  it("carries no credential, holding or order: only the spec and when the test began", () => {
    const [play] = buildShadowOrders({ a: [record()] }, 1).plays;
    expect(Object.keys(play ?? {}).sort()).toEqual(["id", "since", "spec"]);
  });
});

const entry = (over: Partial<ShadowReportEntry> = {}): ShadowReportEntry => ({
  id: "U-futurist-amd-run-up",
  since: "2026-10-17T12:00:00.000Z",
  state: "watching",
  window: "long",
  sessions: 3,
  tradeCount: 2,
  roundTrips: 1,
  realized: 12.5,
  refused: 1,
  lastRefusal: { day: "2026-10-20", side: "buy", symbol: "AMD", reason: "position-cap" },
  holding: { quantity: 19, avgPrice: 100.05 },
  lastPassAt: 1_700_000_000_000,
  recent: [
    {
      at: 2,
      side: "sell",
      symbol: "AMD",
      quantity: 19,
      price: 109.95,
      bid: 109.95,
      ask: 110.05,
      realized: 188,
    },
    { at: 1, side: "buy", symbol: "AMD", quantity: 19, price: 100.05, bid: 99.95, ask: 100.05 },
  ],
  ...over,
});
const report = (plays: readonly ShadowReportEntry[] = [entry()]) => ({
  kind: SHADOW_REPORT_KIND,
  at: 1,
  plays,
});

describe("report: bots → app", () => {
  it("round-trips through JSON, with and without the optional parts", () => {
    expect(parseShadowReport(JSON.parse(JSON.stringify(report())))).toEqual(report());
    const bare = entry({
      lastRefusal: undefined,
      holding: undefined,
      lastPassAt: undefined,
      recent: [],
    });
    const parsed = parseShadowReport(JSON.parse(JSON.stringify(report([bare]))));
    expect(parsed?.plays[0]).not.toHaveProperty("holding");
    expect(parsed?.plays[0]).not.toHaveProperty("lastRefusal");
  });

  it("is not accepted for anything short of a clean report", () => {
    const bad = (e: Record<string, unknown>) =>
      parseShadowReport(JSON.parse(JSON.stringify(report([{ ...entry(), ...e } as never]))));
    expect(parseShadowReport(null)).toBeUndefined();
    expect(parseShadowReport({ ...report(), kind: "nope" })).toBeUndefined();
    expect(bad({ state: "running" })).toBeUndefined();
    expect(bad({ window: "wide-open" })).toBeUndefined();
    expect(bad({ sessions: "3" })).toBeUndefined();
    expect(bad({ realized: Number.NaN })).toBeUndefined();
    expect(bad({ holding: { quantity: 1 } })).toBeUndefined();
    expect(
      bad({ lastRefusal: { day: "d", side: "buy", symbol: "X", reason: "made-up" } }),
    ).toBeUndefined();
    expect(bad({ recent: [{ at: 1 }] })).toBeUndefined();
    expect(
      bad({ recent: Array.from({ length: RECENT_TRADES + 1 }, () => entry().recent[0]) }),
    ).toBeUndefined();
    expect(
      parseShadowReport({
        ...report(),
        plays: Array.from({ length: MAX_SHADOW_PLAYS + 1 }, () => entry()),
      }),
    ).toBeUndefined();
  });

  it("a refusal reason must be one the guards really have", () => {
    const parsed = parseShadowReport(JSON.parse(JSON.stringify(report())));
    expect(parsed?.plays[0]?.lastRefusal?.reason).toBe("position-cap");
  });
});
