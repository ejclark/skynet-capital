// The league's surfaces each world must render before a study may score them (#8005, the league:
// `docs/IA.md` §5.7 — everyone's standing, everyone's fills) — what scripts/study/parity.mjs proves
// on the phone and the desktop frame. Same grammar as profile-surfaces.mjs: a route, clicks to reach
// the surface, the roles/names or text that prove it rendered, each checked IN THE VIEWPORT. Every
// route is one the app builds as a link (the metric switch's `?by=`, a row's Compare, a row's name,
// the app nav's Activity).
//
// These lists name surfaces, never problems: parity proves a world can show a surface, not what a
// member will make of it.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });

const BOARD = "/app/leaderboard";
const RANK = 'nav[aria-label="Rank the field by"]';
/** A row's Compare link, as the board builds it (`/app/leaderboard?by=month&a=<id>`). */
const COMPARE_ONE = "/app/leaderboard?by=month&a=sauron";
const UNREACHABLE = "Account unreachable — positions can't be read right now.";

/** Eric, who owns his account and Sauron: the whole league as it stands. */
const OWNER = [
  {
    id: "board-match",
    label: "leaderboard: the bots-versus-humans match and each side's card",
    route: BOARD,
    expect: [
      role("heading", "Leaderboard", { exact: true }),
      role("region", "Bots vs Humans live match standings"),
      text("lead on total equity by"),
    ],
  },
  {
    id: "board-field",
    label: "leaderboard: the field by equity, every account named",
    route: BOARD,
    expect: [
      role("navigation", "Rank the field by"),
      role("link", "Sauron BOT"),
      role("link", "Jordan HUMAN"),
      role("link", "Compare Eric"),
    ],
  },
  {
    id: "board-metric",
    label: "leaderboard: the field by another metric",
    route: BOARD,
    act: [click("link", "1M return", { within: RANK })],
    expect: [{ url: "/app/leaderboard" }, role("link", "Compare The Day Trader")],
  },
  {
    id: "board-compare-one",
    label: "compare: one account picked, a second asked for",
    route: BOARD,
    act: [click("link", "Compare Sauron")],
    expect: [role("link", "Cancel compare"), text("Tap Compare on a second account")],
  },
  {
    id: "board-compare-two",
    label: "compare: two accounts side by side",
    route: COMPARE_ONE,
    act: [click("link", "Compare The Day Trader with Sauron")],
    expect: [
      role("region", "Sauron versus The Day Trader"),
      role("heading", "Head to head"),
      role("table", "Sauron versus The Day Trader, line by line"),
    ],
  },
  {
    id: "board-to-account",
    label: "hop: a row's name → that account's own page",
    route: BOARD,
    act: [click("link", "The Day Trader BOT")],
    expect: [{ url: "/app/u/day-trader" }, role("heading", "The Day Trader", { exact: true })],
  },
  {
    id: "account-public",
    label: "an account's page as the league reads it: its positions and its league card",
    route: "/app/u/day-trader",
    expect: [
      role("heading", "The Day Trader", { exact: true }),
      text("You can trade only your own accounts."),
      role("region", "The league"),
    ],
  },
  {
    id: "feed",
    label: "Activity: booked P&L and everyone's fills, newest first",
    route: "/app/activity",
    expect: [
      role("region", "Booked P&L"),
      role("heading", "Everything, newest first"),
      role("region", "MON · NOV 23"),
      role("button", "SELL CRWV 55 $43.60"),
    ],
  },
  {
    id: "feed-filter",
    label: "Activity: the feed's filters",
    route: "/app/activity",
    expect: [
      role("textbox", "Filter activity"),
      role("button", "Bots", { exact: true }),
      role("button", "Humans", { exact: true }),
    ],
  },
  {
    id: "feed-to-account",
    label: "hop: a fill's account → that account's page",
    route: "/app/activity",
    act: [click("link", "Sauron", { exact: true, within: "main" })],
    expect: [{ url: "/app/u/sauron" }, role("heading", "Sauron", { exact: true })],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Jordan, the invited friend: his own account and bot on the same board. */
const FRIEND = [
  {
    id: "friend-board",
    label: "friend: the field, his account and his bot on it",
    route: BOARD,
    expect: [role("link", "Jordan HUMAN"), role("link", "The Day Trader BOT")],
  },
  {
    id: "friend-feed",
    label: "friend: Activity, his bot's fills among everyone's",
    route: "/app/activity",
    expect: [role("region", "Booked P&L"), role("button", "SELL AAPL 500 $240.40")],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey, owning nothing: the league as a spectator reads it. */
const WATCHER = [
  {
    id: "watcher-board",
    label: "watcher: the field, every account",
    route: "/app/leaderboard?by=month",
    expect: [role("navigation", "Rank the field by"), role("link", "Eric HUMAN")],
  },
  {
    id: "watcher-feed",
    label: "watcher: Activity",
    route: "/app/activity",
    expect: [role("heading", "Everything, newest first"), role("region", "MON · NOV 23")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** Jordan's own account unreadable at the instant: what the league and his book each say. */
const READ_FAILED = [
  {
    id: "failed-board",
    label: "the field with one account unreadable: the other three ranked",
    route: BOARD,
    expect: [
      role("link", "Eric HUMAN"),
      role("link", "The Day Trader BOT"),
      role("link", "Jordan HUMAN", { absent: true }),
    ],
  },
  {
    id: "failed-feed",
    label: "Activity: booked P&L and fills, the unreadable account's included",
    route: "/app/activity",
    expect: [role("region", "Booked P&L"), role("link", "Jordan", { exact: true })],
  },
].map((s) => ({ viewer: "eric", ...s }));

const READ_FAILED_OWNER = [
  {
    id: "failed-own-board",
    label: "the owner of the unreadable account on the field",
    route: BOARD,
    expect: [role("link", "The Day Trader BOT"), role("link", "Jordan HUMAN", { absent: true })],
  },
  {
    id: "failed-own-book",
    label: "the owner's own book: the account unreachable",
    route: "/app/accounts",
    expect: [text(UNREACHABLE)],
  },
  {
    id: "failed-own-page",
    label: "the unreadable account's own page",
    route: "/app/u/jordan",
    expect: [text(UNREACHABLE)],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey's first day: a paper account linked this morning, joining the standings. */
const FIRST_DAY = [
  {
    id: "first-board",
    label: "first day: the new account on the field by equity",
    route: BOARD,
    expect: [role("link", "Casey HUMAN"), role("link", "Compare Casey")],
  },
  {
    id: "first-board-month",
    label: "first day: the field by 1M return, the new account on it",
    route: "/app/leaderboard?by=month",
    expect: [role("link", "Casey HUMAN"), role("link", "Sauron BOT")],
  },
  {
    id: "first-feed",
    label: "first day: Activity, nothing of the new account's yet",
    route: "/app/activity",
    expect: [role("heading", "Everything, newest first"), role("region", "Booked P&L")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function leagueSurfaces(kind) {
  if (kind === "today") return [...OWNER, ...FRIEND, ...WATCHER];
  if (kind === "read-failed") return [...READ_FAILED, ...READ_FAILED_OWNER];
  if (kind === "first-day") return FIRST_DAY;
  throw new Error(`league surfaces: no world kind ${kind}`);
}
