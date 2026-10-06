import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { PlaybookVerdict } from "../../src/domain/types.js";
import {
  botHeartbeatView,
  PASS_CADENCE_MS,
  playbookRollCall,
  STALE_AFTER_MS,
  unmanagedHoldings,
} from "../../src/observatory/bot-heartbeat-view.js";
import type { Playbook } from "../../src/playbooks/playbook.js";

const NOW = new Date("2026-09-24T15:00:00Z");
const pass = (
  agoMs: number,
  verdicts?: readonly PlaybookVerdict[],
  halted?: string,
): DecisionRecord => ({
  at: NOW.getTime() - agoMs,
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...(verdicts ? { playbookVerdicts: verdicts } : {}),
  ...(halted ? { halted } : {}),
});
const s1 = (state: PlaybookVerdict["state"]): PlaybookVerdict => ({
  playbookId: "S1-NVDA",
  mode: "standard",
  state,
});

describe("botHeartbeatView — silence has three causes, and they never read alike", () => {
  it("beats when the newest pass is recent and the market is open", () => {
    const view = botHeartbeatView([pass(20_000)], NOW, true);
    expect(view.state).toBe("beating");
    expect(view.sinceLastPassMs).toBe(20_000);
    expect(view.cadenceMs).toBe(PASS_CADENCE_MS);
  });

  it("goes stale once the newest pass is older than the threshold during market hours", () => {
    expect(botHeartbeatView([pass(STALE_AFTER_MS + 1)], NOW, true).state).toBe("stale");
    expect(botHeartbeatView([pass(STALE_AFTER_MS)], NOW, true).state).toBe("beating");
  });

  it("reads market-closed, never stale, however old the last pass is", () => {
    const view = botHeartbeatView([pass(16 * 60 * 60_000)], NOW, false);
    expect(view.state).toBe("market-closed");
    expect(view.lastPassAt).toBe(new Date(NOW.getTime() - 16 * 60 * 60_000).toISOString());
  });

  it("says no-record, with nulls rather than zeros, for a bot that never recorded a pass", () => {
    expect(botHeartbeatView([], NOW, true)).toMatchObject({
      state: "no-record",
      lastPassAt: null,
      sinceLastPassMs: null,
      playbooks: null,
    });
  });

  it("surfaces the breaker holding a halted loop — alive, but not deciding", () => {
    const view = botHeartbeatView([pass(10_000, undefined, "daily-loss")], NOW, true);
    expect(view.state).toBe("beating");
    expect(view.halted).toBe("daily-loss");
  });
});

describe("botHeartbeatView — per-playbook verdicts", () => {
  it("reports each playbook's current verdict and when that run began", () => {
    const view = botHeartbeatView(
      [pass(0, [s1("no-window")]), pass(15_000, [s1("no-window")]), pass(30_000, [s1("long")])],
      NOW,
      true,
    );
    expect(view.playbooks).toEqual([
      {
        ...s1("no-window"),
        since: new Date(NOW.getTime() - 15_000).toISOString(),
        sinceIsLowerBound: false,
      },
    ]);
  });

  it("flags 'since' as a lower bound when the run reaches the oldest pass on hand", () => {
    const view = botHeartbeatView([pass(0, [s1("long")]), pass(15_000, [s1("long")])], NOW, true);
    expect(view.playbooks?.[0]?.sinceIsLowerBound).toBe(true);
  });

  it("reads verdicts from the newest pass that has them, skipping a halted one", () => {
    const view = botHeartbeatView(
      [pass(0, undefined, "manual"), pass(15_000, [s1("flat")])],
      NOW,
      true,
    );
    expect(view.playbooks?.[0]?.state).toBe("flat");
  });

  it("keeps two modes of the same playbook apart", () => {
    const aggressive: PlaybookVerdict = { ...s1("long"), mode: "aggressive" };
    const view = botHeartbeatView(
      [pass(0, [s1("no-window"), aggressive]), pass(15_000, [s1("long"), aggressive])],
      NOW,
      true,
    );
    expect(view.playbooks?.map((p) => [p.mode, p.sinceIsLowerBound])).toEqual([
      ["standard", false],
      ["aggressive", true],
    ]);
  });

  it("is null, not empty, when no pass on hand carries verdicts", () => {
    expect(botHeartbeatView([pass(0)], NOW, true).playbooks).toBeNull();
  });
});

describe("playbookRollCall — every house playbook is accounted for, never silently absent", () => {
  /** A stand-in roster, so these specs pin the roll call's own behaviour rather than the house
   *  registry's current contents. The window read is covered by `playbook-window.spec.ts`; here the
   *  rules only need a playbook that never opens one. */
  const play = (id: string): Playbook => ({
    id,
    symbols: [id.split("-")[1] ?? "TST"],
    thesis: "a spec",
    evidence: "a spec",
    size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
    desiredState: () => "no-window",
  });
  const house = [play("S1-NVDA"), play("G1-GOOG"), play("TACO-DJT")];
  const ids = house.map((p) => p.id);
  const gaps = { "TACO-DJT": "no feed" };
  const rollCall = (verdicts: readonly PlaybookVerdict[]) =>
    playbookRollCall(verdicts, NOW, house, gaps, []);

  it("calls a playbook the bot ran armed, with its mode", () => {
    const lines = rollCall([s1("no-window")]);
    expect(lines[0]).toMatchObject({ playbookId: "S1-NVDA", status: "armed", mode: "standard" });
  });

  it("calls a registered playbook the bot never ran off, rather than leaving it out", () => {
    const lines = rollCall([s1("long")]);
    expect(lines.find((l) => l.playbookId === "G1-GOOG")).toMatchObject({ status: "off" });
    expect(lines.find((l) => l.playbookId === "G1-GOOG")?.mode).toBeUndefined();
  });

  it("calls a playbook with a wiring gap blocked even while it runs — it can never trade", () => {
    const taco: PlaybookVerdict = { playbookId: "TACO-DJT", mode: "standard", state: "no-window" };
    expect(rollCall([taco]).find((l) => l.playbookId === "TACO-DJT")).toEqual({
      playbookId: "TACO-DJT",
      status: "blocked",
      mode: "standard",
      reason: "no feed",
    });
  });

  it("appends a Store playbook the bot ran that the house roster does not list", () => {
    const store: PlaybookVerdict = { playbookId: "U-abc", mode: "conservative", state: "flat" };
    expect(rollCall([store]).map((l) => l.playbookId)).toEqual([...ids, "U-abc"]);
  });

  /** A Store playbook's rule lives on its author's account, so this process cannot read what it is
   *  waiting for — it says only what it can stand behind, and carries no date. */
  it("falls back to the shared sentence for an armed playbook whose rule it cannot read", () => {
    const store: PlaybookVerdict = {
      playbookId: "U-abc",
      mode: "conservative",
      state: "no-window",
    };
    const line = rollCall([store]).find((l) => l.playbookId === "U-abc");
    expect(line?.reason).toBe("Checked on every pass; it trades when its own condition holds.");
    expect(line?.nextEntry).toBeUndefined();
  });

  it("lists the whole house roster off when no pass has recorded verdicts", () => {
    const view = botHeartbeatView([pass(20_000)], NOW, true);
    expect(view.rollCall.length).toBeGreaterThan(0);
    expect(view.rollCall.every((l) => l.status !== "armed")).toBe(true);
  });
});

/** #4650 — the roll call read only the bot's passes, so a playbook PAUSED in the Store (no verdict,
 *  exits still running) read "Off", the same as one nobody subscribed to, and a fresh subscription
 *  read "Off" until the bot's next pass. The subscriptions now say which is which. */
describe("playbookRollCall — reads the bot's own subscriptions", () => {
  const play = (id: string, whenOff?: string): Playbook => ({
    id,
    symbols: [id.split("-")[1] ?? "TST"],
    thesis: "a spec",
    evidence: "a spec",
    size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
    desiredState: () => "no-window",
    ...(whenOff ? { whenOff } : {}),
  });
  const house = [
    play("S1-NVDA"),
    play("G1-GOOG"),
    play("TACO-DJT"),
    play("CRWV-WHEEL"),
    play("BETA-SCOUT", "runs on one bot only"),
  ];
  const gaps = { "TACO-DJT": "no feed" };
  const sub = (playbookId: string, enabled = true) => ({ playbookId, enabled });
  const lineFor = (
    id: string,
    verdicts: readonly PlaybookVerdict[] | null,
    roster?: Parameters<typeof playbookRollCall>[5],
  ) => playbookRollCall(verdicts, NOW, house, gaps, [], roster).find((l) => l.playbookId === id);

  it("WHEN a playbook is paused in the Store, reads Paused — never Off — and says what still runs", () => {
    const line = lineFor("CRWV-WHEEL", null, { subscriptions: [sub("CRWV-WHEEL", false)] });
    expect(line).toMatchObject({ status: "paused" });
    expect(line?.reason).toMatch(/opens nothing new/);
    expect(line?.reason).toMatch(/sells on its own exit rules/);
    expect(line?.reason).toMatch(/covered calls on shares it was assigned/);
  });

  it("keeps it Paused when the newest pass, recorded before the pause, still ran it", () => {
    const ranBefore: PlaybookVerdict = { playbookId: "S1-NVDA", mode: "standard", state: "long" };
    const line = lineFor("S1-NVDA", [ranBefore], { subscriptions: [sub("S1-NVDA", false)] });
    expect(line).toMatchObject({ status: "paused" });
    expect(line?.mode).toBeUndefined(); // the stale pass's mode is not quoted as if it ran
  });

  it("WHEN subscribed and on with no pass yet, says it starts on the bot's next pass", () => {
    const line = lineFor("G1-GOOG", [s1("long")], { subscriptions: [sub("G1-GOOG")] });
    expect(line).toMatchObject({ status: "starting" });
    expect(line?.reason).toMatch(/starts on the bot's next pass/);
    // Once a pass runs it, it is simply On.
    const ran: PlaybookVerdict = { playbookId: "G1-GOOG", mode: "standard", state: "flat" };
    expect(lineFor("G1-GOOG", [ran], { subscriptions: [sub("G1-GOOG")] })?.status).toBe("armed");
  });

  it("keeps a playbook's own off-reason when a subscription alone never makes it run", () => {
    const line = lineFor("BETA-SCOUT", null, { subscriptions: [sub("BETA-SCOUT")] });
    expect(line).toEqual({
      playbookId: "BETA-SCOUT",
      status: "off",
      reason: "runs on one bot only",
    });
  });

  it("still calls a wiring gap Can't fire, subscribed, paused or not", () => {
    for (const enabled of [true, false]) {
      const line = lineFor("TACO-DJT", null, { subscriptions: [sub("TACO-DJT", enabled)] });
      expect(line).toEqual({ playbookId: "TACO-DJT", status: "blocked", reason: "no feed" });
    }
  });

  it("lists a subscription no house playbook answers to, and says nothing on the bot runs it", () => {
    const roster = { subscriptions: [sub("U-gone", false), sub("U-stale")] };
    const lines = playbookRollCall(null, NOW, house, gaps, [], roster);
    expect(lines.map((l) => l.playbookId).slice(-2)).toEqual(["U-gone", "U-stale"]);
    for (const line of lines.slice(-2)) {
      expect(line).toMatchObject({ status: "off" });
      expect(line.reason).toMatch(/find no playbook by this id/);
    }
  });

  it("WHEN the bots app's own setting names one this bot holds no subscription to, says its exits still run", () => {
    const roster = { subscriptions: [sub("S1-NVDA")], envNamed: ["S1-NVDA", "G1-GOOG"] };
    const line = lineFor("G1-GOOG", null, roster);
    expect(line).toMatchObject({ status: "off" });
    expect(line?.reason).toMatch(/opens nothing and its exit rules still sell what it holds/);
    // Named there AND subscribed is an ordinary subscription.
    expect(lineFor("S1-NVDA", null, roster)?.status).toBe("starting");
  });

  it("judges from the passes alone when the subscriptions could not be read", () => {
    expect(lineFor("CRWV-WHEEL", null)).toMatchObject({ status: "off" });
    expect(lineFor("CRWV-WHEEL", null)?.reason).not.toMatch(/Paused|exit rules/);
  });

  it("rides the heartbeat: botHeartbeatView passes the roster to the roll call", () => {
    const view = botHeartbeatView([pass(20_000)], NOW, true, undefined, {
      subscriptions: [sub("CRWV-WHEEL", false)],
    });
    expect(view.rollCall.find((l) => l.playbookId === "CRWV-WHEEL")?.status).toBe("paused");
  });
});

/** #4777 AC7 — a lot the stream keeps priced but nothing on the bot will ever sell is said out
 *  loud, never left silently frozen on the book. */
describe("unmanagedHoldings — a held lot no rule on this bot will exit", () => {
  const lot = (symbol: string, quantity = 10) => ({ symbol, quantity });
  const g1 = (state: PlaybookVerdict["state"]): PlaybookVerdict => ({
    playbookId: "G1-GOOG",
    mode: "standard",
    state,
  });

  it("WHEN G1-GOOG is unsubscribed while its bot holds GOOG, names GOOG unmanaged", () => {
    const holdings = { positions: [lot("GOOG"), lot("NVDA")], subscribedIds: [] };
    expect(unmanagedHoldings(holdings, [s1("long")])).toEqual(["GOOG"]);
    // A bot that runs no playbook at all records no verdicts — the lot is still named.
    expect(unmanagedHoldings(holdings, null)).toEqual(["GOOG"]);
  });

  it("leaves GOOG managed while G1-GOOG runs, and while it is merely PAUSED (no verdict, exits still run)", () => {
    expect(
      unmanagedHoldings({ positions: [lot("GOOG")], subscribedIds: [] }, [g1("long")]),
    ).toEqual([]);
    expect(
      unmanagedHoldings({ positions: [lot("GOOG")], subscribedIds: ["G1-GOOG"] }, null),
    ).toEqual([]);
  });

  /** #4650 — a playbook the bots app's own setting names, with no subscription, opens nothing but
   *  still runs its exits, so the roll call cannot also say nothing sells its lot. */
  it("leaves GOOG managed while G1-GOOG runs exits only from the bots app's own setting", () => {
    const holdings = { positions: [lot("GOOG")], subscribedIds: [] };
    expect(unmanagedHoldings(holdings, null, undefined, ["G1-GOOG"])).toEqual([]);
    const view = botHeartbeatView([pass(20_000)], NOW, true, holdings, {
      subscriptions: [],
      envNamed: ["G1-GOOG"],
    });
    expect(view.unmanaged).toEqual([]);
  });

  it("never flags the ten names the base persona trades, an option contract, or a closed line", () => {
    const holdings = {
      positions: [lot("NVDA"), lot("CRWV261120P00080000", -1), lot("GOOG", 0)],
      subscribedIds: [],
    };
    expect(unmanagedHoldings(holdings, null)).toEqual([]);
  });

  it("makes no claim when the bot runs a playbook whose basket this process cannot read", () => {
    const holdings = { positions: [lot("GOOG")], subscribedIds: ["U-eric-custom"] };
    expect(unmanagedHoldings(holdings, null)).toBeNull();
  });

  it("rides the heartbeat only when the dashboard could read the bot's book", () => {
    const records = [pass(20_000, [s1("long")])];
    expect(botHeartbeatView(records, NOW, true).unmanaged).toBeUndefined();
    const view = botHeartbeatView(records, NOW, true, {
      positions: [lot("GOOG")],
      subscribedIds: [],
    });
    expect(view.unmanaged).toEqual(["GOOG"]);
  });
});
