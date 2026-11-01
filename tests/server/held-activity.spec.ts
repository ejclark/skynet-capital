import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rstest } from "@rstest/core";
import { collapseActivity, JsonlActivityStore } from "../../src/observatory/activity-store.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import { NO_ORIGIN_EVIDENCE, orderOriginIndex } from "../../src/observatory/order-origin.js";
import { heldActivity, heldOrderOrigins } from "../../src/server/held-activity.js";
import { JsonlOrderAuditLog, type OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { InMemoryOrderAuditLog } from "../../src/server/order-audit-memory-log.js";

// The held folds (#4619) must hand every consumer exactly what a whole read would. The oracle is
// what each consumer did before the fold existed: collapse the listed lines per order
// (`collapseActivity`), or index the listed audit lines (`orderOriginIndex`). Each spec appends in
// steps and compares after every step, so a fold that drifts at any point fails at that point.

const fill = (over: Record<string, unknown>) => ({
  orderId: "o1",
  participantId: "ann",
  symbol: "AAPL",
  side: "buy" as const,
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-08-25T14:00:00.000Z",
  source: "stream" as const,
  ...over,
});
const line = (over: Partial<OrderAuditRecord>): OrderAuditRecord => ({
  participantId: "ann",
  orderId: "o1",
  at: "2026-08-25T13:59:59.000Z",
  ...over,
});

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "held-activity-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("held activity — a held fold equals the whole read", () => {
  it("collapses to what the whole ledger collapses to, after every step", async () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    const read = heldActivity(store);
    const steps: Array<() => Promise<void>> = [
      () => Promise.resolve(), // nothing recorded yet
      () => store.record(fill({ orderId: "a", at: "2026-08-25T14:00:00.000Z" })),
      // a partial fill, then the complete one: the order's state is its latest, fullest line
      () => store.record(fill({ orderId: "b", filledQuantity: 3, at: "2026-08-23T15:00:00.000Z" })),
      () =>
        store.record(fill({ orderId: "b", filledQuantity: 10, at: "2026-08-23T15:00:05.000Z" })),
      // a backfill line must not regress a live-captured fill
      () => store.record(fill({ orderId: "b", filledQuantity: 3, at: "2026-08-23T16:00:00.000Z" })),
      // two orders sharing a timestamp: insertion order breaks the tie
      () => store.record(fill({ orderId: "c", side: "sell", at: "2026-08-24T10:00:00.000Z" })),
      () => store.record(fill({ orderId: "d", side: "sell", at: "2026-08-24T10:00:00.000Z" })),
      // an earlier order gains a later line after others were recorded
      () => store.record(fill({ orderId: "a", status: "filled", at: "2026-08-25T14:00:09.000Z" })),
    ];
    for (const [i, step] of steps.entries()) {
      await step();
      // Consumers collapse first; the held list must collapse to the identical, ordered result.
      expect(collapseActivity(await read("ann")), `after step ${i}`).toEqual(
        collapseActivity(await store.list("ann")),
      );
    }
  });

  it("reads nothing but a file size when the ledger did not move", async () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    await store.record(fill({}));
    const since = rstest.spyOn(store, "since");
    const list = rstest.spyOn(store, "list");
    const read = heldActivity(store);
    const first = await read("ann");
    const again = await read("ann");
    expect(again).toBe(first); // the held answer itself, not a rebuilt equal one
    expect(list).not.toHaveBeenCalled();
    expect(since.mock.calls[1]?.[1]).toBeGreaterThan(0);
  });

  it("is one reader per store, so every consumer shares one fold", () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    expect(heldActivity(store)).toBe(heldActivity(store));
    expect(heldActivity(new JsonlActivityStore(join(dir, "other")))).not.toBe(heldActivity(store));
  });

  it("starts over when the ledger file is replaced by a shorter one", async () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    await store.record(fill({ orderId: "a" }));
    await store.record(fill({ orderId: "b", side: "sell" }));
    const read = heldActivity(store);
    expect((await read("ann")).map((r) => r.orderId)).toEqual(["a", "b"]);
    writeFileSync(join(dir, "activity", "ann.jsonl"), "");
    appendFileSync(
      join(dir, "activity", "ann.jsonl"),
      `${JSON.stringify(fill({ orderId: "z" }))}\n`,
    );
    expect((await read("ann")).map((r) => r.orderId)).toEqual(["z"]);
  });

  it("folds reads landing together once, not twice", async () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    await store.record(fill({ orderId: "a" }));
    const read = heldActivity(store);
    await read("ann");
    await store.record(fill({ orderId: "b", side: "sell" }));
    const answers = await Promise.all([read("ann"), read("ann"), read("ann")]);
    for (const answer of answers) {
      expect(collapseActivity(answer)).toEqual(collapseActivity(await store.list("ann")));
    }
  });

  it("keeps participants apart", async () => {
    const store = new JsonlActivityStore(join(dir, "activity"));
    await store.record(fill({ participantId: "ann", orderId: "a" }));
    await store.record(fill({ participantId: "bob", orderId: "b" }));
    const read = heldActivity(store);
    expect((await read("ann")).map((r) => r.orderId)).toEqual(["a"]);
    expect((await read("bob")).map((r) => r.orderId)).toEqual(["b"]);
    expect(await read("cy")).toEqual([]);
  });

  it("reads whole from a store with no append-aware read", async () => {
    const store = new InMemoryActivityStore();
    const read = heldActivity(store);
    expect(await read("ann")).toEqual([]);
    await store.record(fill({}));
    expect((await read("ann")).map((r) => r.orderId)).toEqual(["o1"]);
  });
});

describe("held order origins — a held fold equals the index of the whole audit", () => {
  it("matches after every step, the earliest line and every order id included", async () => {
    const log = new JsonlOrderAuditLog(join(dir, "audit"));
    const read = heldOrderOrigins(log);
    const steps: Array<() => Promise<void>> = [
      () => Promise.resolve(), // no audit yet: no coverage, classify nothing
      () => log.record(line({ orderId: "a", at: "2026-08-25T10:00:00.000Z" })),
      () => log.record(line({ orderId: "b", at: "2026-08-24T10:00:00.000Z" })), // an earlier start
      () => log.record(line({ orderId: "a", intent: "cancel", at: "2026-08-26T10:00:00.000Z" })),
    ];
    for (const [i, step] of steps.entries()) {
      await step();
      expect(await read("ann", "human"), `after step ${i}`).toEqual(
        orderOriginIndex(await log.list("ann"), "human"),
      );
    }
  });

  it("never reads the audit for a bot's desk", async () => {
    const log = new JsonlOrderAuditLog(join(dir, "audit"));
    await log.record(line({ participantId: "sauron" }));
    const since = rstest.spyOn(log, "since");
    expect(await heldOrderOrigins(log)("sauron", "bot")).toBe(NO_ORIGIN_EVIDENCE);
    expect(since).not.toHaveBeenCalled();
  });

  it("holds the answer while nothing is appended, and a copy a later append cannot reach", async () => {
    const log = new JsonlOrderAuditLog(join(dir, "audit"));
    await log.record(line({ orderId: "a" }));
    const read = heldOrderOrigins(log);
    const first = await read("ann", "human");
    expect(await read("ann", "human")).toBe(first);
    await log.record(line({ orderId: "b" }));
    expect([...first.deskOrderIds]).toEqual(["a"]);
    expect([...(await read("ann", "human")).deskOrderIds]).toEqual(["a", "b"]);
  });

  it("reads whole from a log with no append-aware read", async () => {
    const log = new InMemoryOrderAuditLog();
    const read = heldOrderOrigins(log);
    expect(await read("ann", "human")).toBe(NO_ORIGIN_EVIDENCE);
    await log.record(line({ orderId: "a" }));
    expect([...(await read("ann", "human")).deskOrderIds]).toEqual(["a"]);
  });
});
