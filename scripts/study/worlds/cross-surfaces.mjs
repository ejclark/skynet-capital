// The hops a cross-feature goal makes (#8005 slice 4), as parity surfaces: each feature's own
// front, and every one-tap hand-off from one feature into the next — the landing page's windows,
// a quest into Trade, Trade back to the account, R&D's playbooks and convictions, the bot's page
// into the league and back. Same grammar as profile-surfaces.mjs: located by role and accessible
// name, checked in the viewport after scrolling to it, `struck: "<why>"` when the world cannot
// render one — never left out. These name surfaces, never problems.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const off = (t) => text(t, { absent: true });

/** The owner: the landing page, its windows, and the hops out of each feature. */
const OWNER = [
  {
    id: "landing",
    label: "landing: where things stand, and the quick questions",
    route: "/app/",
    expect: [
      role("heading", "Where things stand"),
      role("region", "Quick questions"),
      off("Reading today's news…"),
      off("The news didn't load"),
    ],
  },
  {
    id: "landing-market",
    label: "landing window: the whole market",
    route: "/app/?w=market",
    expect: [role("heading", "The whole market"), off("This edition carries no market closes.")],
  },
  {
    id: "landing-calendar",
    label: "landing window: the calendar",
    route: "/app/?w=calendar",
    expect: [role("heading", "The calendar"), off("No edition has been written yet.")],
  },
  {
    id: "landing-quests",
    label: "landing window: quests",
    route: "/app/?w=quests",
    // Judged in full: the conditions check reads SPY and QQQ (inputs/cross-feature.json → market).
    expect: [role("heading", "Quests", { exact: true }), off("Not judged this time")],
  },
  {
    id: "landing-party",
    label: "landing window: the party",
    route: "/app/?w=party",
    expect: [
      role("heading", "The party"),
      off("Reading the party's books…"),
      off("The party's books didn't load"),
    ],
  },
  {
    id: "quest-to-trade",
    label: "hop: a quest → its draft ticket on Trade",
    route: "/app/?w=quests",
    struck:
      "no quest qualifies in this world on 2026-11-19, as production's own rules read its book:" +
      " no account holds a call (position quests), VIX closed 24.56 under the 25 floor" +
      " (conditions quests), and no campaign event's ledger carries a buy signal (event quests)",
  },
  {
    id: "trade-to-account",
    label: "hop: Trade → back to the account",
    route: "/app/trade?desk=sauron&symbol=NVDA",
    act: [click("link", "Back to Sauron")],
    expect: [{ url: "/app/accounts" }],
  },
  {
    id: "research-playbooks",
    label: "R&D: playbooks, and the member's convictions",
    route: "/app/research?section=playbooks",
    expect: [
      role("heading", "Playbooks", { exact: true }),
      role("heading", "Your convictions"),
      off("Opening the playbooks…"),
      off("The playbooks are unreachable."),
    ],
  },
  {
    id: "bot-page",
    label: "the bot's page",
    route: "/app/u/sauron",
    expect: [role("heading", "Sauron", { exact: true }), off("This account is unreachable.")],
  },
  {
    id: "bot-to-league",
    label: "hop: the bot's page → the full leaderboard",
    route: "/app/u/sauron",
    act: [click("link", "Full leaderboard")],
    expect: [{ url: "/app/leaderboard" }, role("heading", "Leaderboard", { exact: true })],
  },
  {
    id: "league-to-bot",
    label: "hop: the leaderboard → a bot's page",
    route: "/app/leaderboard",
    // A row's name link carries its kind chip ("Sauron" + "Bot"), so the name is matched in part.
    act: [click("link", "Sauron")],
    expect: [{ url: "/app/u/sauron" }, role("heading", "Sauron", { exact: true })],
  },
  {
    id: "feed-to-bot",
    label: "hop: the Activity feed → a bot's page",
    route: "/app/activity",
    act: [click("link", "Sauron", { exact: true })],
    expect: [{ url: "/app/u/sauron" }, role("heading", "Sauron", { exact: true })],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** The first-timer: the landing page's door to linking an account. */
const FIRST_TIMER = [
  {
    id: "first-landing",
    label: "first-timer: the landing page",
    route: "/app/",
    expect: [role("heading", "Where things stand")],
  },
  {
    id: "first-connect",
    label: "hop: first-timer → connect your paper account",
    route: "/app/",
    act: [click("button", "Connect your paper account")],
    expect: [{ url: "/app/accounts" }, text("No account linked yet")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The invited friend: the owner's bot from the league. */
const FRIEND = [
  {
    id: "friend-bot",
    label: "friend: the owner's bot page",
    route: "/app/u/sauron",
    expect: [role("heading", "Sauron", { exact: true })],
  },
].map((s) => ({ viewer: "jordan", ...s }));

export function crossSurfaces() {
  return [...OWNER, ...FIRST_TIMER, ...FRIEND];
}
