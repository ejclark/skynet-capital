import { appendFileSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rstest } from "@rstest/core";
import { deriveEarned } from "../../src/domain/progression.js";
import { collapseActivity, JsonlActivityStore } from "../../src/observatory/activity-store.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import { ladderEvidenceReader } from "../../src/server/ladder-evidence.js";
import { JsonlOrderAuditLog, type OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { InMemoryOrderAuditLog } from "../../src/server/order-audit-memory-log.js";

// The held ladder fold (#4619) must give exactly what a whole read gives. The oracle is the
// derivation the service ran before the fold existed: collapse every journal line per order, join
// the order audit's tags, derive the earned milestones. Each spec appends in steps and compares
// after every step, so a fold that drifts at any point fails at that point.

const OPTION = "AAPL260918C00200000"; // an OCC symbol: earns only when a tag says it opened a play
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
const tag = (over: Partial<OrderAuditRecord>): OrderAuditRecord => ({
  participantId: "ann",
  orderId: "o1",
  at: "2026-08-25T13:59:59.000Z",
  ...over,
});

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ladder-evidence-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function stores() {
  return {
    activity: new JsonlActivityStore(join(dir, "activity")),
    orderAudit: new JsonlOrderAuditLog(join(dir, "audit")),
  };
}

/** What the service computed before the fold: every line read, collapsed, derived. */
async function wholeRead(s: ReturnType<typeof stores>) {
  const journal = await s.activity.list("ann");
  return {
    earned: deriveEarned(collapseActivity(journal), await s.orderAudit.list("ann")),
    hasFill: journal.some((f) => f.filledQuantity > 0),
  };
}

describe("ladder evidence — a held fold equals the whole read", () => {
  it("matches after every step of an interleaved history, ties and overrides included", async () => {
    const s = stores();
    const read = ladderEvidenceReader(s);
    const steps: Array<() => Promise<void>> = [
      () => Promise.resolve(), // nothing recorded yet
      () => s.activity.record(fill({ orderId: "a", side: "buy", at: "2026-08-25T14:00:00.000Z" })),
      // a partial fill, then the complete one: the order's evidence is its latest, fullest line
      () =>
        s.activity.record(
          fill({ orderId: "b", filledQuantity: 3, at: "2026-08-23T15:00:00.000Z" }),
        ),
      () =>
        s.activity.record(
          fill({ orderId: "b", filledQuantity: 10, at: "2026-08-23T15:00:05.000Z" }),
        ),
      // a backfill line must not regress a live-captured fill
      () =>
        s.activity.record(
          fill({ orderId: "b", filledQuantity: 3, at: "2026-08-23T16:00:00.000Z" }),
        ),
      // two different orders sharing a timestamp: insertion order picks the evidence
      () => s.activity.record(fill({ orderId: "c", side: "sell", at: "2026-08-24T10:00:00.000Z" })),
      () => s.activity.record(fill({ orderId: "d", side: "sell", at: "2026-08-24T10:00:00.000Z" })),
      // an option fill earns nothing without its open tag...
      () =>
        s.activity.record(fill({ orderId: "e", symbol: OPTION, at: "2026-08-26T14:00:00.000Z" })),
      // ...earns once the tag lands (the tag arrives after the fill)...
      () => s.orderAudit.record(tag({ orderId: "e", intent: "open", code: "201" })),
      // ...and loses it when a later line for the same order says otherwise
      () => s.orderAudit.record(tag({ orderId: "e", intent: "cancel" })),
      () => s.orderAudit.record(tag({ orderId: "e", intent: "open", code: "201" })),
      // a same-day option open also earns 501
      () =>
        s.activity.record(
          fill({ orderId: "f", symbol: "AAPL260826C00200000", at: "2026-08-26T15:00:00.000Z" }),
        ),
      () => s.orderAudit.record(tag({ orderId: "f", intent: "open", code: "202" })),
      // an unfilled order proves nothing
      () => s.activity.record(fill({ orderId: "g", filledQuantity: 0, status: "new" })),
    ];
    for (const [i, step] of steps.entries()) {
      await step();
      expect(await read("ann"), `after step ${i}`).toEqual(await wholeRead(s));
    }
    expect((await read("ann")).earned.length).toBeGreaterThan(2);
  });

  it("reads nothing but a file size when neither ledger moved", async () => {
    const s = stores();
    await s.activity.record(fill({}));
    const since = rstest.spyOn(s.activity, "since");
    const list = rstest.spyOn(s.activity, "list");
    const read = ladderEvidenceReader(s);
    const first = await read("ann");
    const again = await read("ann");
    expect(again).toBe(first); // the held answer itself, not a rebuilt equal one
    expect(list).not.toHaveBeenCalled();
    expect(since.mock.calls.map((c) => c[1])).toEqual([0, expect.any(Number)]);
    expect(since.mock.calls[1]?.[1]).toBeGreaterThan(0);
  });

  it("starts over when a ledger file is replaced by a shorter one", async () => {
    const s = stores();
    await s.activity.record(fill({ orderId: "a" }));
    await s.activity.record(fill({ orderId: "b", side: "sell" }));
    const read = ladderEvidenceReader(s);
    expect((await read("ann")).earned.map((m) => m.code)).toEqual(["101", "102"]);
    writeFileSync(join(dir, "activity", "ann.jsonl"), "");
    truncateSync(join(dir, "activity", "ann.jsonl"), 0);
    appendFileSync(
      join(dir, "activity", "ann.jsonl"),
      `${JSON.stringify(fill({ orderId: "z" }))}\n`,
    );
    expect(await read("ann")).toEqual(await wholeRead(s));
    expect((await read("ann")).earned.map((m) => m.code)).toEqual(["101"]);
  });

  it("folds two views landing together once, not twice", async () => {
    const s = stores();
    await s.activity.record(fill({ orderId: "a" }));
    await s.orderAudit.record(tag({ orderId: "a", intent: "open", code: "101" }));
    const read = ladderEvidenceReader(s);
    await read("ann");
    await s.activity.record(fill({ orderId: "b", side: "sell" }));
    const both = await Promise.all([read("ann"), read("ann"), read("ann")]);
    for (const answer of both) expect(answer).toEqual(await wholeRead(s));
  });

  it("keeps participants apart", async () => {
    const s = stores();
    await s.activity.record(fill({ participantId: "ann", orderId: "a" }));
    await s.activity.record(fill({ participantId: "bob", orderId: "b", side: "sell" }));
    const read = ladderEvidenceReader(s);
    expect((await read("ann")).earned.map((m) => m.code)).toEqual(["101"]);
    expect((await read("bob")).earned.map((m) => m.code)).toEqual(["102"]);
    expect((await read("cy")).hasFill).toBe(false);
  });

  it("reads whole, holding nothing, from stores with no append-aware read", async () => {
    const activity = new InMemoryActivityStore();
    const orderAudit = new InMemoryOrderAuditLog();
    const read = ladderEvidenceReader({ activity, orderAudit });
    expect((await read("ann")).hasFill).toBe(false);
    await activity.record(fill({}));
    const answer = await read("ann");
    expect(answer.hasFill).toBe(true);
    expect(answer.earned.map((m) => m.code)).toEqual(["101"]);
  });
});
