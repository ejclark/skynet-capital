import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonlOrderAuditLog, type OrderAuditRecord } from "../../src/server/order-audit-log.js";
import { InMemoryOrderAuditLog } from "../../src/server/order-audit-memory-log.js";

const rec = (participantId: string, orderId: string): OrderAuditRecord => ({
  participantId,
  ownerEmail: "uncle_joe@example.com",
  orderId,
  at: "2026-08-21T00:00:00.000Z",
});

describe("InMemoryOrderAuditLog", () => {
  it("records and lists lines, filtered by participant", async () => {
    const log = new InMemoryOrderAuditLog();
    await log.record(rec("ann", "order-1"));
    await log.record(rec("ann", "order-2"));
    await log.record(rec("bo", "order-3"));

    expect((await log.list("ann")).map((r) => r.orderId)).toEqual(["order-1", "order-2"]);
    expect(await log.list()).toHaveLength(3);
  });
});

describe("JsonlOrderAuditLog", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "order-audit-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends and reads back one durable line per submitted order", async () => {
    const log = new JsonlOrderAuditLog(dir);
    await log.record(rec("ann", "order-1"));

    const lines = await log.list("ann");
    expect(lines).toEqual([rec("ann", "order-1")]);
  });

  it("returns empty for an unknown participant and an empty dir", async () => {
    const log = new JsonlOrderAuditLog(dir);
    expect(await log.list("nobody")).toEqual([]);
    expect(await log.list()).toEqual([]);
  });
});
