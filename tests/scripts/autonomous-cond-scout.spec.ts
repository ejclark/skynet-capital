import type { PlaybookSubscription } from "../../src/domain/types.js";
import { armCondScout, condScoutUniverse } from "../../src/scripts/autonomous-cond-scout.js";
import { aContext } from "../support/builders.js";

function sink() {
  const lines: string[] = [];
  return {
    lines,
    log: (l: string) => lines.push(`log ${l}`),
    warn: (l: string) => lines.push(`warn ${l}`),
  };
}

const wiring = (log: ReturnType<typeof sink>) => ({
  streamed: ["NVDA", "AMD"],
  credentials: () => ({ apiKey: "k", apiSecret: "s" }),
  risk: { maxPositionPct: 0.03 },
  blockedReason: () => null,
  botsStateDb: undefined,
  onDecision: () => undefined,
  log,
});

describe("condScoutUniverse", () => {
  it("keeps only symbols the price stream carries, and says which it dropped", () => {
    const log = sink();
    expect(condScoutUniverse("nvda, TSLA, amd", ["NVDA", "AMD"], log)).toEqual(["NVDA", "AMD"]);
    expect(log.lines).toEqual([
      "warn [cond-scout] dropped TSLA — not on the live price stream (NVDA, AMD)",
    ]);
  });
});

describe("armCondScout", () => {
  const host = (subs: PlaybookSubscription[] = []) => ({
    hostPersonaId: "sauron",
    hostSubscriptions: () => subs,
  });
  const scoutOn = (symbols: string[]): PlaybookSubscription => ({
    accountId: "sauron",
    playbookId: "COND-SCOUT",
    mode: "conservative",
    enabled: true,
    createdAt: "2026-10-18T00:00:00Z",
    updatedAt: "2026-10-18T00:00:00Z",
    symbols,
  });

  it("is a silent no-op with no host settings to follow", async () => {
    const log = sink();
    const pass = armCondScout({}, wiring(log));
    await expect(pass(aContext({ NVDA: { last: 100 } }))).resolves.toBeUndefined();
    expect(log.lines).toEqual([]);
  });

  it("ignores the env knob with no host settings to follow — it no longer arms anything", async () => {
    const log = sink();
    let fetches = 0;
    const pass = armCondScout(
      { SKYNET_COND_SCOUT_UNIVERSE: "NVDA" },
      {
        ...wiring(log),
        closesFor: () => {
          fetches++;
          return Promise.resolve({});
        },
      },
    );
    await pass(aContext({ NVDA: { last: 100 } }));
    expect(fetches).toBe(0);
    expect(log.lines).toEqual([]);
  });

  it("says the env knob is no longer read when the host holds no subscription", () => {
    const log = sink();
    armCondScout({ SKYNET_COND_SCOUT_UNIVERSE: "NVDA" }, { ...wiring(log), ...host() });
    expect(log.lines).toEqual([
      "warn [cond-scout] SKYNET_COND_SCOUT_UNIVERSE is no longer read — sauron holds no COND-SCOUT subscription, so the scout stays dark. Subscribe it in the Playbook Store.",
    ]);
  });

  it("stays dark, and says so, when the subscription names nothing the stream carries", () => {
    const log = sink();
    armCondScout({}, { ...wiring(log), ...host([scoutOn(["TSLA"])]) });
    expect(log.lines.at(-1)).toBe(
      "warn [cond-scout] sauron's COND-SCOUT subscription names nothing the stream carries — staying dark.",
    );
  });

  it("arms on the shadow ledger, warns when probes can't survive a restart, and never throws", async () => {
    const log = sink();
    const pass = armCondScout(
      {},
      {
        ...wiring(log),
        ...host([scoutOn(["NVDA"])]),
        blockedReason: () => {
          throw new Error("boom");
        },
      },
    );
    expect(log.lines).toContain(
      "warn [cond-scout] no SKYNET_BOTS_DB_PATH — probes live in memory and vanish on restart.",
    );
    expect(log.lines).toContain(
      "log [cond-scout] armed on the shadow ledger (no orders): NVDA — from sauron's COND-SCOUT subscription.",
    );
    await expect(pass(aContext({ NVDA: { last: 100 } }))).resolves.toBeUndefined();
    expect(log.lines.at(-1)).toBe("warn [cond-scout] pass failed:");
  });

  it("skips a pass while the previous one is still in flight, rather than stacking them", async () => {
    const log = sink();
    let fetches = 0;
    let release: () => void = () => undefined;
    const pass = armCondScout(
      {},
      {
        ...wiring(log),
        ...host([scoutOn(["NVDA"])]),
        // The day's bars fetch hangs until released — the case that must not stack passes.
        closesFor: () => {
          fetches++;
          return new Promise((resolve) => {
            release = () => resolve({});
          });
        },
      },
    );
    const context = aContext({ NVDA: { last: 100 } });
    const first = pass(context);
    await pass(context);
    await pass(context);
    expect(fetches).toBe(1);
    release();
    await first;
  });
});

describe("armCondScout — names from the host bot's own subscription (#4535 slice 2a)", () => {
  const scout = (enabled: boolean, symbols?: string[]): PlaybookSubscription => ({
    accountId: "sauron",
    playbookId: "COND-SCOUT",
    mode: "conservative",
    enabled,
    createdAt: "2026-10-18T00:00:00Z",
    updatedAt: "2026-10-18T00:00:00Z",
    ...(symbols ? { symbols } : {}),
  });

  it("arms from the subscription with no env knob, and follows each change without a restart", async () => {
    const log = sink();
    const held: { subs: PlaybookSubscription[] } = { subs: [] };
    const asked: string[][] = [];
    const pass = armCondScout(
      {},
      {
        ...wiring(log),
        hostPersonaId: "sauron",
        hostSubscriptions: () => held.subs,
        closesFor: (symbols) => {
          asked.push([...symbols]);
          return Promise.resolve({});
        },
      },
    );
    const context = aContext({ NVDA: { last: 100 }, AMD: { last: 50 } });
    await pass(context);
    expect(log.lines).toEqual([]); // nothing ever set: silent, as before
    held.subs = [scout(true, ["NVDA"])];
    await pass(context);
    expect(asked).toEqual([["NVDA"]]);
    expect(log.lines).toContain(
      "log [cond-scout] armed on the shadow ledger (no orders): NVDA — from sauron's COND-SCOUT subscription.",
    );
    held.subs = [scout(false, ["NVDA"])];
    await pass(context);
    expect(log.lines.at(-1)).toBe(
      "log [cond-scout] paused on sauron's COND-SCOUT subscription — no new probes; open ones still close.",
    );
    held.subs = [];
    await pass(context);
    expect(log.lines.at(-1)).toBe(
      "log [cond-scout] dark — no COND-SCOUT subscription; open probes still close.",
    );
  });

  it("lets a paused subscription hold the scout dark, whatever the env knob names", async () => {
    const log = sink();
    let fetches = 0;
    const pass = armCondScout(
      { SKYNET_COND_SCOUT_UNIVERSE: "NVDA" },
      {
        ...wiring(log),
        hostPersonaId: "sauron",
        hostSubscriptions: () => [scout(false)],
        closesFor: () => {
          fetches++;
          return Promise.resolve({});
        },
      },
    );
    await pass(aContext({ NVDA: { last: 100 } }));
    expect(fetches).toBe(0);
    expect(log.lines.some((l) => l.includes("armed"))).toBe(false);
  });

  it("says the same state once, not on every check", async () => {
    const log = sink();
    const pass = armCondScout(
      {},
      {
        ...wiring(log),
        hostSubscriptions: () => [scout(true, ["NVDA", "TSLA"])],
        closesFor: () => Promise.resolve({}),
      },
    );
    const context = aContext({ NVDA: { last: 100 } });
    await pass(context);
    await pass(context);
    expect(log.lines.filter((l) => l.includes("dropped TSLA"))).toHaveLength(1);
    expect(log.lines.filter((l) => l.includes("armed"))).toHaveLength(1);
  });

  it("hands the Heartbeat its ledger only once there is one to show", async () => {
    const log = sink();
    const held: { subs: PlaybookSubscription[] } = { subs: [] };
    let published = 0;
    const pass = armCondScout(
      {},
      {
        ...wiring(log),
        hostPersonaId: "sauron",
        hostSubscriptions: () => held.subs,
        publish: () => {
          published++;
        },
        closesFor: () => Promise.resolve({}),
      },
    );
    await pass(aContext({ NVDA: { last: 100 } }));
    expect(published).toBe(0);
    held.subs = [scout(true)];
    await pass(aContext({ NVDA: { last: 100 } }));
    held.subs = [];
    await pass(aContext({ NVDA: { last: 100 } }));
    expect(published).toBe(1);
  });
});
