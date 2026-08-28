import type { Alert } from "../../src/alerts/alert.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import type { MarketContext } from "../../src/domain/types.js";
import {
  FLATTEN_DRAWDOWN_PCT,
  RESTRICT_DRAWDOWN_PCT,
  WATCH_DRAWDOWN_PCT,
} from "../../src/risk/risk-ladder.js";

const ctx = (quotes: MarketContext["quotes"]): MarketContext => ({
  asOf: "2026-07-24T14:00:00Z",
  quotes,
  momentum: {},
});

describe("SafetyController", () => {
  it("starts un-halted and the manual kill switch stops it (until reset)", () => {
    const s = new SafetyController();
    expect(s.blockedReason()).toBeNull();
    s.halt();
    expect(s.blockedReason()).toBe("manual");
    s.reset();
    expect(s.blockedReason()).toBeNull();
  });

  it("first reason wins — a later trip does not overwrite the kill switch", () => {
    const s = new SafetyController();
    s.halt("manual");
    s.recordError();
    s.recordError();
    s.recordError();
    s.recordError();
    s.recordError();
    expect(s.blockedReason()).toBe("manual");
  });

  it("trips the daily-loss breaker when equity falls past the cap", () => {
    const s = new SafetyController({ maxDailyLossPct: 0.05 });
    s.recordEquity(1_000_000); // baseline
    s.recordEquity(970_000); // -3% — fine
    expect(s.blockedReason()).toBeNull();
    s.recordEquity(940_000); // -6% — trip
    expect(s.blockedReason()).toBe("daily-loss");
  });

  it("trips the order-rate breaker when too many orders land in the window", () => {
    let t = 0;
    const s = new SafetyController({ maxOrdersPerWindow: 3, orderWindowMs: 1000 }, () => t);
    for (let i = 0; i < 3; i++) {
      t += 100;
      s.recordOrder();
    }
    expect(s.blockedReason()).toBeNull();
    t += 100;
    s.recordOrder(); // 4th within 1s — trip
    expect(s.blockedReason()).toBe("order-rate");
  });

  it("trips the error breaker on consecutive failures and success resets the count", () => {
    const s = new SafetyController({ maxConsecutiveErrors: 3 });
    s.recordError();
    s.recordError();
    s.recordSuccess(); // resets
    s.recordError();
    s.recordError();
    expect(s.blockedReason()).toBeNull();
    s.recordError(); // 3rd in a row — trip
    expect(s.blockedReason()).toBe("errors");
  });

  it("trips the data-gap breaker on empty or unusable quotes", () => {
    const empty = new SafetyController();
    empty.checkContext(ctx({}));
    expect(empty.blockedReason()).toBe("data-gap");

    const nan = new SafetyController();
    nan.checkContext(
      ctx({ NVDA: { symbol: "NVDA", bid: 0, ask: 0, last: Number.NaN, asOf: "t" } }),
    );
    expect(nan.blockedReason()).toBe("data-gap");

    const ok = new SafetyController();
    ok.checkContext(ctx({ NVDA: { symbol: "NVDA", bid: 100, ask: 100, last: 100, asOf: "t" } }));
    expect(ok.blockedReason()).toBeNull();
  });

  describe("seedBaseline — the day-open-equity fix", () => {
    it("sets the baseline before any recordEquity call, same as a first recordEquity would", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000);
      s.recordEquity(940_000); // -6% off the SEEDED baseline, not a fresh one
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("is the whole point: a restart mid-drawdown must not forgive it", () => {
      // The exact bug this exists to close: equity has already fallen 6% today, then the process
      // restarts (a new SafetyController). Without seeding, the next recordEquity call would set
      // a FRESH baseline at the already-dropped level and the breaker would read 0% off it.
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000); // the real day-open number, from Alpaca — survives the restart
      s.recordEquity(940_000); // the equity the freshly-booted process actually observes first
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("never overwrites an existing baseline — first number in wins, from either source", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.recordEquity(1_000_000); // recordEquity got there first
      s.seedBaseline(2_000_000); // must not silently re-anchor
      s.recordEquity(940_000); // -6% off the ORIGINAL 1,000,000 baseline
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("ignores a non-finite seed rather than poisoning the baseline", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(Number.NaN);
      s.recordEquity(1_000_000); // still open to a real first reading
      expect(s.riskReading()?.tier).toBe("clear");
      s.recordEquity(940_000); // -6% off the real 1,000,000 baseline
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("is a no-op after reset clears the baseline, until seeded again", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000);
      s.recordEquity(940_000);
      expect(s.blockedReason()).toBe("daily-loss");
      s.reset();
      expect(s.blockedReason()).toBeNull();
      s.recordEquity(940_000); // no seed this time — 940,000 becomes the fresh baseline
      expect(s.blockedReason()).toBeNull();
    });
  });
});

/**
 * The graduated ladder, read off the SAME equity feed as the daily-loss breaker. Baseline is
 * $100k and every equity below is a whole dollar, so each drawdown is bit-exact against its
 * threshold — a boundary spec that needed a tolerance would not be specifying the boundary.
 */
describe("SafetyController — the graduated risk ladder", () => {
  const BASELINE = 100_000;
  const at = (drawdownPct: number): number => BASELINE - Math.round(BASELINE * drawdownPct);
  const EPSILON = 0.0001;

  /** A controller with its day-opening baseline already fed. */
  const opened = (
    config: ConstructorParameters<typeof SafetyController>[0] = {},
  ): SafetyController => {
    const s = new SafetyController(config, () => 1_700_000_000_000);
    s.recordEquity(BASELINE);
    return s;
  };

  describe("the rung boundaries, on the live feed", () => {
    const tierAfter = (drawdownPct: number): string | undefined => {
      const s = opened();
      s.recordEquity(at(drawdownPct));
      return s.riskReading()?.tier;
    };

    it("is clear just under warn, and warns exactly ON it", () => {
      expect(tierAfter(WATCH_DRAWDOWN_PCT - EPSILON)).toBe("clear");
      expect(tierAfter(WATCH_DRAWDOWN_PCT)).toBe("watch");
    });

    it("is watch just under block, and restricted exactly ON it", () => {
      expect(tierAfter(RESTRICT_DRAWDOWN_PCT - EPSILON)).toBe("watch");
      expect(tierAfter(RESTRICT_DRAWDOWN_PCT)).toBe("restricted");
    });

    it("is restricted just under flatten, and liquidate exactly ON it", () => {
      expect(tierAfter(FLATTEN_DRAWDOWN_PCT - EPSILON)).toBe("restricted");
      expect(tierAfter(FLATTEN_DRAWDOWN_PCT)).toBe("liquidate");
    });
  });

  describe("what the reading is before there is one", () => {
    it("reads ABSENT before any equity is fed — not a cheerful 'clear'", () => {
      expect(new SafetyController().riskReading()).toBeNull();
    });

    it("reads clear on the baseline tick, which is flat by definition", () => {
      expect(opened().riskReading()?.tier).toBe("clear");
    });

    it("forgets the reading on reset, along with the baseline", () => {
      const s = opened();
      s.recordEquity(at(0.09));
      expect(s.riskReading()?.tier).toBe("liquidate");
      s.reset();
      expect(s.riskReading()).toBeNull();
    });
  });

  describe("force-flatten is for autonomous bots only", () => {
    it("is required for a bot at the bottom rung", () => {
      const s = opened({ actor: "bot" });
      s.recordEquity(at(FLATTEN_DRAWDOWN_PCT));
      expect(s.flattenRequired()).toBe(true);
    });

    it("is NEVER required for a member at the same rung — their positions are theirs to close", () => {
      const s = opened({ actor: "member" });
      s.recordEquity(at(FLATTEN_DRAWDOWN_PCT));
      expect(s.riskReading()?.tier).toBe("liquidate");
      expect(s.flattenRequired()).toBe(false);
    });

    it("defaults to member — the permissive answer has to be asked for by name", () => {
      const s = opened();
      s.recordEquity(at(0.5));
      expect(s.flattenRequired()).toBe(false);
    });

    it("is not required for a bot above the bottom rung", () => {
      const s = opened({ actor: "bot" });
      s.recordEquity(at(FLATTEN_DRAWDOWN_PCT - EPSILON));
      expect(s.flattenRequired()).toBe(false);
    });

    it("is not required before any equity has been fed", () => {
      expect(new SafetyController({ actor: "bot" }).flattenRequired()).toBe(false);
    });
  });

  describe("the warning is visible, and non-blocking", () => {
    const collect = (config: Parameters<typeof opened>[0] = {}) => {
      const alerts: Alert[] = [];
      const s = opened({ ...config, onRiskAlert: (alert) => alerts.push(alert) });
      return { s, alerts };
    };

    it("announces the soft rung as a warning rather than silently allowing or refusing", () => {
      const { s, alerts } = collect();
      s.recordEquity(at(0.04));
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.priority).toBe("warning");
      expect(s.blockedReason()).toBeNull(); // …and it blocked nothing
    });

    it("says nothing at all while the account is clear", () => {
      const { s, alerts } = collect();
      s.recordEquity(at(0.01));
      expect(alerts).toEqual([]);
    });

    it("speaks once per rung CHANGE, not once per equity tick", () => {
      const { s, alerts } = collect();
      s.recordEquity(at(0.035));
      s.recordEquity(at(0.04));
      s.recordEquity(at(0.045));
      expect(alerts).toHaveLength(1);
    });

    it("escalates as the account walks down the ladder", () => {
      const { s, alerts } = collect();
      s.recordEquity(at(0.04));
      s.recordEquity(at(0.06));
      s.recordEquity(at(0.09));
      expect(alerts.map((a) => a.data?.tier)).toEqual(["watch", "restricted", "liquidate"]);
    });

    it("announces the recovery too — a lifted block is news the desk needs", () => {
      const { s, alerts } = collect();
      s.recordEquity(at(0.06));
      s.recordEquity(at(0.01));
      expect(alerts.map((a) => a.data?.tier)).toEqual(["restricted", "clear"]);
    });

    it("banks the halt BEFORE the listener runs — a throwing consumer cannot skip a breaker", () => {
      // The listener is foreign code. If it ran first and threw, it would abort recordEquity
      // before the daily-loss halt landed: an unrelated broken consumer silently disabling a
      // money-moving safety control. Ordering, not try/catch, is what makes that impossible.
      const s = opened({
        maxDailyLossPct: 0.05,
        onRiskAlert: () => {
          throw new Error("a broken consumer");
        },
      });

      expect(() => s.recordEquity(at(0.06))).toThrow("a broken consumer");
      expect(s.blockedReason()).toBe("daily-loss");
      expect(s.riskReading()?.tier).toBe("restricted");
    });

    it("still reads and enforces the ladder with no listener attached", () => {
      const s = opened({ actor: "bot" });
      s.recordEquity(at(0.09));
      expect(s.flattenRequired()).toBe(true);
    });
  });

  describe("the binary breaker it generalises", () => {
    it("still halts on the daily-loss cap, unchanged, while the ladder reads alongside it", () => {
      const s = opened({ maxDailyLossPct: 0.05 });
      s.recordEquity(at(0.06));
      expect(s.blockedReason()).toBe("daily-loss");
      expect(s.riskReading()?.tier).toBe("restricted");
    });

    it("halts without flattening — which is exactly the gap the bottom rung exists for", () => {
      // The halt stops ORDERING. Open positions keep marking against you, so equity can walk on
      // past the halt to the flatten rung; only then does a bot's book get closed.
      const s = opened({ actor: "bot" });
      s.recordEquity(at(0.06));
      expect(s.blockedReason()).toBe("daily-loss");
      expect(s.flattenRequired()).toBe(false);
      s.recordEquity(at(0.09));
      expect(s.flattenRequired()).toBe(true);
    });

    it("ignores a non-finite mark on the ladder as well as on the breaker", () => {
      const s = opened();
      s.recordEquity(at(0.04));
      s.recordEquity(Number.NaN);
      expect(s.riskReading()?.tier).toBe("watch"); // the last good reading stands
    });
  });

  describe("seedBaseline — the day-open-equity fix", () => {
    it("sets the baseline before any recordEquity call, same as a first recordEquity would", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000);
      s.recordEquity(940_000); // -6% off the SEEDED baseline, not a fresh one
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("is the whole point: a restart mid-drawdown must not forgive it", () => {
      // The exact bug this exists to close: equity has already fallen 6% today, then the process
      // restarts (a new SafetyController). Without seeding, the next recordEquity call would set
      // a FRESH baseline at the already-dropped level and the breaker would read 0% off it.
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000); // the real day-open number, from Alpaca — survives the restart
      s.recordEquity(940_000); // the equity the freshly-booted process actually observes first
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("never overwrites an existing baseline — first number in wins, from either source", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.recordEquity(1_000_000); // recordEquity got there first
      s.seedBaseline(2_000_000); // must not silently re-anchor
      s.recordEquity(940_000); // -6% off the ORIGINAL 1,000,000 baseline
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("ignores a non-finite seed rather than poisoning the baseline", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(Number.NaN);
      s.recordEquity(1_000_000); // still open to a real first reading
      expect(s.riskReading()?.tier).toBe("clear");
      s.recordEquity(940_000); // -6% off the real 1,000,000 baseline
      expect(s.blockedReason()).toBe("daily-loss");
    });

    it("is a no-op after reset clears the baseline, until seeded again", () => {
      const s = new SafetyController({ maxDailyLossPct: 0.05 });
      s.seedBaseline(1_000_000);
      s.recordEquity(940_000);
      expect(s.blockedReason()).toBe("daily-loss");
      s.reset();
      expect(s.blockedReason()).toBeNull();
      s.recordEquity(940_000); // no seed this time — 940,000 becomes the fresh baseline
      expect(s.blockedReason()).toBeNull();
    });
  });
});
