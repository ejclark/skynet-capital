import { mkdtempSync, rmSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  AlpacaAccountActivity,
  AlpacaOptionsClient,
  LifecycleRead,
} from "../../src/alpaca/alpaca-options-client.js";
import { backfillParticipantOptionLifecycle } from "../../src/observatory/activity-backfill.js";
import {
  type ActivityStore,
  InMemoryActivityStore,
  JsonlActivityStore,
  type TradeActivityRecord,
} from "../../src/observatory/activity-store.js";
import { deskLedger } from "../../src/observatory/desk-data.js";
import type { DeskActivityEvent } from "../../src/observatory/desk-json-view.js";
import type { Participant } from "../../src/participants/participant.js";
import {
  type LifecycleSweepDeps,
  lifecycleSweepPass,
  wireOptionLifecycleSweep,
} from "../../src/scripts/dashboard-option-lifecycle.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";

// #4650: an option that expires or is assigned fills no order, so the dashboard's boot reconcile
// (orders) and its trade_updates stream (fills) never see it. The sweep asks each account itself.

const PUT = "CRWV261106P00085000";
const KEY = "PK-SECRET-KEY-DO-NOT-LOG";

const account = (
  id: string,
  credentials: Participant["credentials"] = { apiKey: KEY, apiSecret: "s" },
) => ({ id, displayName: id, kind: "bot", credentials }) satisfies Participant;

/** An Alpaca activity id: its timestamp first, then a uuid — the broker's own sort key. */
const activityId = (day: string, n: number) =>
  `${day.replaceAll("-", "")}000000000::${String(n).padStart(4, "0")}`;

const expiry = (day: string, n: number): AlpacaAccountActivity => ({
  id: activityId(day, n),
  activity_type: "OPEXP",
  symbol: PUT,
  qty: "1",
  date: day,
});

type Reader = Pick<AlpacaOptionsClient, "readOptionLifecycleActivitiesAfter">;

/** Pages the way Alpaca documents `direction=asc`: oldest first, starting just past `afterId`. */
function ascendingBroker(all: readonly AlpacaAccountActivity[], pageSize = 100) {
  const asked: (string | undefined)[] = [];
  const sorted = [...all].sort((a, b) => (a.id < b.id ? -1 : 1));
  const reader: Reader = {
    readOptionLifecycleActivitiesAfter: (afterId) => {
      asked.push(afterId);
      const start = afterId === undefined ? 0 : sorted.findIndex((a) => a.id > afterId);
      const rows = start < 0 ? [] : sorted.slice(start, start + pageSize);
      return Promise.resolve({ ok: true, rows });
    },
  };
  return { asked, reader };
}

function capture() {
  const lines: string[] = [];
  return {
    lines,
    logger: {
      log: (line: string) => lines.push(`log ${line}`),
      warn: (line: string) => lines.push(`warn ${line}`),
    },
  };
}

function depsFor(
  store: ActivityStore,
  readers: Record<string, Reader>,
  extra: Partial<LifecycleSweepDeps> = {},
): LifecycleSweepDeps {
  return {
    participants: () => Object.keys(readers).map((id) => account(id)),
    optionsClientFor: (p) => readers[p.id] as Reader,
    store,
    logger: capture().logger,
    ...extra,
  };
}

/** The sold CRWV put the wheel wrote, as the trade_updates stream journaled its fill. */
const soldPut: TradeActivityRecord = {
  orderId: "opt-put-1",
  participantId: "sauron",
  symbol: PUT,
  side: "sell",
  quantity: 1,
  filledQuantity: 1,
  price: 2.12,
  status: "filled",
  at: "2026-10-07T14:30:12Z",
  source: "stream",
};

const settle = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

describe("the dashboard's option expiry/assignment sweep", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "dashboard-lifecycle-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("closes an expired sold put on the account's Activity, with the premium kept as realized P/L", async () => {
    const store = new JsonlActivityStore(dir);
    await store.record(soldPut);
    const { reader } = ascendingBroker([expiry("2026-11-06", 1)]);
    const onAppended: string[] = [];

    await lifecycleSweepPass(
      depsFor(store, { sauron: reader }, { onAppended: (id) => onAppended.push(id) }),
    )();

    const snapshot = {
      id: "sauron",
      displayName: "Sauron",
      kind: "bot" as const,
      cash: 0,
      equity: 0,
      positions: [],
      activity: [],
    };
    const ledger = deskLedger(snapshot, await store.list("sauron"));
    expect(ledger.open).toEqual([]);
    expect(ledger.trips.map((t) => t.realized)).toEqual([212]);
    expect(onAppended).toEqual(["sauron"]); // the ladder detector is told

    let body = "";
    const res = {
      writeHead: () => res,
      end: (text?: string) => (body = text ?? ""),
    } as unknown as ServerResponse;
    const config = {
      hub: { getState: () => ({ generatedAt: "t", participants: [snapshot], collisions: [] }) },
      readTradeActivity: (id: string) => store.list(id),
    } as unknown as DashboardServerConfig;
    await serveDeskJson(res, "/api/desk/sauron/activity", "/api/desk/sauron/activity", config);
    const rows = (JSON.parse(body) as { activity: DeskActivityEvent[] }).activity;
    // The report names its event (the row's chip reads EXPIRED, not a second SELL); the sale does not.
    expect(rows.map((r) => [r.status, r.realizedPl, r.lifecycle])).toEqual([
      ["expired worthless", "+$212", "OPEXP"],
      ["filled", undefined, undefined],
    ]);
  });

  it("resumes from the newest report the ledger holds — across a restart, never from the start", async () => {
    const before = new JsonlActivityStore(dir);
    await before.record(soldPut);
    const held = [expiry("2026-10-16", 1), expiry("2026-10-30", 2)];
    const fresh = expiry("2026-11-06", 3);
    // The two older reports were banked by hand (`npm run backfill:activity`, newest first).
    await backfillParticipantOptionLifecycle({
      participantId: "sauron",
      store: before,
      listLifecycleActivities: (after) => Promise.resolve(after ? [] : [...held].reverse()),
    });

    const broker = ascendingBroker([...held, fresh]);
    const restarted = new JsonlActivityStore(dir); // a new process over the same volume
    const pass = lifecycleSweepPass(depsFor(restarted, { sauron: broker.reader }));
    await pass();
    await pass();

    expect(broker.asked).toEqual([held[1]?.id, fresh.id]);
    const ids = (await restarted.list("sauron")).map((r) => r.orderId);
    expect(ids.filter((id) => id === `lifecycle:${fresh.id}`)).toHaveLength(1);
  });

  it("finishes a burst longer than one page on the passes after it, skipping none", async () => {
    const store = new InMemoryActivityStore();
    const burst = Array.from({ length: 150 }, (_, n) => expiry("2026-11-06", n));
    const { asked, reader } = ascendingBroker(burst);
    const { lines, logger } = capture();
    const pass = lifecycleSweepPass(depsFor(store, { sauron: reader }, { logger }));

    await pass();
    await pass();
    await pass();

    expect(asked).toEqual([undefined, burst[99]?.id, burst[149]?.id]);
    expect(new Set((await store.list("sauron")).map((r) => r.orderId)).size).toBe(150);
    expect(lines).toEqual([
      "log [activity] sauron: banked 100 expiry/assignment report(s)",
      "log [activity] sauron: banked 50 expiry/assignment report(s)",
    ]);
  });

  it("adds nothing when the broker hands back a page the ledger already holds", async () => {
    const store = new InMemoryActivityStore();
    const page: LifecycleRead = {
      ok: true,
      rows: [expiry("2026-11-06", 1), expiry("2026-11-06", 2)],
    };
    const sameEveryTime: Reader = {
      readOptionLifecycleActivitiesAfter: () => Promise.resolve(page),
    };
    const onAppended: string[] = [];
    const pass = lifecycleSweepPass(
      depsFor(store, { sauron: sameEveryTime }, { onAppended: (id) => onAppended.push(id) }),
    );

    await pass();
    await pass();

    expect(await store.list("sauron")).toHaveLength(2);
    expect(onAppended).toEqual(["sauron"]);
  });

  it("logs a failing account once, keeps sweeping the others, and never logs a credential", async () => {
    const store = new InMemoryActivityStore();
    let downReads = 0;
    const readers: Record<string, Reader> = {
      down: {
        readOptionLifecycleActivitiesAfter: () => {
          downReads += 1;
          return Promise.resolve(downReads < 3 ? { ok: false } : { ok: true, rows: [] });
        },
      },
      throws: {
        readOptionLifecycleActivitiesAfter: () =>
          Promise.reject(new TypeError(`fetch failed for key ${KEY}`)),
      },
      sauron: ascendingBroker([expiry("2026-11-06", 1)]).reader,
    };
    let unlinkedReads = 0;
    const unlinked = account("unlinked", { apiKey: "", apiSecret: "" });
    const { lines, logger } = capture();
    const pass = lifecycleSweepPass({
      ...depsFor(store, readers, { logger }),
      participants: () => [unlinked, ...Object.keys(readers).map((id) => account(id))],
      optionsClientFor: (p) => {
        if (p.id === "unlinked") unlinkedReads += 1;
        return readers[p.id] as Reader;
      },
    });

    await pass();
    await pass();
    await pass();

    expect(lines).toEqual([
      "warn [activity] down: option expiry/assignment read failed — next pass retries",
      "warn [activity] throws: option expiry/assignment sweep failed (TypeError) — next pass retries",
      "log [activity] sauron: banked 1 expiry/assignment report(s)",
      "log [activity] down: option expiry/assignment reads recovered",
    ]);
    expect(lines.join("\n")).not.toContain(KEY);
    expect(unlinkedReads).toBe(0); // no credential, so never asked — and never asked on another's
  });

  it("arms once the boot reconcile settles, then runs on its own clock, never two passes at once", async () => {
    rstest.useFakeTimers();
    try {
      let reads = 0;
      let release: () => void = () => undefined;
      const slow: Reader = {
        readOptionLifecycleActivitiesAfter: () => {
          reads += 1;
          return new Promise<LifecycleRead>((resolve) => {
            release = () => resolve({ ok: true, rows: [] });
          });
        },
      };
      let reconcile: () => void = () => undefined;
      const reconciled = new Promise<void>((resolve) => {
        reconcile = resolve;
      });
      const armed = wireOptionLifecycleSweep(
        "live",
        reconciled,
        depsFor(new InMemoryActivityStore(), { sauron: slow }),
        1_000,
      );

      await rstest.advanceTimersByTimeAsync(5_000);
      expect(reads).toBe(0); // the reconcile is still banking the order window
      reconcile();
      const timer = await armed;
      await settle();
      expect(reads).toBe(1); // the boot pass
      await rstest.advanceTimersByTimeAsync(1_000); // a tick while the boot pass is still reading
      expect(reads).toBe(1);
      release();
      await rstest.advanceTimersByTimeAsync(1_000);
      expect(reads).toBe(2);
      clearInterval(timer);
    } finally {
      rstest.useRealTimers();
    }
  });

  it("stays dark in offline mode, where there is no broker record to read", async () => {
    let reads = 0;
    const reader: Reader = {
      readOptionLifecycleActivitiesAfter: () => {
        reads += 1;
        return Promise.resolve({ ok: true, rows: [] });
      },
    };
    const { lines, logger } = capture();
    const deps = depsFor(new InMemoryActivityStore(), { sauron: reader }, { logger });

    expect(await wireOptionLifecycleSweep("offline", Promise.resolve(), deps)).toBeUndefined();
    expect(reads).toBe(0);
    expect(lines).toEqual([
      "log [activity] option expiry/assignment sweep off — offline mode has no broker record",
    ]);
  });
});
