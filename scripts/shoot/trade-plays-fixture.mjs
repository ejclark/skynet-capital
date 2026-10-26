// The ladder-play and settings answers `trade.mjs` stubs for /app/trade: the play rail at day one,
// after one fill, and through the long rungs, plus the one- and two-account settings. Split out of
// `trade.mjs` (scripts/arch-scan.mjs's code-line cap), moved verbatim — pure data.

export const play = (code, name, tldr, kind, side, optionType, state, opensAfter) => ({
  code,
  id: code,
  name,
  tldr,
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: state === "locked",
  earned: state === "earned",
  ...(opensAfter ? { opensAfter } : {}),
});

// Day one: nothing filled. 102 is LOCKED here — an exit is exempt from the feedback wall, never
// from the per-rung ladder lock (`unlockedCodes`) — which is the fact the 2026-09-06 fix restores.
export const freshPlays = {
  linked: true,
  wheels: true,
  nextUp: "101",
  plays: [
    play("101", "Buy stock", "own the shares", "stock", "buy", undefined, "open"),
    play("102", "Sell stock", "take profit or cut a loss", "stock", "sell", undefined, "locked", {
      code: "101",
      name: "Buy stock",
    }),
    play(
      "201",
      "Sell a cash-secured put",
      "get paid to buy stock at a discount",
      "option",
      "sell",
      "put",
      "locked",
      { code: "102", name: "Sell stock" },
    ),
    play(
      "202",
      "Sell a covered call",
      "get paid to cap your upside",
      "option",
      "sell",
      "call",
      "locked",
      { code: "201", name: "Sell a cash-secured put" },
    ),
    play("301", "Buy a long put", "profit when a stock falls", "option", "buy", "put", "locked", {
      code: "202",
      name: "Sell a covered call",
    }),
    play("302", "Buy a long call", "profit when a stock rises", "option", "buy", "call", "locked", {
      code: "301",
      name: "Buy a long put",
    }),
    // The ladder extension (#1671): 401 and 501 name their own predecessor exactly like every
    // other rung — the eight-node rail this fixture now proves at phone width.
    play(
      "401",
      "Vertical spread",
      "defined risk, two legs",
      "multi-leg",
      undefined,
      undefined,
      "locked",
      {
        code: "302",
        name: "Buy a long call",
      },
    ),
    play("501", "Zero-DTE", "the fastest clock", "option", undefined, undefined, "locked", {
      code: "401",
      name: "Vertical spread",
    }),
  ],
};

// One fill in: 101 earned, 102 the next-up frontier and correctly open.
export const plays = {
  ...freshPlays,
  nextUp: "102",
  plays: freshPlays.plays.map((p) =>
    p.code === "101"
      ? { ...p, locked: false, earned: true }
      : p.code === "102"
        ? { ...p, locked: false, opensAfter: undefined }
        : p,
  ),
};

// Every rung through 302 earned: 401 OPENS for practice (its predecessor is earned) even though
// nothing can execute yet — the rung nobody can fill still stays locked (#1671's own doctrine),
// but the rung itself is open, exactly like any other. 501 stays shut behind it.
export const throughLongs = {
  ...freshPlays,
  nextUp: "401",
  plays: freshPlays.plays.map((p) =>
    ["101", "102", "201", "202", "301", "302"].includes(p.code)
      ? { ...p, locked: false, earned: true, opensAfter: undefined }
      : p.code === "401"
        ? { ...p, locked: false, opensAfter: undefined }
        : p,
  ),
};

export const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
  ],
};
// A second account so the Account field actually renders (`AccountField` withholds itself for a
// one-account session) — needed only by the page-order scene below (Eric, 2026-09-22).
export const settingsTwoAccounts = {
  ...settings,
  accounts: [
    ...settings.accounts,
    { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: false, profile: null },
  ],
};
