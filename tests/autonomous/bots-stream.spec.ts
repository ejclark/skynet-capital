import {
  followBotsStream,
  heldShareSymbols,
  type StreamRoster,
  streamedSymbols,
} from "../../src/autonomous/bots-stream.js";
import { MomentumTracker } from "../../src/autonomous/momentum-tracker.js";
import { BOTS_UNIVERSE } from "../../src/domain/bots-universe.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, HC_SAURON, registeredPlaybooks } from "../../src/playbooks/registry.js";
import { aPortfolio } from "../support/builders.js";

const roster = (id: string, ...playbooks: EnabledPlaybook["playbook"][]): StreamRoster => ({
  bot: { persona: { id } },
  enabled: playbooks.map((playbook) => ({ playbook, mode: "standard" })),
});
const holding = (...symbols: string[]): Portfolio =>
  aPortfolio({ positions: symbols.map((symbol) => ({ symbol, quantity: 10, avgPrice: 100 })) });

/** A stream + tracker pair wired the way `run-autonomous.ts` wires them, with the socket faked. */
function harness(rosters: StreamRoster[]) {
  const subscribed: (readonly string[])[] = [];
  const logs: string[] = [];
  const tracker = new MomentumTracker();
  const stream = followBotsStream({
    stream: { resubscribe: (symbols) => subscribed.push(symbols) },
    tracker,
    universe: BOTS_UNIVERSE,
    rosters: () => rosters,
    log: (line) => logs.push(line),
  });
  return { stream, tracker, subscribed, logs, rosters };
}

describe("streamedSymbols (#4777)", () => {
  it("is exactly the ten names when no bot runs a playbook", () => {
    expect(streamedSymbols(BOTS_UNIVERSE, [roster("a")], [])).toEqual([...BOTS_UNIVERSE]);
  });

  it("adds an enabled playbook's ticker and a held ticker, never repeating one of the ten", () => {
    expect(
      streamedSymbols(
        BOTS_UNIVERSE,
        [roster("a", G1_GOOG), roster("b", HC_SAURON)],
        ["ZS", "NVDA"],
      ),
    ).toEqual([...BOTS_UNIVERSE, "GOOG", "ZS"]);
  });

  it("IF an enabled playbook trades a ticker, THEN the stream carries it — for every registered playbook", () => {
    for (const playbook of registeredPlaybooks()) {
      const carried = streamedSymbols(BOTS_UNIVERSE, [roster("a", playbook)], []);
      for (const symbol of playbook.symbols) expect(carried).toContain(symbol);
    }
  });

  it("never streams a ticker nobody enabled — not the registry's whole list", () => {
    expect(streamedSymbols(BOTS_UNIVERSE, [roster("a", G1_GOOG)], [])).not.toContain("DJT");
  });

  it("reads share holdings only — an option contract is never a stock-stream symbol", () => {
    expect(heldShareSymbols(holding("GOOG", "NVDA261120C00150000"))).toEqual(["GOOG"]);
  });
});

describe("followBotsStream (#4777)", () => {
  it("a G1-GOOG subscription added after boot gets GOOG quotes from the next swap, without a restart", () => {
    const h = harness([roster("sauron")]);
    h.stream.refresh(); // boot
    expect(h.subscribed.at(-1)).toEqual([...BOTS_UNIVERSE]);

    h.tracker.record("GOOG", 170); // before the swap, a stray tick is not tracked
    h.rosters[0] = roster("sauron", G1_GOOG); // the Store swap
    h.stream.refresh();
    h.tracker.record("GOOG", 171);

    expect(h.subscribed.at(-1)).toEqual([...BOTS_UNIVERSE, "GOOG"]);
    expect(h.tracker.context("2026-10-06T15:00:00Z").quotes.GOOG?.last).toBe(171);
    expect(h.logs.at(-1)).toContain("(+GOOG) — no restart");
  });

  it("resubscribes only when the set actually changes", () => {
    const h = harness([roster("sauron", G1_GOOG)]);
    h.stream.refresh();
    h.stream.refresh();
    h.stream.observeHoldings([holding("NVDA")]);
    expect(h.subscribed).toHaveLength(1);
  });

  it("WHEN G1-GOOG is unsubscribed while its bot holds GOOG, the lot keeps a live price and is named unmanaged", () => {
    const h = harness([roster("sauron", G1_GOOG)]);
    h.stream.observeHoldings([holding("GOOG")]);
    h.rosters[0] = roster("sauron");
    h.stream.refresh();
    h.stream.observeHoldings([holding("GOOG")]);
    h.tracker.record("GOOG", 180);

    expect(h.stream.symbols()).toContain("GOOG");
    expect(h.tracker.context("2026-10-06T15:00:00Z").quotes.GOOG?.last).toBe(180);
    expect(h.logs.filter((l) => l.includes("UNMANAGED"))).toEqual([
      expect.stringContaining("sauron holds GOOG"),
    ]);
  });

  it("WHEN a ticker leaves the stream, its frozen price leaves the cycle's quotes and late ticks are ignored", () => {
    const h = harness([roster("sauron", G1_GOOG)]);
    h.stream.refresh();
    h.tracker.record("GOOG", 170);
    h.rosters[0] = roster("sauron"); // unsubscribed, nothing held
    h.stream.observeHoldings([holding()]);
    h.tracker.record("GOOG", 175); // a tick already in flight

    expect(h.subscribed.at(-1)).toEqual([...BOTS_UNIVERSE]);
    expect(h.tracker.context("2026-10-06T15:00:00Z").quotes.GOOG).toBeUndefined();
  });

  it("at boot, drops a restored window for a ticker the stream no longer carries", () => {
    const h = harness([roster("sauron")]);
    h.tracker.restore({ GOOG: [170, 171], NVDA: [100, 101] });
    h.stream.refresh();
    const quotes = h.tracker.context("2026-10-06T15:00:00Z").quotes;
    expect(Object.keys(quotes)).toEqual(["NVDA"]);
  });
});
