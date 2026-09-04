import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { createProgressionService } from "../../src/server/progression-service.js";
import { ProgressionStore } from "../../src/server/progression-store.js";

/**
 * Course-graduation ceremonies (#469 slice 4) — split out of `progression-service.spec.ts` at the
 * 500-line cap (`scripts/arch-scan.mjs`). `acknowledge()`'s graduation bookkeeping deserves its own
 * fixtures: it re-derives the REAL earned set from the ledgers rather than trusting the client's
 * `ack` ids, so an option milestone (201/202) needs a real OCC symbol + open tag to prove itself.
 */

const journalLine = (over: Partial<TradeActivityRecord>): TradeActivityRecord => ({
  orderId: "o1",
  participantId: "ann",
  symbol: "AAPL",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-25T14:00:00.000Z",
  source: "stream",
  ...over,
});

const tagLine = (over: Partial<OrderAuditRecord>): OrderAuditRecord => ({
  participantId: "ann",
  orderId: "o1",
  at: "2026-08-25T13:59:59.000Z",
  ...over,
});

const OCC_PUT = "MSFT260918P00420000";
const OCC_CALL = "MSFT260918C00500000";

describe("progression service — graduation ceremonies (#469 slice 4)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "progression-svc-graduation-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Real fills + tags proving BOTH course 100 (buy, sell) and course 200 (CSP, CC). */
  const course100And200 = () =>
    createProgressionService({
      readFills: () =>
        Promise.resolve([
          journalLine({ orderId: "b1" }),
          journalLine({ orderId: "s1", side: "sell", at: "2026-08-25T15:00:00.000Z" }),
          journalLine({
            orderId: "csp",
            symbol: OCC_PUT,
            side: "sell",
            at: "2026-08-25T16:00:00.000Z",
          }),
          journalLine({
            orderId: "cc",
            symbol: OCC_CALL,
            side: "sell",
            at: "2026-08-25T17:00:00.000Z",
          }),
        ]),
      readTags: () =>
        Promise.resolve([
          tagLine({ orderId: "csp", code: "201", intent: "open", side: "sell" }),
          tagLine({ orderId: "cc", code: "202", intent: "open", side: "sell" }),
        ]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });

  it("reports a course level graduated exactly once, on the acknowledge that completes it", async () => {
    const svc = course100And200();
    // first-buy graduates nothing (it isn't course 100's LAST milestone); first-sell does.
    expect(await svc.acknowledge("ann", ["first-buy"])).toEqual([]);
    expect(await svc.acknowledge("ann", ["first-sell"])).toEqual([100]);

    // Re-acknowledging the same id (a retry, a double-submit) never re-graduates it.
    expect(await svc.acknowledge("ann", ["first-sell"])).toEqual([]);
  });

  it("persists which levels have already graduated, across service instances", async () => {
    const svc = course100And200();
    await svc.acknowledge("ann", ["first-buy", "first-sell"]);
    const store = new ProgressionStore(join(dir, "progression.json"));
    expect(store.get("ann")?.graduated).toEqual([100]);

    const again = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });
    expect(await again.acknowledge("ann", ["first-sell"])).toEqual([]); // already banked
  });

  it("names both graduated courses when a single acknowledge spans two at once", async () => {
    const svc = course100And200();
    const graduated = await svc.acknowledge("ann", [
      "first-sell", // graduates 100
      "first-covered-call", // graduates 200
    ]);
    const store = new ProgressionStore(join(dir, "progression.json"));
    expect([...graduated].sort()).toEqual([100, 200]);
    expect([...(store.get("ann")?.graduated ?? [])].sort()).toEqual([100, 200]);
  });

  it("never graduates a course from a client-claimed id alone — the real ledger must prove it", async () => {
    // "ann" here has NO real fills at all: acknowledging an id an attacker (or a stale UI) might
    // submit must graduate nothing, because there is no proof behind it.
    const svc = createProgressionService({
      readFills: () => Promise.resolve([]),
      readTags: () => Promise.resolve([]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });
    expect(await svc.acknowledge("ann", ["first-covered-call"])).toEqual([]);
  });

  it("never graduates course 200 from the covered-call fill alone, without the CSP leg too", async () => {
    // Seeded/imported history can hold a course's LAST milestone without an earlier one
    // (`unlockedCodes`'s own doc) — a real gap this must never mistake for a graduation.
    const svc = createProgressionService({
      readFills: () =>
        Promise.resolve([
          journalLine({
            orderId: "cc",
            symbol: OCC_CALL,
            side: "sell",
            at: "2026-08-25T17:00:00.000Z",
          }),
        ]),
      readTags: () =>
        Promise.resolve([tagLine({ orderId: "cc", code: "202", intent: "open", side: "sell" })]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });
    expect(await svc.acknowledge("ann", ["first-covered-call"])).toEqual([]);
  });

  it("skips the ledger reads entirely for an ordinary claim that could never graduate anything", async () => {
    let reads = 0;
    const svc = createProgressionService({
      readFills: () => {
        reads++;
        return Promise.resolve([]);
      },
      readTags: () => Promise.resolve([]),
      store: new ProgressionStore(join(dir, "progression.json")),
    });
    // "first-buy" is course 100's FIRST milestone, never its last — no read is worth doing.
    expect(await svc.acknowledge("ann", ["first-buy", "first-message"])).toEqual([]);
    expect(reads).toBe(0);
  });

  it("skips the ledger reads when the only graduating id is already banked", async () => {
    let reads = 0;
    const store = new ProgressionStore(join(dir, "progression.json"));
    store.set("ann", { graduated: [100] });
    const svc = createProgressionService({
      readFills: () => {
        reads++;
        return Promise.resolve([]);
      },
      readTags: () => Promise.resolve([]),
      store,
    });
    expect(await svc.acknowledge("ann", ["first-sell"])).toEqual([]);
    expect(reads).toBe(0);
  });
});
