import { readFileSync } from "node:fs";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type {
  PlaybookObservation,
  SignalObservation,
} from "../../src/domain/playbook-observation.js";
import type { OrderIntent, Quote } from "../../src/domain/types.js";
import { DIP_BOUNCE_RULE } from "../../src/playbooks/dip-bounce.js";
import { completedBars, observeDipBounce } from "../../src/playbooks/dip-bounce-observation.js";
import { day, dipDay, etIso, session } from "../support/intraday-bars.js";

/**
 * THE DARK RUN'S RECORD (#5489): every dip signal the rule sees becomes a would-be buy with the
 * numbers it was priced from, a would-be exit that no recovery level gates, and a quote read when
 * the pass first saw it. Constructed tapes: a flat $100 session with a one-dollar range, one dip bar
 * at 11:10 ET (closes 11:15) that buys 10 shares at $97.50 and rests a sell at $98.50.
 */

const quote: Quote = { symbol: "MU", bid: 97.4, ask: 97.6, last: 97.5, asOf: "ignored" };
/** 11:15:30 ET — the dip bar (minutes 700) has just closed. */
const justClosed = etIso(day(1), 705);

const input = (bars: ReturnType<typeof session>, asOf: string, extra: { quote?: Quote } = {}) => ({
  playbookId: "MU-DIP-BOUNCE",
  symbol: "MU",
  bars,
  asOf,
  calendar: [] as readonly EarningsPrint[],
  ...extra,
});

const signals = (all: readonly PlaybookObservation[]): SignalObservation[] =>
  all.filter((o): o is SignalObservation => o.kind === "signal");

/** Bought on session 1 and then stuck: its highs never reach the $98.50 target. */
const stuck = (sessions: number) => [
  ...session(day(0), 100),
  ...dipDay(day(1)),
  ...Array.from({ length: sessions }, (_, i) => session(day(2 + i), 97.5)).flat(),
];

describe("only completed bars are read", () => {
  it("drops the bar still forming, and any bar of a later session", () => {
    const bars = [...session(day(0), 100), ...session(day(1), 100)];
    const kept = completedBars(bars, Date.parse(justClosed));
    expect(kept.filter((b) => b.date === day(0))).toHaveLength(78);
    // 9:30 through the 11:10 bar: (700 - 570) / 5 + 1 = 27 bars have closed by 11:15:30.
    expect(kept.filter((b) => b.date === day(1))).toHaveLength(27);
    expect(kept.at(-1)).toMatchObject({ date: day(1), minutes: 700 });
  });

  it("sorts oldest first whatever order it was handed", () => {
    const bars = [...session(day(1), 100), ...session(day(0), 100)].reverse();
    const kept = completedBars(bars, Date.parse(etIso(day(2), 560)));
    expect(kept[0]).toMatchObject({ date: day(0), minutes: 570 });
    expect(kept.at(-1)).toMatchObject({ date: day(1), minutes: 955 });
  });

  it("answers nothing for an unreadable clock or before any bar closed", () => {
    expect(completedBars(session(day(1), 100), Number.NaN)).toEqual([]);
    expect(observeDipBounce(input(session(day(1), 100), etIso(day(1), 572)))).toEqual([]);
  });
});

describe("a signal records the would-be buy, its pricing and its quote", () => {
  const read = observeDipBounce(
    input([...session(day(0), 100), ...dipDay(day(1))], justClosed, { quote }),
  );
  const [signal] = signals(read);

  it("names the bar, the session VWAP and the range unit at the signal", () => {
    expect(signals(read)).toHaveLength(1);
    expect(signal).toMatchObject({
      kind: "signal",
      playbookId: "MU-DIP-BOUNCE",
      symbol: "MU",
      session: day(1),
      minutes: 700,
      outcome: "buy",
    });
    // The dip bar trades one share, so VWAP stays at the flat tape's $100; the range is $1.
    expect(signal?.vwap).toBeCloseTo(100, 1);
    expect(signal?.range).toBeCloseTo(1, 6);
  });

  it("is a market buy at the bar's close, sized to a $1,000 tranche", () => {
    expect(signal?.entry).toMatchObject({ side: "buy", kind: "market", price: 97.5, shares: 10 });
    expect(signal?.entry.why).toContain("2 ranges");
  });

  it("carries the would-be exit: a resting sell one range up, with no level gating it", () => {
    expect(signal?.exit).toMatchObject({ side: "sell", kind: "resting", price: 98.5, shares: 10 });
    expect(signal?.exit?.why).toContain("no level ever gates it");
    expect(signal?.sold).toBeUndefined();
  });

  it("records the quote the pass read, with when it read it", () => {
    expect(signal?.quote).toEqual({
      bid: 97.4,
      ask: 97.6,
      last: 97.5,
      seenAt: Date.parse(justClosed),
    });
  });

  it("attaches no quote to a signal found on an older bar — it would not be the spread then", () => {
    const later = observeDipBounce(
      input([...session(day(0), 100), ...dipDay(day(1))], etIso(day(1), 725), { quote }),
    );
    expect(signals(later)[0]?.quote).toBeUndefined();
  });

  it("records no quote when the pass had none, and still records the signal", () => {
    const bare = observeDipBounce(input([...session(day(0), 100), ...dipDay(day(1))], justClosed));
    expect(signals(bare)).toHaveLength(1);
    expect(signals(bare)[0]?.quote).toBeUndefined();
  });

  it("says the same thing about the same tape: a pass can say it again", () => {
    const again = observeDipBounce(
      input([...session(day(0), 100), ...dipDay(day(1))], justClosed, { quote }),
    );
    expect(again).toEqual(read);
  });

  it("is quiet on a flat tape, with only the day's reading", () => {
    const flat = observeDipBounce(
      input([...session(day(0), 100), ...session(day(1), 100)], justClosed),
    );
    expect(signals(flat)).toEqual([]);
    expect(flat).toHaveLength(1);
    expect(flat[0]).toMatchObject({ kind: "day", level: "none", held: 0 });
  });
});

describe("the would-be exit follows the late-recovery rule", () => {
  /** The asOf just after session `n`'s last bar (15:55) has closed. */
  const close = (n: number) => etIso(day(n), 960);

  it("holds overnight with no level before day 3", () => {
    const [signal] = signals(observeDipBounce(input(stuck(2), close(3))));
    expect(signal).toMatchObject({ level: "none", worstLevel: "none", age: 2 });
    expect(signal?.exit?.why).toContain("signal at 3 sessions or 30% tied up");
    expect(signal?.exit?.why).toContain("gate at 5 sessions, 50% tied up or 8% down in a week");
  });

  it("signals at day 3: no new buys in the name, the sell stays working", () => {
    const read = observeDipBounce(input(stuck(3), close(4)));
    const [signal] = signals(read);
    expect(signal).toMatchObject({ level: "signal", age: 3 });
    expect(signal?.exit).toMatchObject({ side: "sell", kind: "resting", price: 98.5 });
    expect(signal?.exit?.why).toContain("no new buys in the name, this sell stays working");
    expect(read.find((o) => o.kind === "day")).toMatchObject({ level: "signal" });
  });

  it("gates at day 5 and keeps the target sell working — no hand-off, no sale", () => {
    const read = observeDipBounce(input(stuck(5), close(6)));
    const [signal] = signals(read);
    expect(signal).toMatchObject({ level: "gate", age: 5 });
    expect(signal?.sold).toBeUndefined();
    expect(signal?.exit).toMatchObject({ side: "sell", kind: "resting", price: 98.5, shares: 10 });
    expect(signal?.exit?.why).toContain("this sell keeps working");
    const dayReading = read.find((o) => o.kind === "day");
    expect(dayReading).toMatchObject({ kind: "day", level: "gate", held: 1 });
    expect(dayReading?.kind === "day" && dayReading.reasons[0]).toContain(
      "its target sell keeps working",
    );
  });

  it("records the sale when the bounce comes late, with the level it had reached", () => {
    const read = observeDipBounce(input([...stuck(7), ...session(day(9), 99)], close(9)));
    const [signal] = signals(read);
    expect(signal).toMatchObject({ level: "gate", worstLevel: "gate", age: 8 });
    expect(signal?.sold).toEqual({ session: day(9), minutes: 570, price: 99 });
  });

  it("records the 30%-tied-up signal and the 50% gate on the day's reading, per playbook", () => {
    // A book of two slots: one carried tranche is 50% of the allocation.
    const small = { ...DIP_BOUNCE_RULE, slots: 2 };
    const bars = [
      ...session(day(0), 100),
      ...dipDay(day(1)),
      ...session(day(2), 97.5, { 700: { close: 95, volume: 1 } }),
    ];
    const read = observeDipBounce(input(bars, close(2)), small);
    const dayReading = read.find((o) => o.kind === "day");
    expect(dayReading).toMatchObject({ kind: "day", level: "gate", tiedUp: 0.5, refused: 1 });
    const refused = signals(read).find((o) => o.outcome === "refused");
    expect(refused).toMatchObject({
      session: day(2),
      minutes: 700,
      refusedWhy: "gate: 50% of the allocation tied up",
      level: "gate",
    });
    // A refused signal is a buy that was NOT made: it has no exit to rest.
    expect(refused?.exit).toBeUndefined();
    expect(refused?.entry).toMatchObject({ side: "buy", price: 95 });
  });

  it("records a signal the 8%-in-a-week stop refused", () => {
    const book = { ...DIP_BOUNCE_RULE, slots: 15 };
    const bars = [
      ...session(day(0), 100),
      ...dipDay(day(1), {
        705: { close: 95.4, volume: 1 },
        ...Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [710 + 5 * i, { close: 93.3, volume: 1 }]),
        ),
      }),
      ...[2, 3, 4, 5].flatMap((n) => session(day(n), 50)),
      ...session(day(6), 50, { 700: { close: 45, volume: 1 } }),
    ];
    const read = observeDipBounce(input(bars, close(6)), book);
    expect(
      signals(read)
        .filter((o) => o.outcome === "refused")
        .at(-1)?.refusedWhy,
    ).toContain("down 8%");
    expect(read.find((o) => o.kind === "day")).toMatchObject({ level: "gate" });
  });
});

describe("what it will not record", () => {
  it("makes no signal on a print day or a session either side of it", () => {
    const calendar: readonly EarningsPrint[] = [
      { symbol: "MU", date: day(1), status: "confirmed", source: "test" },
    ];
    const read = observeDipBounce({
      ...input([...session(day(0), 100), ...dipDay(day(1))], justClosed),
      calendar,
    });
    expect(signals(read)).toEqual([]);
  });

  it("skips a signal whose tranche buys no whole share, keeping the day's reading", () => {
    const tiny = { ...DIP_BOUNCE_RULE, tranche: 50 };
    const read = observeDipBounce(
      input([...session(day(0), 100), ...dipDay(day(1))], justClosed),
      tiny,
    );
    expect(signals(read)).toEqual([]);
    expect(read.find((o) => o.kind === "day")).toBeDefined();
  });
});

describe("a would-be order is not an order", () => {
  it("has no shape the trader could submit", () => {
    const [signal] = signals(
      observeDipBounce(input([...session(day(0), 100), ...dipDay(day(1))], justClosed)),
    );
    // @ts-expect-error — a WouldBeOrder is not an OrderIntent: no `quantity`, no `type`, no `reason`.
    const asIntent: OrderIntent = signal?.entry;
    expect(asIntent && "quantity" in asIntent).toBe(false);
    expect(asIntent && "type" in asIntent).toBe(false);
    expect(asIntent && "playbookId" in asIntent).toBe(false);
  });
});

describe("no path from the bars to a broker", () => {
  const files = [
    "src/domain/intraday-bar.ts",
    "src/domain/playbook-observation.ts",
    "src/domain/et-wall.ts",
    "src/playbooks/dip-bounce.ts",
    "src/playbooks/dip-bounce-observation.ts",
    "src/playbooks/dip-bounce-play.ts",
    "src/playbooks/observation-delta.ts",
    "src/playbooks/intraday-bars-feed.ts",
    "src/alpaca/alpaca-intraday-bars.ts",
  ];
  const imports = (path: string): { specifier: string; typeOnly: boolean }[] =>
    [
      ...readFileSync(path, "utf8").matchAll(
        /^(import|export)(\s+type)?\s[^;]*?from\s+"([^"]+)"/gm,
      ),
    ].map((m) => ({ specifier: m[3] ?? "", typeOnly: m[2] !== undefined }));
  /** Where a bar-reading module may import from: pure domain types, its own siblings, and — as
   *  TYPES only — the playbook shape and the read-only transport. Never an adapter, the engine, a
   *  bot, a port or the autonomous loop: the only places an order is built, guarded or sent. */
  const allowed = [
    /^\.\.\/domain\//,
    /^\.\/(dip-bounce|dip-bounce-observation|dip-bounce-play|observation-delta)\.js$/,
    /^\.\/(intl-format|market-day)\.js$/,
  ];
  const typesOnly = /^\.\/(playbook|trading-transport)\.js$/;

  it.each(files)("%s imports only domain types and its own siblings", (path) => {
    for (const { specifier, typeOnly } of imports(path)) {
      const fine =
        allowed.some((pattern) => pattern.test(specifier)) ||
        (typesOnly.test(specifier) && typeOnly);
      expect(fine, `${path} imports ${specifier}`).toBe(true);
    }
  });

  it.each(files)("%s never names an order, a broker or a submit", (path) => {
    const code = readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
      .join("\n");
    expect(code).not.toMatch(/OrderIntent|BrokerPort|\.submit\(|placeOrder|\.post\(/);
  });
});
