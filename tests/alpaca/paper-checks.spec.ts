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
        symbol: "AMD261124C00600000",
        limit_price: 0.01,
        extended_hours: true,
        position_intent: "buy_to_open",
      }),
    ]);
    expect(record.rows[0]?.answer).toMatch(/NVDA false, AMD true, MSFT false/);
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
            symbol: "SPY261124C00600000",
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
