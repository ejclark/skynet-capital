// The Pulse and equity-curve fixtures for the accounts shoot — the deterministic hero-chart curves
// (Eric's month and SPY's), the two Pulse payloads the net-worth card's standing line reads, and the
// SPY bars the benchmark overlay asks for (split out of `accounts.mjs`).
// Pure fixture data, no page access, no clock (every date is a fixed UTC day); `accounts-fixture.mjs`
// evaluates the accounts shoot's stubs as a `data:` module and hands it this file's absolute URL, so
// keep it self-contained.

// Hero chart (#3186 slice 2) — a month of Eric's equity curve ending near the "1M +3.4%" window
// pill above, and SPY's own daily closes over the same span for the benchmark overlay. Both are
// deterministic (no randomness) so the screenshot is reproducible.
function dailyPoints(days, endReturn, jitter) {
  return Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    const value = endReturn * t + Math.sin(i / 2) * jitter;
    const day = new Date(Date.UTC(2026, 7, 12 + i));
    return { day, value };
  });
}
const ericCurve = dailyPoints(23, 0.034, 0.004);
const spyCurve = dailyPoints(23, 0.018, 0.003);

export const ericEquityCurve = {
  range: "1M",
  points: ericCurve.map((p) => ({ t: p.day.toISOString(), value: p.value })),
};

// The Pulse payload the net-worth card's standing line reads (#3964). Only the three headline tiles
// matter to the card, but the shape is the server's whole `DeskPulseView` so the frame proves the
// selection, not a trimmed stub.
//
// The record counts `ericActivity`'s own seven closes, so the numbers agree with the Form strip
// squares directly above them in the same frame: 5W · 2L → 71.4%, and $3,105 won ÷ $765 lost →
// 4.06×. The drawdown is NOT derived — `equityDrawdown` measures the deepest dip from a running
// peak, and `ericCurve` (a 23-day rise with 0.4% noise) barely dips at all, so a figure taken from
// it would be too small to prove the row renders a real percentage. 0.32% is the gap to the same
// $1,051,200 all-time high the card's meter draws beside it, which is a different measure but not
// a contradictory one at this scale — a stand-in, not a claim about the curve.
//
export const ericPulse = {
  pulse: {
    curve: null,
    weeks: [],
    race: null,
    streaks: [],
    tiles: [
      {
        key: "equity",
        label: "Equity",
        value: "$1,047,832.14",
        note: "cash $847,200.00",
        known: true,
      },
      {
        key: "netRealized",
        label: "Net realized",
        value: "+$2,340.00",
        note: "booked, not on paper",
        known: true,
        tone: "pos",
      },
      { key: "winRate", label: "Win rate", value: "71.4%", note: "5W · 2L", known: true },
      {
        key: "profitFactor",
        label: "Profit factor",
        value: "4.06×",
        note: "wins ÷ losses; above 1× is paying",
        known: true,
      },
      {
        key: "maxDrawdown",
        label: "Max drawdown",
        value: "0.32%",
        note: "from peak $1,051,200.00",
        known: true,
        tone: "neg",
      },
    ],
  },
};

// Sauron's card reads "locked in —" because nothing has closed on it (`sauronStats.bookedKnown` is
// false, and `sauronNoTrades` is the decisions payload), so its Pulse must say the same: no record
// yet. This is the fixture that proves the other half of the row — with every headline fact
// unknown, the standing line renders NOTHING rather than three bare dashes a member would read as
// a record. Two accounts on one page, both frames honest.
export const sauronPulse = {
  pulse: {
    curve: null,
    weeks: [],
    race: null,
    streaks: [],
    tiles: [
      {
        key: "equity",
        label: "Equity",
        value: "$512,406.88",
        note: "cash $201,400.00",
        known: true,
      },
      {
        key: "netRealized",
        label: "Net realized",
        value: "+$0.00",
        note: "needs a closed trade",
        known: false,
      },
      {
        key: "winRate",
        label: "Win rate",
        value: "—",
        note: "needs a closed trade",
        known: false,
      },
      {
        key: "profitFactor",
        label: "Profit factor",
        value: "—",
        note: "nothing lost yet",
        known: false,
      },
      {
        key: "maxDrawdown",
        label: "Max drawdown",
        value: "—",
        note: "needs two equity samples",
        known: false,
      },
    ],
  },
};

export const spyBars = {
  symbol: "SPY",
  bars: spyCurve.map((p) => {
    const close = 560 * (1 + p.value);
    return { t: p.day.toISOString(), o: close, h: close, l: close, c: close, v: 0 };
  }),
};
