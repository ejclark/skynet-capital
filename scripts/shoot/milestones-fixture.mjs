// The Milestones section's fixtures for `milestones.mjs` (#3807 slice 2b) — M·03's four
// playbooks and the eight rungs the milestone strip draws, split out so the harness stays under
// the arch cap. Real strategies, honest unlock rungs (CLAUDE.md → Domain accuracy & honesty).

const pb = (
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
) => ({
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
});
export const playbooks = {
  linked: true,
  milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
  arming: "season-1",
  unlocked: 1,
  total: 4,
  playbooks: [
    pb(
      "accumulator",
      "⬒",
      "Blue-chip accumulator",
      "AUTO-DRAFT · BUYS",
      "Drafts a recurring buy of your core holding on a schedule you set, sized to your buying power.",
      "102",
      "Sell stock",
      "buy + sell a stock with a net positive result",
      true,
    ),
    pb(
      "wheel-put",
      "◑",
      "Wheel · put leg",
      "AUTO-DRAFT · CSP",
      "Watches your watchlist for puts at strikes you'd buy, ~30 delta, and drafts the cash-secured ticket.",
      "201",
      "Sell cash-secured put",
      "one cash-secured put filled, premium kept ≥ 1% of secured cash",
      false,
    ),
    pb(
      "wheel-call",
      "◐",
      "Wheel · call leg",
      "AUTO-DRAFT · COVERED CALL",
      "When you hold 100+ shares, drafts a covered call above your cost basis at your target premium.",
      "202",
      "Sell covered call",
      "one covered call filled above cost basis",
      false,
    ),
    pb(
      "hedge",
      "◮",
      "Portfolio hedge",
      "AUTO-DRAFT · LONG PUTS",
      "Drafts a protective put when your portfolio concentration crosses the threshold you set.",
      "302",
      "Buy long call",
      "one long put + one long call filled, ≥ 2% margin on the round trip",
      false,
    ),
  ],
};

// The milestone strip (#3407 slice 5) reads `/api/trade/plays` — the same eight rungs the ladder
// below it draws as cards: 101 earned, 102 open (next up), the rest locked.
const rung = (code, name, kind, side, optionType, state, opensAfter) => ({
  code,
  id: code,
  name,
  tldr: "",
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: state === "locked",
  earned: state === "earned",
  ...(opensAfter ? { opensAfter } : {}),
});
export const plays = {
  linked: true,
  wheels: true,
  nextUp: "102",
  plays: [
    rung("101", "Buy stock", "stock", "buy", undefined, "earned"),
    rung("102", "Sell stock", "stock", "sell", undefined, "open"),
    rung("201", "Sell a cash-secured put", "option", "sell", "put", "locked", {
      code: "102",
      name: "Sell stock",
    }),
    rung("202", "Sell a covered call", "option", "sell", "call", "locked", {
      code: "201",
      name: "Sell a cash-secured put",
    }),
    rung("301", "Buy a long put", "option", "buy", "put", "locked", {
      code: "202",
      name: "Sell a covered call",
    }),
    rung("302", "Buy a long call", "option", "buy", "call", "locked", {
      code: "301",
      name: "Buy a long put",
    }),
    rung("401", "Vertical spread", "multi-leg", "buy", undefined, "locked", {
      code: "302",
      name: "Buy a long call",
    }),
    rung("501", "Zero-DTE", "option", "sell", "put", "locked", {
      code: "401",
      name: "Vertical spread",
    }),
  ],
};
