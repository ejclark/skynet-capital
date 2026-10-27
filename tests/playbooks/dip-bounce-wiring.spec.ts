import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { alpacaIntradayBars } from "../../src/alpaca/alpaca-intraday-bars.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { Bot } from "../../src/bots/bot.js";
import type { IntradayBar } from "../../src/domain/intraday-bar.js";
import type { SignalObservation } from "../../src/domain/playbook-observation.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { IntradayBarsFeed } from "../../src/playbooks/intraday-bars-feed.js";
import { PLAYBOOK_WIRING_GAPS } from "../../src/playbooks/registry.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { aContext, aSubscription } from "../support/builders.js";
import { day, dipDay, etIso, session } from "../support/intraday-bars.js";

/**
 * THE DARK RUN, END TO END (#5489 slice 2). Alpaca's 5-minute bars → the feed → the roster the bots
 * app builds → one LIVE trader cycle against a broker → the decision record → the decision store.
 * The point of every case: the bars reach the playbook and its would-be orders are recorded, and the
 * broker is never asked for anything.
 */

const bot: Bot = {
  persona: { id: "quiet", name: "Quiet", thesis: "t", decide: () => [] },
  credentials: { apiKey: "k", apiSecret: "s" },
};

/** The tape as Alpaca would serve it at 11:15:30 ET: every closed bar, plus the 11:15 bar still forming. */
const served = (): IntradayBar[] =>
  [...session(day(0), 100), ...dipDay(day(1))].filter((b) => b.date < day(1) || b.minutes <= 705);
const utc = (b: IntradayBar): string => {
  const hh = String(Math.floor(b.minutes / 60)).padStart(2, "0");
  const mm = String(b.minutes % 60).padStart(2, "0");
  return new Date(`${b.date}T${hh}:${mm}:00-04:00`).toISOString();
};

/** A data host that serves those bars and records every path it was asked for. */
function dataHost() {
  const paths: string[] = [];
  const body = {
    bars: served().map((b) => ({
      t: utc(b),
      o: b.open,
      h: b.high,
      l: b.low,
      c: b.close,
      v: b.volume,
    })),
    next_page_token: null,
  };
  return {
    paths,
    get: (path: string): Promise<JsonResponse> => {
      paths.push(path);
      return Promise.resolve({ status: 200, body });
    },
  };
}

const justClosed = etIso(day(1), 705);
const market = aContext({ MU: { last: 97.5 } }, justClosed);

function run(
  subscriptions: readonly PlaybookSubscription[],
  { db }: { readonly db?: DecisionDb } = {},
) {
  const host = dataHost();
  const feed = new IntradayBarsFeed(alpacaIntradayBars(host));
  const broker = new InMemoryBroker(1_000_000, Object.values(market.quotes));
  const submit = rstest.spyOn(broker, "submit");
  const trading = tradingRoster(
    resolveBotRoster(bot, [], subscriptions),
    DEFAULT_RISK_CONFIG,
    undefined,
    {
      intradayBars: feed.barsOf,
    },
  );
  const records: DecisionRecord[] = [];
  const trader = new AutonomousTrader({
    persona: trading.persona,
    broker,
    risk: trading.risk,
    mode: "live",
    now: () => 1_760_000_000_000,
    onDecision: (r) => {
      records.push(r);
      db?.record(r);
    },
  });
  return {
    host,
    feed,
    submit,
    records,
    pass: () => trader.evaluate(market),
  };
}

const MU = aSubscription("quiet", "MU-DIP-BOUNCE");
const NBIS = aSubscription("quiet", "NBIS-DIP-BOUNCE");

describe("the 5-minute bars reach the dark playbook and its would-be orders are recorded", () => {
  it("records nothing until the first bars have been read, then the signal with its quote", async () => {
    const { feed, records, pass } = run([MU]);
    await pass(); // the playbook asks for MU's bars; nothing has been read yet
    expect(records[0]?.playbookObservations).toBeUndefined();
    expect(records[0]?.playbookVerdicts).toEqual([
      { playbookId: "MU-DIP-BOUNCE", mode: "standard", state: "observing" },
    ]);

    await feed.refresh();
    await pass();
    const observed = records[1]?.playbookObservations ?? [];
    const signal = observed.find((o): o is SignalObservation => o.kind === "signal");
    expect(signal).toMatchObject({
      playbookId: "MU-DIP-BOUNCE",
      symbol: "MU",
      session: day(1),
      minutes: 700,
      outcome: "buy",
      entry: { side: "buy", kind: "market", price: 97.5, shares: 10 },
      exit: { side: "sell", kind: "resting", price: 98.5, shares: 10 },
      quote: { bid: 97.45, ask: 97.55, last: 97.5, seenAt: Date.parse(justClosed) },
    });
    expect(signal?.vwap).toBeCloseTo(100, 1);
    expect(signal?.range).toBeCloseTo(1, 6);
    expect(observed.find((o) => o.kind === "day")).toMatchObject({ level: "none", held: 1 });
  });

  it("says each observation once: the next pass on the same bars records none", async () => {
    const { feed, records, pass } = run([MU]);
    await pass();
    await feed.refresh();
    await pass();
    await pass();
    expect(records[1]?.playbookObservations?.length).toBeGreaterThan(0);
    expect(records[2]?.playbookObservations).toBeUndefined();
    expect(records[2]?.playbookVerdicts).toHaveLength(1);
  });

  it("asks the data host for MU's 5-minute bars only, and for nothing when no bot subscribed", async () => {
    const mu = run([MU]);
    await mu.pass();
    await mu.feed.refresh();
    expect(mu.host.paths).toHaveLength(1);
    expect(mu.host.paths[0]).toContain("/v2/stocks/MU/bars?");
    expect(mu.host.paths[0]).toContain("timeframe=5Min");

    const none = run([]);
    await none.pass();
    await none.feed.refresh();
    expect(none.host.paths).toEqual([]);
    expect(none.records[0]?.playbookObservations).toBeUndefined();

    const off = run([aSubscription("quiet", "MU-DIP-BOUNCE", { enabled: false })]);
    await off.pass();
    await off.feed.refresh();
    expect(off.host.paths).toEqual([]);
  });

  it("watches each name a bot subscribed to, and records them under their own playbook", async () => {
    const { feed, host, records, pass } = run([MU, NBIS]);
    await pass();
    await feed.refresh();
    await pass();
    expect(host.paths.map((p) => p.split("/")[3])).toEqual(["MU", "NBIS"]);
    // The host serves the same tape for both here; what matters is each is filed under its own id.
    const ids = new Set((records[1]?.playbookObservations ?? []).map((o) => o.playbookId));
    expect(ids).toEqual(new Set(["MU-DIP-BOUNCE", "NBIS-DIP-BOUNCE"]));
  });
});

describe("it records and never trades", () => {
  it("asks the broker for nothing, in live mode, with a signal on the tape", async () => {
    const { feed, submit, records, pass } = run([MU, NBIS]);
    await pass();
    await feed.refresh();
    await pass();
    expect(submit).not.toHaveBeenCalled();
    for (const record of records) {
      expect(record.rawIntents).toEqual([]);
      expect(record.guardedIntents).toEqual([]);
      expect(record.outcomes).toEqual([]);
    }
    expect(
      (records[1]?.playbookObservations ?? []).some(
        (o) => o.kind === "signal" && o.outcome === "buy",
      ),
    ).toBe(true);
  });

  it("changes nothing the bot does: its own decisions are the same with and without it", () => {
    const hot: Bot = {
      persona: {
        id: "quiet",
        name: "Quiet",
        thesis: "t",
        decide: (ctx) => [
          {
            symbol: "MU",
            side: "buy",
            quantity: 1,
            type: "market",
            reason: "own rule",
            ...(ctx ? {} : {}),
          },
        ],
      },
      credentials: bot.credentials,
    };
    const decide = (subs: readonly PlaybookSubscription[]) =>
      tradingRoster(resolveBotRoster(hot, [], subs), DEFAULT_RISK_CONFIG).persona.decide(market, {
        cash: 1_000_000,
        positions: [],
      });
    expect(decide([MU, NBIS])).toEqual(decide([]));
  });

  it("survives a reading that throws: the cycle runs and the record just has none", async () => {
    const warned: unknown[] = [];
    const broker = new InMemoryBroker(1_000_000, Object.values(market.quotes));
    const records: DecisionRecord[] = [];
    const trader = new AutonomousTrader({
      persona: {
        ...bot.persona,
        playbookObservations: () => {
          throw new Error("replay blew up");
        },
      },
      broker,
      mode: "live",
      onDecision: (r) => records.push(r),
      onObservationError: (id, error) => warned.push([id, (error as Error).message]),
    });
    await trader.evaluate(market);
    expect(records).toHaveLength(1);
    expect(records[0]?.playbookObservations).toBeUndefined();
    expect(warned).toEqual([["quiet", "replay blew up"]]);
  });
});

describe("the observed days are kept so thirty of them can be scored", () => {
  let dir: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "dip-bounce-wiring-"));
    db = openDecisionDb(join(dir, "decisions.db"));
  });
  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("lands in the decision store beside the verdicts, quote and all", async () => {
    const { feed, pass } = run([MU], { db });
    await pass();
    await feed.refresh();
    await pass();
    const kept = db.playbookObservations("MU-DIP-BOUNCE");
    expect(kept.map((o) => o.kind).sort()).toEqual(["day", "signal"]);
    expect(kept.find((o): o is SignalObservation => o.kind === "signal")?.quote?.last).toBe(97.5);
    expect(db.listByPersona("quiet")[0]?.playbookVerdicts?.[0]?.state).toBe("observing");
  });
});

describe("the wiring gap is closed", () => {
  it("no longer names the dip-to-bounce pairs, because the bars now reach the pass", () => {
    expect(PLAYBOOK_WIRING_GAPS["MU-DIP-BOUNCE"]).toBeUndefined();
    expect(PLAYBOOK_WIRING_GAPS["NBIS-DIP-BOUNCE"]).toBeUndefined();
  });
});
