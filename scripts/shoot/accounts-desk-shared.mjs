// Shared pieces of the accounts shoot's desk snapshots: the `pos()` row builder and Eric's decisions
// rail, which Sauron's desk reuses (split out of `accounts.mjs`).
// Pure fixture data, no page access; `accounts-fixture.mjs` evaluates the accounts shoot's stubs as a
// `data:` module and hands it these files' absolute URLs, so keep each one self-contained.

// Desk snapshots — the Positions section's blotter. Real tickers, honest P/L tones.
export const pos = (
  symbol,
  display,
  detail,
  isOption,
  quantity,
  costPerShare,
  price,
  costBasis,
  value,
  dayPl,
  dayPct,
  dayTone,
  totalPl,
  totalPlRaw,
  returnPct,
  totalTone,
  weightPct,
  lots,
) => ({
  symbol,
  display,
  detail,
  isOption,
  quantity,
  costPerShare,
  price,
  costBasis,
  value,
  dayPl,
  dayPct,
  dayTone,
  totalPl,
  totalPlRaw,
  returnPct,
  totalTone,
  weightPct,
  ...(lots ? { lots } : {}),
});

// Considerations rail (#3186 slice 3) — one at-risk chip (a losing options lot) and one
// opportunity chip (a house play matching a held symbol), so the screenshot proves both kinds.
// Needs a decision (#3689 slice 7), as decisions-view.ts writes them: most money at stake first.
export const ericDecisions = [
  {
    id: "at-risk-NVDA260918C00180000",
    kind: "at-risk",
    symbol: "NVDA260918C00180000",
    display: "NVDA Sep 18 180 Call",
    plainName: "Call option · profits if NVDA rises",
    pl: "-$310 · −12.2%",
    plTone: "neg",
    // the IV-crush card: a long call holding through its own print (#3689 follow-up)
    title: "Earnings on Aug 26 could shrink this call even if NVDA rises",
    captionShort: "Needs NVDA above $185.10 by Sep 18 to profit.",
    caption:
      "NVDA Sep 18 180 Call has lost $310 of the $2,540 it cost. Worst case from here: −$2,540.",
    why: "✦ options cost more before earnings. the day after, that extra drains away (iv crush), so a right call can still lose. decide before the print, not after.",
    clocks: ["Expires in 25 days", "Earnings Aug 26", "3 contracts · worth $2,226"],
    learn: { term: "ivCrush", label: "What is IV crush?" },
    primary: {
      label: "Review on Trade ↗",
      href: "/app/trade?desk=human-eric&symbol=NVDA&section=orders&manage=NVDA260918C00180000",
    },
    secondary: { label: "Show in table", href: "#pos-NVDA260918C00180000" },
    stakeRaw: 2226,
    range: { type: "call", side: "long", strike: 180, breakeven: 185.1 },
  },
  {
    id: "lock-in-AAPL",
    kind: "lock-in",
    symbol: "AAPL",
    display: "AAPL",
    plainName: "Shares · profits if AAPL rises",
    pl: "+$10,520 · +26.5%",
    plTone: "pos",
    title: "Up 27%: consider locking some of it in",
    captionShort: "Bought at $198.50; now $251.10.",
    // #3977 slice 4: the stock's own print, a cadence estimate in `earnings-calendar.ts`, so the
    // Events section's ▲ day says "estimated date" in words.
    due: { at: "2026-10-29", reason: "event", label: "Earnings Oct 29", estimated: true },
    caption: "AAPL has made $10,520 on $39,700. Closing some of it now locks that part in.",
    why: "✦ winners can give it back. closing part turns what's on paper into what's locked in, and the rest keeps running.",
    clocks: ["200 shares · worth $50,220"],
    primary: { label: "Review on Trade ↗", href: "/app/trade?desk=human-eric&symbol=AAPL" },
    secondary: { label: "Show in table", href: "#pos-AAPL" },
    stakeRaw: 50220,
  },
];
