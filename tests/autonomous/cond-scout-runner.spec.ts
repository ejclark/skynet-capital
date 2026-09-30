import { CondScoutRunner, type CondScoutStore } from "../../src/autonomous/cond-scout-runner.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { MarketContext } from "../../src/domain/types.js";
import type {
  ShadowClose,
  ShadowProbe,
  ShadowSnapshot,
} from "../../src/playbooks/cond-scout-ledger.js";
import type { ProbeRetro } from "../../src/playbooks/cond-scout-retro.js";
import { aContext } from "../support/builders.js";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 8, 30, 14, 0);
/** 30 daily closes: flat at 100, then a slide over the last 15 sessions — RSI pinned near 0. */
const SLIDE = [
  ...Array.from({ length: 15 }, () => 100),
  ...Array.from({ length: 15 }, (_, i) => 99 - i * 1.3),
];

function memoryStore(): CondScoutStore & {
  opened: ShadowProbe[];
  closed: ShadowClose[];
  snapshots: ShadowSnapshot[];
  retros: ProbeRetro[];
} {
  const opened: ShadowProbe[] = [];
  const closed: ShadowClose[] = [];
  const snapshots: ShadowSnapshot[] = [];
  const retros: ProbeRetro[] = [];
  return {
    retros,
    opened,
    closed,
    snapshots,
    saveSnapshot: (snapshot) => snapshots.push(snapshot),
    snapshotsFor: (probeId) => snapshots.filter((x) => x.probeId === probeId),
    saveRetro: (retro) => {
      const i = retros.findIndex((r) => r.probeId === retro.probeId);
      if (i >= 0) retros[i] = retro;
      else retros.push(retro);
    },
    recentRetros: (limit) => [...retros].reverse().slice(0, limit),
    loadOpen: () => opened.filter((p) => !closed.some((c) => c.probe.id === p.id)),
    saveOpen: (probe) => opened.push(probe),
    close: (close) => closed.push(close),
    recentCloses: (limit) => [...closed].reverse().slice(0, limit),
  };
}

function setup(over: { blocked?: string; clock?: { t: number }; store?: CondScoutStore } = {}) {
  const decisions: DecisionRecord[] = [];
  const clock = over.clock ?? { t: T0 };
  let closesCalls = 0;
  const runner = new CondScoutRunner({
    universe: ["AMD"],
    closesFor: () => {
      closesCalls++;
      return Promise.resolve({ AMD: SLIDE });
    },
    risk: { maxPositionPct: 0.2 },
    blockedReason: () => over.blocked ?? null,
    ...(over.store ? { store: over.store } : {}),
    now: () => clock.t,
    onDecision: (r) => decisions.push(r),
  });
  return { runner, decisions, clock, closesCalls: () => closesCalls };
}

const at = (last: number, asOf = "2026-09-30T14:00:00Z"): MarketContext =>
  aContext({ AMD: { last, sentiment: 0.1 } }, asOf);

describe("CondScoutRunner", () => {
  it("opens a shadow probe as an observe-mode cond-scout decision, never a placed order", async () => {
    const { runner, decisions } = setup();
    await runner.runPass(at(80));
    expect(runner.openProbes()).toHaveLength(1);
    const [record] = decisions;
    expect(record).toMatchObject({ personaId: "cond-scout", mode: "observe" });
    expect(record?.outcomes.every((o) => o.action === "observed" && !o.result)).toBe(true);
    expect(record?.guardedIntents[0]?.reason).toContain("no order sent");
  });

  it("opens at the quantity the guards approved, not the one it asked for", async () => {
    const decisions: DecisionRecord[] = [];
    const runner = new CondScoutRunner({
      universe: ["AMD"],
      closesFor: () => Promise.resolve({ AMD: SLIDE }),
      risk: { maxPositionPct: 0.02 }, // 2% of $50k shadow capital = $1,000, under the $5k probe
      blockedReason: () => null,
      now: () => T0,
      onDecision: (r) => decisions.push(r),
    });
    await runner.runPass(at(80));
    const [probe] = runner.openProbes();
    expect(probe?.notional).toBeLessThanOrEqual(1_000);
    expect(probe?.quantity).toBe(decisions[0]?.guardedIntents[0]?.quantity);
  });

  it("opens once per session and fetches daily closes once per session", async () => {
    const { runner, decisions, closesCalls } = setup();
    await runner.runPass(at(80));
    await runner.runPass(at(80));
    expect(decisions).toHaveLength(1);
    expect(closesCalls()).toBe(1);
  });

  it("opens nothing while halted, and records nothing", async () => {
    const { runner, decisions } = setup({ blocked: "kill switch" });
    await runner.runPass(at(80));
    expect(runner.openProbes()).toEqual([]);
    expect(decisions).toEqual([]);
  });

  it("closes a probe at the bid on its stop, persists the close, and never re-opens it that session", async () => {
    const store = memoryStore();
    const clock = { t: T0 };
    const { runner, decisions } = setup({ store, clock });
    await runner.runPass(at(80));
    clock.t = T0 + DAY;
    await runner.runPass(at(70, "2026-10-01T14:00:00Z"));
    expect(runner.openProbes()).toEqual([]);
    expect(store.closed[0]).toMatchObject({ reason: "invalidated", exitPrice: 69.95 });
    const exit = decisions.find((d) => d.rawIntents.some((i) => i.side === "sell"));
    expect(exit?.outcomes[0]?.intent.reason).toContain("no order sent");
  });

  it("reloads open probes from the store on a restart", async () => {
    const store = memoryStore();
    const first = setup({ store });
    await first.runner.runPass(at(80));
    const second = setup({ store });
    expect(second.runner.openProbes().map((p) => p.symbol)).toEqual(["AMD"]);
  });

  describe("review regressions (2026-09-30)", () => {
    const twoNames = (capital: number) => {
      const decisions: DecisionRecord[] = [];
      const runner = new CondScoutRunner({
        universe: ["AMD", "MU"],
        closesFor: () => Promise.resolve({ AMD: SLIDE, MU: SLIDE }),
        risk: { maxPositionPct: 1 },
        blockedReason: () => null,
        shadowCapital: capital,
        now: () => T0,
        onDecision: (r) => decisions.push(r),
      });
      const context = aContext({ AMD: { last: 80 }, MU: { last: 70 } });
      return { runner, decisions, context };
    };

    it("never commits more than the shadow capital across probes opened in one pass", async () => {
      const { runner, decisions, context } = twoNames(6_000);
      await runner.runPass(context);
      const committed = runner.openProbes().reduce((sum, p) => sum + p.notional, 0);
      expect(committed).toBeLessThanOrEqual(6_000);
      const [record] = decisions;
      expect((record?.rawIntents.length ?? 0) - (record?.guardedIntents.length ?? 0)).toBe(
        record?.refusals?.length ?? 0,
      );
    });

    it("spends the session on a scan the guards refused outright — one record, not one per pass", async () => {
      const { runner, decisions, context } = twoNames(10);
      await runner.runPass(context);
      await runner.runPass(context);
      expect(runner.openProbes()).toEqual([]);
      expect(decisions).toHaveLength(1);
      expect(decisions[0]?.refusals?.map((r) => r.reason)).toEqual([
        "insufficient-cash",
        "insufficient-cash",
      ]);
    });

    it("keeps both day latches across a mid-session restart", async () => {
      const store = memoryStore();
      const clock = { t: T0 };
      const first = setup({ store, clock });
      await first.runner.runPass(at(80));
      clock.t = T0 + 3_600_000;
      await first.runner.runPass(at(70)); // stopped out, same session
      expect(store.closed).toHaveLength(1);

      const restarted = setup({ store, clock });
      await restarted.runner.runPass(at(80)); // still oversold — but opened and closed today
      expect(restarted.runner.openProbes()).toEqual([]);
      expect(restarted.decisions).toEqual([]);
    });
  });

  describe("in-flight snapshots (slice 3)", () => {
    it("snapshots at open with the scanner's reading, then hourly — never on every pass", async () => {
      const store = memoryStore();
      const clock = { t: T0 };
      const { runner } = setup({ store, clock });
      await runner.runPass(at(80));
      expect(store.snapshots).toHaveLength(1);
      expect(store.snapshots[0]?.reading?.rsi).toBeDefined();

      clock.t = T0 + 30 * 60_000;
      await runner.runPass(at(81));
      expect(store.snapshots).toHaveLength(1);

      clock.t = T0 + 61 * 60_000;
      await runner.runPass(at(82));
      expect(store.snapshots).toHaveLength(2);
      const [open] = runner.openProbes();
      expect(store.snapshots[1]?.markRoi).toBeCloseTo(
        (81.95 - (open?.entryPrice ?? 0)) / (open?.entryPrice ?? 1),
        6,
      );
    });

    it("stops snapshotting a probe once it closes", async () => {
      const store = memoryStore();
      const clock = { t: T0 };
      const { runner } = setup({ store, clock });
      await runner.runPass(at(80));
      clock.t = T0 + 2 * 3_600_000;
      await runner.runPass(at(70)); // stopped out
      const count = store.snapshots.length;
      clock.t = T0 + 4 * 3_600_000;
      await runner.runPass(at(70));
      expect(store.snapshots).toHaveLength(count);
    });
  });

  describe("the retro at close (slice 4)", () => {
    it("writes a retro from the probe's snapshots when it closes", async () => {
      const store = memoryStore();
      const clock = { t: T0 };
      const { runner } = setup({ store, clock });
      await runner.runPass(at(80));
      clock.t = T0 + 2 * 3_600_000;
      await runner.runPass(at(81));
      clock.t = T0 + 4 * 3_600_000;
      await runner.runPass(at(70)); // stopped out
      expect(store.retros).toHaveLength(1);
      expect(store.retros[0]).toMatchObject({
        symbol: "AMD",
        reason: "invalidated",
        directionRight: false,
      });
      expect(store.retros[0]?.snapshotCount).toBe(store.snapshots.length);
    });

    it("still writes one from this process's snapshots when no store is wired", async () => {
      const retros: unknown[] = [];
      const clock = { t: T0 };
      const runner = new CondScoutRunner({
        universe: ["AMD"],
        closesFor: () => Promise.resolve({ AMD: SLIDE }),
        risk: { maxPositionPct: 0.2 },
        blockedReason: () => null,
        now: () => clock.t,
        onRetro: (r) => retros.push(r),
      });
      await runner.runPass(at(80));
      clock.t = T0 + 3_600_000;
      await runner.runPass(at(70));
      expect(retros).toHaveLength(1);
      expect(retros[0]).toMatchObject({ snapshotCount: 1 });
    });
  });

  describe("later-exit backfill (slice 5)", () => {
    it("prices due checkpoints from daily bars once per session, and leaves the rest pending", async () => {
      const store = memoryStore();
      const clock = { t: T0 };
      const barCalls: string[] = [];
      const deps = (t: number) => ({
        universe: ["AMD"],
        closesFor: () => Promise.resolve({ AMD: SLIDE }),
        risk: { maxPositionPct: 0.2 },
        blockedReason: () => "halted", // no new probes: this test is about the backfill only
        store,
        now: () => t,
        barsFor: (symbol: string, start: string) => {
          barCalls.push(`${symbol}@${start}`);
          return Promise.resolve([{ t: start, c: 120 }]);
        },
      });
      // A probe that opened and closed earlier: a 2-day hold, so its first checkpoint is 1 week.
      const first = setup({ store, clock });
      await first.runner.runPass(at(80));
      clock.t = T0 + 2 * DAY;
      await first.runner.runPass(at(70, "2026-10-02T14:00:00Z"));
      expect(store.retros).toHaveLength(1);

      const later = new CondScoutRunner(deps(T0 + 8 * DAY));
      await later.runPass(at(90, "2026-10-08T14:00:00Z"));
      await later.runPass(at(90, "2026-10-08T15:00:00Z"));
      expect(barCalls).toHaveLength(1);
      const [week, threeWeeks] = store.retros[0]?.laterExits ?? [];
      expect(week?.priceBasis).toBe("daily close");
      expect(week?.roi).toBeGreaterThan(0);
      expect(threeWeeks?.roi).toBeUndefined();
    });
  });
});
