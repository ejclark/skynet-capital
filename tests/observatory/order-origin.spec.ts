import {
  NO_ORIGIN_EVIDENCE,
  orderOrigin,
  orderOriginIndex,
} from "../../src/observatory/order-origin.js";
import type { OrderAuditRecord } from "../../src/server/order-audit-log.js";

/** Who placed an order: an audited id is ours, and every gap in the evidence stays `unknown`. */

const audit = (orderId: string, at: string): OrderAuditRecord => ({
  participantId: "eric",
  orderId,
  at,
});

const order = (orderId: string, at: string) => ({ orderId, at });

describe("orderOriginIndex", () => {
  it("indexes a human desk's audited ids and opens coverage at the earliest line", () => {
    const index = orderOriginIndex(
      [audit("o-2", "2026-08-20T15:00:00.000Z"), audit("o-1", "2026-08-18T14:30:00.000Z")],
      "human",
    );
    expect(index.deskOrderIds.has("o-1")).toBe(true);
    expect(index.deskOrderIds.has("o-2")).toBe(true);
    expect(index.coverageFrom).toBe("2026-08-18T14:30:00.000Z");
  });

  it("refuses to classify a bot desk at all — the engine bypasses the audited path", () => {
    const index = orderOriginIndex([audit("o-1", "2026-08-18T14:30:00.000Z")], "bot");
    expect(index).toEqual(NO_ORIGIN_EVIDENCE);
  });

  it("treats a missing or empty audit log as no coverage, not as proof of anything", () => {
    expect(orderOriginIndex(undefined, "human")).toEqual(NO_ORIGIN_EVIDENCE);
    expect(orderOriginIndex([], "human")).toEqual(NO_ORIGIN_EVIDENCE);
  });
});

describe("orderOrigin", () => {
  const index = orderOriginIndex(
    [audit("o-1", "2026-08-18T14:30:00.000Z"), audit("o-2", "2026-08-20T15:00:00.000Z")],
    "human",
  );

  it("calls an audited order ours, however the ledger learned about it", () => {
    expect(orderOrigin(order("o-2", "2026-08-20T15:00:00.000Z"), index)).toBe("desk");
  });

  it("calls an unaudited order inside the covered window Alpaca-direct", () => {
    expect(orderOrigin(order("o-9", "2026-08-19T18:00:00.000Z"), index)).toBe("alpaca-direct");
  });

  it("leaves an order older than the log's first line unknown rather than guessing", () => {
    expect(orderOrigin(order("o-0", "2026-08-01T14:00:00.000Z"), index)).toBe("unknown");
  });

  it("keeps the id match ahead of the window — the first desk order stamps its line a beat later", () => {
    // `at` is the broker's submitted_at; the audit line is written after the broker accepts, so
    // the account's very first desk order sits fractionally BEFORE its own coverage start.
    expect(orderOrigin(order("o-1", "2026-08-18T14:29:59.000Z"), index)).toBe("desk");
  });

  it("leaves an id-less broker row unknown — there is nothing to join on", () => {
    expect(orderOrigin({ at: "2026-08-19T18:00:00.000Z" }, index)).toBe("unknown");
  });

  it("classifies nothing without evidence", () => {
    expect(orderOrigin(order("o-9", "2026-08-19T18:00:00.000Z"), NO_ORIGIN_EVIDENCE)).toBe(
      "unknown",
    );
  });
});
