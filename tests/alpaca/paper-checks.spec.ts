import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PAPER_CHECKS, parseOnly } from "../../src/alpaca/paper-checks/catalog.js";
import {
  credentialsFrom,
  dryRunTransport,
  PaperCheckRefused,
  redactor,
} from "../../src/alpaca/paper-checks/guard.js";
import {
  latestAnswers,
  type RunRecord,
  renderReadme,
  writeResults,
} from "../../src/alpaca/paper-checks/results.js";
import { createRun } from "../../src/alpaca/paper-checks/run.js";
import { phaseAt, windowFor } from "../../src/alpaca/paper-checks/windows.js";
import type { SessionDay } from "../../src/domain/market-clock.js";
import { ACCOUNT_ID, ACCOUNT_NUMBER, et, FakeAlpaca, KEY, SECRET } from "./paper-checks-fake.js";

// #8256: the paper checks place real paper orders, so the specs prove the guard refuses before any
// request, each check sends the body it claims, nothing leaves the account open, and no secret
// reaches the record — all against a fake broker on a fixed clock.

function harness(at: number, opts: { open?: boolean; only?: string; dryRun?: boolean } = {}) {
  const clock = { now: at };
  const broker = new FakeAlpaca(clock);
  broker.isOpen = opts.open ?? false;
  const log: string[] = [];
  const run = createRun({
    trading: opts.dryRun ? dryRunTransport(broker.trading, (l) => log.push(l)) : broker.trading,
    data: broker.data,
    only: parseOnly(opts.only),
    runId: "run1",
    dryRun: opts.dryRun ?? false,
    sameDayQty: 25,
    campaignSymbols: ["NVDA", "AMD", "MSFT"],
    now: () => clock.now,
    sleep: (ms) => {
      clock.now += ms;
      return Promise.resolve();
    },
  });
  return { broker, run, clock, log };
}

const TUE = "2026-11-24";

describe("paper checks: only the test account", () => {
  it("refuses with no key, and with a key that is a bot's or a member's", () => {
    expect(() => credentialsFrom({})).toThrow(PaperCheckRefused);
    expect(() => credentialsFrom({ SKYNET_PAPER_CHECK_KEY: KEY })).toThrow(/no test account key/);
    const ok = { SKYNET_PAPER_CHECK_KEY: KEY, SKYNET_PAPER_CHECK_SECRET: SECRET };
    for (const other of ["SKYNET_BOT_KEY", "SKYNET_BOT_FUTURIST_KEY", "SKYNET_HUMAN_ERIC_KEY"]) {
      expect(() => credentialsFrom({ ...ok, [other]: KEY })).toThrow(new RegExp(other));
    }
    expect(credentialsFrom({ ...ok, SKYNET_BOT_KEY: "someone-else" })).toEqual({
      apiKey: KEY,
      apiSecret: SECRET,
    });
  });

  it("exits 2 having sent no request when the key is missing", () => {
    const env = { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" };
    const result = spawnSync("npx", ["tsx", "scripts/paper-checks.mjs"], { env, encoding: "utf8" });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/no test account key/);
  });

  const refusals: [string, (b: FakeAlpaca) => void, RegExp][] = [
    [
      "a non-PA account",
      (b) => {
        b.accountNumber = "123456789";
      },
      /not a paper account/,
    ],
    [
      "a position it didn't open",
      (b) => {
        b.positions = ["AAPL"];
      },
      /holds 1 position/,
    ],
    [
      "an open order it didn't place",
      (b) => {
        b.open.set("theirs", { id: "theirs", client_order_id: "member-order" });
      },
      /1 open order\(s\) this tool didn't place/,
    ],
  ];
  for (const [name, arrange, message] of refusals) {
    it(`refuses ${name} before placing anything, and its cleanup touches nothing`, async () => {
      const { broker, run } = harness(et(TUE, 16, 30));
      arrange(broker);
      await expect(run.execute()).rejects.toThrow(message);
      await run.cleanup();
      expect(broker.writes()).toEqual([]);
    });
  }
});

describe("paper checks: the window gate", () => {
  const sessions: SessionDay[] = [
    "2026-11-23",
    TUE,
    "2026-11-25",
    "2026-11-27",
    "2026-11-30",
    "2026-12-04",
  ].map((d) => ({
    date: d,
    openAt: et(d, 9, 30),
    closeAt: et(d, 16),
  }));
  const facts = (now: number, clockOpen = false) => ({ now, clockOpen, sessions });

  it("names the phase from the calendar", () => {
    expect(phaseAt(facts(et(TUE, 11)))).toBe("regular hours");
    expect(phaseAt(facts(et(TUE, 8)))).toBe("pre-market");
    expect(phaseAt(facts(et(TUE, 16, 30)))).toBe("after hours");
    expect(phaseAt(facts(et(TUE, 21, 30)))).toBe("overnight");
    expect(phaseAt(facts(et("2026-11-29", 21)))).toBe("overnight"); // Sunday night, before Monday
    expect(phaseAt(facts(et("2026-11-27", 21, 30)))).toBe("closed"); // Friday night
  });

  it("opens each check only in its window and names the next start otherwise", () => {
    expect(windowFor("extended-hours", facts(et(TUE, 16, 30)))).toEqual({ open: true });
    expect(windowFor("extended-hours", facts(et(TUE, 21, 30)))).toEqual({ open: true });
    expect(windowFor("evening-quotes", facts(et(TUE, 16, 30)))).toEqual({
      open: false,
      next: "Tue, Nov 24, 5:00 PM ET",
    });
    expect(windowFor("fractional-exits", facts(et(TUE, 16, 30)))).toEqual({
      open: false,
      next: "Wed, Nov 25, 9:30 AM ET",
    });
    expect(windowFor("fractional-exits", facts(et(TUE, 11), true))).toEqual({ open: true });
    expect(windowFor("bracket-after-close", facts(et(TUE, 11), true))).toEqual({
      open: false,
      next: "Tue, Nov 24, 4:00 PM ET",
    });
    expect(windowFor("options-extended-hours", facts(et(TUE, 7, 45)))).toEqual({
      open: false,
      next: "Fri, Dec 4, 7:30 AM ET",
    });
    expect(windowFor("options-extended-hours", facts(et("2026-12-04", 16, 5)))).toEqual({
      open: true,
    });
  });

  it("records not in window and places nothing outside it", async () => {
    const { broker, run } = harness(et(TUE, 16, 30), {
      only: "fractional-exits,mleg-stock-leg,account-cap",
    });
    const record = await run.execute();
    expect(record.rows.map((r) => r.outcome)).toEqual([
      "not in window",
      "not in window",
      "not scriptable",
    ]);
    expect(record.rows[0]?.nextWindow).toBe("Wed, Nov 25, 9:30 AM ET");
    expect(broker.writes()).toEqual([]);
    expect(record.exitCode).toBe(0);
  });
});

describe("paper checks: each body's shape", () => {
  it("check 1 sends an unfillable limit bracket, day and gtc, and watches it through the open", async () => {
    const { broker, run, clock } = harness(et("2026-11-25", 9, 15), {
      only: "bracket-after-close",
    });
    const record = await run.execute();
    const [day, gtc] = broker.posted();
    expect(day).toMatchObject({
      symbol: "SPY",
      qty: "1",
      type: "limit",
      order_class: "bracket",
      time_in_force: "day",
    });
    expect(gtc).toMatchObject({
      time_in_force: "gtc",
      client_order_id: "paperchk-run1-bracket-after-close-2",
    });
    expect(Number(day?.limit_price)).toBeLessThanOrEqual(600 * 0.3);
    expect(day?.take_profit).toEqual({ limit_price: 270 });
    expect(day?.stop_loss).toEqual({ stop_price: 90 });
    expect(clock.now).toBeGreaterThanOrEqual(et("2026-11-25", 9, 31));
    expect(record.rows[0]?.attempts.some((a) => a.label.endsWith("after the open"))).toBe(true);
    expect(broker.open.size).toBe(0);
  });

  it("check 2 sends a whole-share extended_hours day limit and names the session", async () => {
    const { broker, run } = harness(et(TUE, 21, 30), { only: "extended-hours" });
    const record = await run.execute();
    expect(broker.posted()).toEqual([
      expect.objectContaining({
        qty: "1",
        type: "limit",
        time_in_force: "day",
        extended_hours: true,
      }),
    ]);
    expect(record.rows[0]?.answer).toMatch(/overnight/);
  });

  it("check 3 reads every feed for SPY and NVDA, places nothing, and records each age", async () => {
    const { broker, run } = harness(et(TUE, 18, 30), { only: "evening-quotes" });
    const row = (await run.execute()).rows[0];
    expect(broker.writes()).toEqual([]);
    expect(row?.attempts).toHaveLength(4 * 2 * 2);
    expect(row?.attempts.find((a) => a.label === "SPY quote on iex")).toMatchObject({
      result: "accepted",
      ageSeconds: 12,
    });
    expect(row?.attempts.find((a) => a.label === "NVDA trade on boats")).toMatchObject({
      result: "refused",
      httpStatus: 403,
    });
    expect(row?.outcome).toBe("accepted");
  });

  it("check 4 sends a 0.5 bracket, buys 0.5, sends an OCO, cancels it and sells back", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "fractional-exits" });
    const record = await run.execute();
    expect(
      broker.posted().map((b) => `${b.qty} ${b.side} ${b.type} ${b.order_class ?? ""}`.trim()),
    ).toEqual(["0.5 buy limit bracket", "0.5 buy market", "0.5 sell limit oco", "0.5 sell market"]);
    expect(record.rows[0]?.answer).toMatch(/filled at 600.10/);
    expect(broker.positions).toEqual([]);
    expect(broker.open.size).toBe(0);
  });

  it("check 6 reads the flag on each campaign name, then bids $0.01 with extended_hours", async () => {
    const { broker, run } = harness(et("2026-12-04", 7, 45), { only: "options-extended-hours" });
    broker.extendedFlag = new Set(["AMD"]);
    const record = await run.execute();
    expect(broker.posted()).toEqual([
      expect.objectContaining({
        symbol: "AMD261207C00600000",
        limit_price: 0.01,
        extended_hours: true,
        position_intent: "buy_to_open",
      }),
    ]);
    expect(record.rows[0]?.answer).toMatch(/NVDA false, AMD true, MSFT false/);
  });

  it("check 6 on an expiry day bids on a later expiry, never one expiring that day (#8374)", async () => {
    // Friday 2026-12-04 16:05 ET is in check 6's post-close window, and an opening order on a
    // contract expiring that day is refused for the broker's expiry-day cutoff, not extended hours.
    const { broker, run } = harness(et("2026-12-04", 16, 5), { only: "options-extended-hours" });
    broker.extendedFlag = new Set(["NVDA"]);
    await run.execute();
    const asked = broker.calls.find((c) => c.path.startsWith("/v1beta1/options/snapshots/NVDA"));
    expect(asked?.path).toContain("expiration_date_gte=2026-12-05");
    expect(broker.posted().map((b) => b.symbol)).toEqual(["NVDA261207C00600000"]);
  });

  it("check 7 buys 1 same-day contract then --same-day-qty, and records each message", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "same-day-options" });
    broker.refuse = (b) =>
      b.qty === "25" ? { status: 403, body: { message: "0DTE order limit exceeded" } } : undefined;
    const row = (await run.execute()).rows[0];
    expect(broker.posted().map((b) => [b.qty, b.limit_price])).toEqual([
      ["1", 0.01],
      ["25", 0.01],
    ]);
    expect(row?.outcome).toBe("refused");
    expect(row?.answer).toMatch(
      /25 contracts expiring today: refused, HTTP 403, "0DTE order limit exceeded"/,
    );
  });

  it("check 8 sends one mleg with a 100-share stock leg and a call sold", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "mleg-stock-leg" });
    await run.execute();
    expect(broker.posted()).toEqual([
      expect.objectContaining({
        order_class: "mleg",
        limit_price: 180,
        legs: [
          { symbol: "SPY", ratio_qty: "100", side: "buy", position_intent: "buy_to_open" },
          {
            symbol: "SPY261201C00600000",
            ratio_qty: "1",
            side: "sell",
            position_intent: "sell_to_open",
          },
        ],
      }),
    ]);
  });

  it("a dry run prints every body and sends no POST, PATCH or DELETE", async () => {
    const { broker, run, log } = harness(et(TUE, 11), {
      open: true,
      only: "fractional-exits,mleg-stock-leg",
      dryRun: true,
    });
    const record = await run.execute();
    expect(broker.writes()).toEqual([]);
    expect(log.filter((l) => l.startsWith("dry run, not sent: POST /v2/orders"))).toHaveLength(5);
    expect(record.rows.map((r) => r.outcome)).toEqual(["dry run", "dry run"]);
  });
});

describe("paper checks: cleanup", () => {
  it("cancels everything and closes the position when a check throws mid-flight", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "fractional-exits" });
    broker.throwOnDelete = 2; // the OCO's cancel dies: the check throws with an OCO and 0.5 SPY live
    const record = await run.execute();
    expect(record.rows[0]?.outcome).toBe("error");
    expect(broker.open.size).toBe(0);
    expect(broker.positions).toEqual([]);
    expect(record.rows[0]?.cleanup).toBe("cancelled");
    expect(record.exitCode).toBe(0);
  });

  it("exits 1 and names an order the broker won't cancel", async () => {
    const { broker, run } = harness(et(TUE, 16, 30), { only: "extended-hours" });
    broker.stuck.add("ord-1");
    const record = await run.execute();
    expect(record.exitCode).toBe(1);
    expect(record.stillOpen).toEqual(["ord-1"]);
    expect(record.rows[0]?.cleanup).toBe("still open: ord-1");
  });

  // #8371: a list read that fails is not an empty list. Once the run has posted an order, its
  // open-orders and positions reads answer `how` (`times` times, then heal).
  const LIST_READ = /^\/v2\/(orders\?|positions$)/;
  function failListReads(broker: FakeAlpaca, how: 429 | 500 | "throw", times = Infinity) {
    const inner = broker.trading.get;
    let left = times;
    broker.trading.get = (path) => {
      const placed = broker.calls.some((c) => c.method === "POST");
      const fails = placed && LIST_READ.test(path) && left > 0;
      if (!fails) return inner(path);
      left -= 1;
      if (how === "throw") return Promise.reject(new Error("fake: connection reset"));
      return Promise.resolve({ status: how, body: { message: "fake: unavailable" } });
    };
  }

  for (const how of [429, 500, "throw"] as const) {
    it(`cancels from its ledger, then names what it can't confirm and exits 1, when the lists answer ${how}`, async () => {
      const { broker, run } = harness(et(TUE, 16, 30), { only: "bracket-after-close" });
      failListReads(broker, how);
      const record = await run.execute();
      expect(broker.open.size).toBe(0); // the ledger's DELETEs reached both brackets anyway
      expect(record.exitCode).toBe(1);
      expect(record.stillOpen).toEqual(expect.arrayContaining(["ord-1", "ord-2"]));
      expect(record.rows[0]?.cleanup).toMatch(/^not confirmed closed.*ord-1.*ord-2/);
      const why = how === "throw" ? "no answer" : `HTTP ${how}`;
      expect(record.unread).toEqual([`open orders (${why})`, `positions (${why})`]);
    });
  }

  it("rides out list reads that fail once, and reports the run clean", async () => {
    const { broker, run } = harness(et(TUE, 16, 30), { only: "bracket-after-close" });
    failListReads(broker, 500, 2); // the cancel pass's two reads fail; the confirm reads answer
    const record = await run.execute();
    expect(broker.open.size).toBe(0);
    expect(record.exitCode).toBe(0);
    expect(record.stillOpen).toEqual([]);
    expect(record.unread).toBeUndefined();
    expect(record.rows[0]?.cleanup).toBe("cancelled");
  });
});

describe("paper checks: the record", () => {
  it("never carries the key, the secret, the account id or the account number", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true });
    broker.refuse = (b) =>
      b.order_class === "mleg"
        ? { status: 422, body: { message: `account ${ACCOUNT_NUMBER} (${ACCOUNT_ID}) cannot` } }
        : undefined;
    const record = await run.execute();
    const dir = mkdtempSync(join(tmpdir(), "paper-checks-"));
    writeResults(dir, TUE, record, redactor([KEY, SECRET, ACCOUNT_ID, ACCOUNT_NUMBER]));
    const written =
      readFileSync(join(dir, `${TUE}.json`), "utf8") + readFileSync(join(dir, "README.md"), "utf8");
    for (const secret of [KEY, SECRET, ACCOUNT_ID, ACCOUNT_NUMBER])
      expect(written).not.toContain(secret);
    expect(written).toContain("[redacted]");
    expect(run.secrets()).toEqual({ id: ACCOUNT_ID, number: ACCOUNT_NUMBER });
  });

  const row = (check: string, outcome: string, answer: string, nextWindow?: string) =>
    ({
      check,
      outcome,
      answer,
      ranAt: "",
      phase: "closed",
      attempts: [],
      orderIds: [],
      cleanup: "",
      ...(nextWindow ? { nextWindow } : {}),
    }) as RunRecord["rows"][number];
  const run = (rows: RunRecord["rows"]): RunRecord => ({
    runId: "r",
    startedAt: "",
    finishedAt: "",
    exitCode: 0,
    rows,
    stillOpen: [],
    positionsLeft: [],
  });

  it("keeps the latest answer, and not in window only until a run answers it", () => {
    const latest = latestAnswers([
      {
        date: "2026-11-24",
        runs: [
          run([
            row("extended-hours", "accepted", "after hours ok"),
            row("evening-quotes", "not in window", "", "Tue, Nov 24, 5:00 PM ET"),
          ]),
        ],
      },
      { date: "2026-11-25", runs: [run([row("extended-hours", "not in window", "", "later")])] },
    ]);
    expect(latest.get("extended-hours")).toEqual({
      answer: "accepted: after hours ok",
      date: "2026-11-24",
    });
    expect(latest.get("evening-quotes")?.answer).toBe(
      "not in window yet; next window Tue, Nov 24, 5:00 PM ET",
    );
  });

  it("renders one 4-column row per check, answers in words", () => {
    const readme = renderReadme([]);
    const rows = readme.split("\n").filter((l) => l.startsWith("| `"));
    expect(rows).toHaveLength(PAPER_CHECKS.length);
    for (const line of rows) expect(line.split(/(?<!\\)\|/).length - 2).toBe(4);
    expect(readme).toMatch(/`fractional-exits`[^\n]*\| not run yet \|/);
    expect(readme).toMatch(/`account-cap`[^\n]*\| not scriptable:/);
  });
});

describe("paper checks: review fixes", () => {
  it("check 4 cancels its bracket before anything sells, so the wash-trade guard can't answer for it", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "fractional-exits" });
    await run.execute();
    const order = broker
      .writes()
      .map((c) =>
        c.method === "POST" ? `POST ${c.body?.side} ${c.body?.type}` : `DELETE ${c.path}`,
      );
    expect(order.slice(0, 3)).toEqual([
      "POST buy limit",
      "DELETE /v2/orders/ord-1",
      "POST buy market",
    ]);
  });

  it("check 4 sends no OCO or sell when the market buy doesn't fill", async () => {
    const { broker, run } = harness(et(TUE, 11), { open: true, only: "fractional-exits" });
    broker.fillMarket = false;
    const record = await run.execute();
    expect(broker.posted().map((b) => b.side)).toEqual(["buy", "buy"]);
    expect(record.rows[0]?.answer).toMatch(/did not fill in 10 seconds, so no OCO sent/);
    expect(broker.open.size).toBe(0);
  });

  it("check 6 with no flagged name stays not in window and sends nothing", async () => {
    const { broker, run } = harness(et("2026-12-04", 7, 45), { only: "options-extended-hours" });
    const row = (await run.execute()).rows[0];
    expect(row?.outcome).toBe("not in window");
    expect(broker.writes()).toEqual([]);
  });

  it("opens the post-close options window at a half day's 13:00 close", () => {
    const half: SessionDay[] = [
      { date: "2026-12-24", openAt: et("2026-12-24", 9, 30), closeAt: et("2026-12-24", 13) },
    ];
    const facts = (now: number) => ({ now, clockOpen: false, sessions: half });
    expect(windowFor("options-extended-hours", facts(et("2026-12-24", 13, 5))).open).toBe(true);
    expect(windowFor("options-extended-hours", facts(et("2026-12-24", 16, 5))).open).toBe(false);
  });

  it("an interrupt sends nothing more, starts no further check, cleans up and exits 130", async () => {
    const { broker, run } = harness(et(TUE, 11), {
      open: true,
      only: "same-day-options,mleg-stock-leg",
    });
    const original = broker.refuse;
    broker.refuse = (b) => {
      run.interrupt(); // the signal lands while check 7's first order is in flight
      return original(b);
    };
    const record = await run.execute();
    expect(broker.posted()).toHaveLength(1);
    expect(record.rows.map((r) => r.check)).toEqual(["same-day-options"]);
    expect(record.rows[0]?.answer).toMatch(/interrupted, not sent/);
    expect(broker.open.size).toBe(0);
    expect(record.exitCode).toBe(130);
  });

  it("a signal during check 1's watch through the open ends the watch and cleans up at once (#8372)", async () => {
    const clock = { now: et("2026-11-25", 9, 15) };
    const signalAt = et("2026-11-25", 9, 16);
    const broker = new FakeAlpaca(clock);
    let signalled = false;
    let readsAtSignal = 0;
    const orderReads = () =>
      broker.calls.filter(
        (c) => c.method === "GET" && /^\/v2\/orders\/[^/?]+\?nested=true$/.test(c.path),
      ).length;
    const run = createRun({
      trading: broker.trading,
      data: broker.data,
      only: parseOnly("bracket-after-close"),
      runId: "run1",
      dryRun: false,
      sameDayQty: 25,
      campaignSymbols: [],
      now: () => clock.now,
      // scripts/paper-checks.mjs's sleep: once a signal has landed every wait resolves at once. A
      // second of clock per wait stands in for the broker read in between, so the unfixed loop ends.
      sleep: (ms) => {
        if (signalled) {
          clock.now += 1000;
          return Promise.resolve();
        }
        clock.now += ms;
        if (clock.now >= signalAt) {
          signalled = true;
          readsAtSignal = orderReads();
          run.interrupt();
        }
        return Promise.resolve();
      },
    });
    const record = await run.execute();
    expect(signalled).toBe(true);
    expect(orderReads() - readsAtSignal).toBe(0);
    expect(clock.now).toBeLessThan(et("2026-11-25", 9, 17));
    expect(broker.writes().some((c) => c.method === "DELETE")).toBe(true);
    expect(broker.open.size).toBe(0);
    expect(record.exitCode).toBe(130);
  });

  it("a signal before the open keeps no pre-open read under 'after the open' (#8393)", async () => {
    // Started 09:15 ET, signalled at 09:16:05: the 09:16 read was made before the open, so neither
    // the answer nor the attempts may call it an after-the-open read. The README still takes this
    // run's row as check 1's latest answer, so that answer must not claim a read it never made.
    const day = "2026-11-25";
    const clock = { now: et(day, 9, 15) };
    const signalAt = et(day, 9, 16) + 5_000;
    const broker = new FakeAlpaca(clock);
    let signalled = false;
    const run = createRun({
      trading: broker.trading,
      data: broker.data,
      only: parseOnly("bracket-after-close"),
      runId: "run1",
      dryRun: false,
      sameDayQty: 25,
      campaignSymbols: [],
      now: () => clock.now,
      // scripts/paper-checks.mjs's sleep: a wait ends at the signal instant, later ones at once.
      sleep: (ms) => {
        if (signalled) return Promise.resolve();
        if (clock.now + ms >= signalAt) {
          clock.now = signalAt;
          signalled = true;
          run.interrupt();
        } else clock.now += ms;
        return Promise.resolve();
      },
    });
    const record = await run.execute();
    const check1 = record.rows[0];
    if (!check1) throw new Error("check 1 recorded no row");
    expect(record.exitCode).toBe(130);
    expect(check1.outcome).toBe("accepted");
    expect(check1.attempts.filter((a) => a.label.endsWith("after the open"))).toEqual([]);
    expect(check1.answer).not.toMatch(/after the open/);
    const latest = latestAnswers([
      {
        date: "2026-11-24",
        runs: [{ ...record, rows: [{ ...check1, answer: "bracket, day, after the open: held" }] }],
      },
      { date: day, runs: [record] },
    ]);
    expect(latest.get("bracket-after-close")?.answer ?? "").not.toMatch(/after the open/);
  });

  it("check 1 cancels its brackets before a later check sells SPY, in a default run that crosses the open (#8373)", async () => {
    // The run the issue plans for: every check, started 09:15 ET, check 1 watched through the open.
    // The broker's clock flips at 09:30, so check 4 runs at 09:31 and sells SPY twice. An open SPY
    // buy limit beside a sell is what Alpaca's wash-trade guard refuses, so none may be resting.
    const clock = { now: et("2026-11-25", 9, 15) };
    const broker = new FakeAlpaca(clock);
    const restingAtSell: { sell: string; restingBuyLimits: string[] }[] = [];
    const sentBodies = new Map<string, Record<string, unknown>>();
    const original = broker.refuse;
    broker.refuse = (body) => {
      sentBodies.set(String(body.client_order_id), body);
      if (body.symbol === "SPY" && body.side === "sell") {
        const resting = [...broker.open.values()]
          .map((o) => String(o.client_order_id))
          .filter((cid) => {
            const sent = sentBodies.get(cid);
            return sent?.symbol === "SPY" && sent.side === "buy" && sent.type === "limit";
          });
        restingAtSell.push({
          sell: `${body.type}${body.order_class ? ` ${body.order_class}` : ""}`,
          restingBuyLimits: resting,
        });
      }
      return original(body);
    };
    const run = createRun({
      trading: broker.trading,
      data: broker.data,
      only: parseOnly(undefined),
      runId: "run1",
      dryRun: false,
      sameDayQty: 25,
      campaignSymbols: ["NVDA", "AMD", "MSFT"],
      now: () => clock.now,
      sleep: (ms) => {
        clock.now += ms;
        if (clock.now >= et("2026-11-25", 9, 30)) broker.isOpen = true;
        return Promise.resolve();
      },
    });
    const record = await run.execute();
    const check1 = record.rows.find((r) => r.check === "bracket-after-close");
    const check4 = record.rows.find((r) => r.check === "fractional-exits");
    expect(check1?.attempts.some((a) => a.label.endsWith("after the open"))).toBe(true);
    expect(check4?.outcome).toBe("accepted");
    expect(restingAtSell).toEqual([
      { sell: "limit oco", restingBuyLimits: [] },
      { sell: "market", restingBuyLimits: [] },
    ]);
    expect(broker.open.size).toBe(0);
    expect(record.exitCode).toBe(0);
  });

  it("cancels a paperchk- order an earlier run left behind", async () => {
    const { broker, run } = harness(et(TUE, 16, 30), { only: "account-cap" });
    broker.open.set("old-1", {
      id: "old-1",
      client_order_id: "paperchk-earlier-bracket-after-close-2",
    });
    const record = await run.execute();
    expect(broker.open.size).toBe(0);
    expect(record.exitCode).toBe(0);
  });

  it("a later error or wait never hides an earlier broker answer in the README", () => {
    const row = (check: string, outcome: string, answer: string) =>
      ({
        check,
        outcome,
        answer,
        ranAt: "",
        phase: "closed",
        attempts: [],
        orderIds: [],
        cleanup: "",
      }) as RunRecord["rows"][number];
    const run = (rows: RunRecord["rows"]): RunRecord => ({
      runId: "r",
      startedAt: "",
      finishedAt: "",
      exitCode: 0,
      rows,
      stillOpen: [],
      positionsLeft: [],
    });
    const latest = latestAnswers([
      { date: "2026-11-24", runs: [run([row("mleg-stock-leg", "refused", "no stock legs")])] },
      {
        date: "2026-11-25",
        runs: [
          run([
            row("mleg-stock-leg", "error", "no IEX last trade"),
            row("same-day-options", "error", "timeout"),
          ]),
        ],
      },
    ]);
    expect(latest.get("mleg-stock-leg")).toEqual({
      answer: "refused: no stock legs",
      date: "2026-11-24",
    });
    expect(latest.get("same-day-options")?.answer).toBe("error: timeout");
  });
});
