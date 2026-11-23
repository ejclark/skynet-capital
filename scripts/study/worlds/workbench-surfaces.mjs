// The workbench surfaces each world must render before a study may score them (#8005, the
// workbench area: Trade with its ticket, chart, chain, guidance, outlook, watchlist and orders,
// `docs/IA.md` §5.3) — what scripts/study/parity.mjs proves on the phone and the desktop frame.
// Same grammar as profile-surfaces.mjs: a route, optional taps, and the roles/names or text that
// prove it rendered, each checked IN THE VIEWPORT after scrolling to it.
//
// Routes are the app's own: a section is `?section=` (the bench's switch, `trade-bench.tsx`), and a
// held contract is opened the way the profile's position card links it (`…&section=orders&manage=
// <OCC>`, copied from the rendered card, never composed — the 2026-10-09 false alarm). A surface
// the world cannot render is declared `struck: "<reason>"`, never left out.
//
// These lists name surfaces, never problems: parity proves the world can show a surface, not what a
// member will think of it.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });

const ERIC_AAPL = "/app/trade?desk=eric&symbol=AAPL";
/** A toggle that is on: the chain's chosen expiry, the switch's current section. */
const PRESSED = '[aria-pressed="true"]';
const bench = (section, symbol = "AAPL", desk = "eric") =>
  `/app/trade?desk=${desk}&symbol=${symbol}&section=${section}`;
/** The held put as the profile's position card links it (profile-surfaces.mjs → PUT_CARD). */
const MANAGE_TODAY = "/app/trade?desk=sauron&symbol=CRWV&section=orders&manage=CRWV261106P00080000";
const MANAGE_EXPIRY =
  "/app/trade?desk=sauron&symbol=CRWV&section=orders&manage=CRWV261009P00080000";

/** Why a ticket's Review cannot be scored yet: a world answers every write `{ok:true}`. */
const REVIEW_STRUCK =
  "a world answers every write with {ok:true} (routing.mjs), and the ticket's Review reads a" +
  " `preview` from it, so the page errors — reviews need the real handler answered live (#8005" +
  " slice 4's live-write path, `WORKBENCH_LIVE_WRITES` below)";

/** The owner on a normal Thursday: his own account, his bot's, every pane of the bench. */
const TODAY = [
  {
    id: "ticket",
    label: "ticket: account, symbol, quote, shares",
    route: ERIC_AAPL,
    expect: [
      role("region", "Ticket", { exact: true }),
      role("combobox", "Account", { exact: true }),
      role("combobox", "Symbol", { exact: true }),
      role("spinbutton", "Shares", { exact: true }),
      text("AAPL $236.10"),
      role("button", "Review order"),
    ],
  },
  {
    id: "ticket-recent",
    label: "ticket: this symbol's recent orders",
    route: ERIC_AAPL,
    // The row's words sit in separate elements ("BUY 40" · "@ $231.00" · "filled …"): one is enough.
    expect: [role("heading", "Your recent orders"), text("$231.00")],
  },
  {
    id: "ticket-option",
    label: "option ticket: side, type, its chain",
    route: ERIC_AAPL,
    act: [click("button", "Option", { exact: true })],
    expect: [
      role("button", "Sell to open", { exact: true }),
      role("button", "Call", { exact: true }),
      role("region", "Options chain for AAPL"),
    ],
  },
  {
    id: "ticket-review",
    label: "ticket: Review shows the order's preview",
    route: ERIC_AAPL,
    struck: REVIEW_STRUCK,
  },
  {
    id: "ladder",
    label: "trading ladder: the rungs",
    route: ERIC_AAPL,
    expect: [role("region", "Trading ladder"), role("link", "202 Sell a covered call")],
  },
  {
    id: "chart",
    label: "chart: daily bars and studies",
    route: bench("chart"),
    expect: [role("region", "AAPL daily chart"), role("button", "SMA", { exact: true })],
  },
  {
    id: "chain",
    label: "chain: expirations, quoted strikes",
    route: bench("chain"),
    expect: [
      role("region", "Options chain for AAPL"),
      role("button", "Oct 16, 2026", { exact: true }),
      text("all 13 strikes quoted"),
    ],
  },
  {
    id: "chain-expiry",
    label: "chain: another expiry picked",
    route: bench("chain"),
    act: [click("button", "Nov 20, 2026", { exact: true })],
    expect: [text("Nov 20, 2026", { within: PRESSED })],
  },
  {
    id: "guidance",
    label: "guidance: the house call and the stake",
    route: bench("guidance"),
    expect: [
      role("region", "Guidance", { exact: true }),
      role("region", "AAPL research recap"),
      text("100 shares at $229.44"),
    ],
  },
  {
    id: "outlook",
    label: "outlook: a stated view's structures",
    route: bench("outlook"),
    act: [click("button", "Show me the structures")],
    expect: [role("heading", "Long call", { exact: true }), text("Most it can lose")],
  },
  {
    id: "watchlist",
    label: "watchlist: three watched names",
    route: "/app/trade?section=watchlist",
    expect: [
      role("region", "Watchlist", { exact: true }),
      role("button", "GOOG $246.30"),
      role("button", "Stop watching SPY"),
      text("3 of 20 names"),
    ],
  },
  {
    id: "orders-working",
    label: "orders: the working limit buy",
    route: "/app/trade?desk=eric&section=orders",
    expect: [
      role("region", "Working orders"),
      text("limit $495.00"),
      role("button", "Cancel", { exact: true }),
    ],
  },
  {
    id: "orders-alerts",
    label: "orders: alerts",
    route: "/app/trade?desk=eric&section=orders",
    expect: [role("region", "Alerts", { exact: true }), text("GOOG is on your watchlist")],
  },
  {
    id: "manage-put",
    label: "held put opened from the profile's card",
    route: MANAGE_TODAY,
    expect: [role("region", "Orders", { exact: true }), text("CRWV $80")],
  },
  {
    id: "account-bot",
    label: "account picker: the owner's bot",
    route: "/app/trade?desk=sauron&symbol=NVDA",
    expect: [role("combobox", "Account", { exact: true }), text("NVDA $232.10")],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** The invited friend: their own account only, an empty watchlist, the owner's bot refused. */
const FRIEND = [
  {
    id: "friend-ticket",
    label: "friend: a ticket on their own account",
    route: "/app/trade",
    expect: [role("region", "Ticket", { exact: true }), role("link", "← Back to Jordan")],
  },
  {
    id: "friend-not-yours",
    label: "friend: a bot's desk named in the link falls back to their own",
    route: "/app/trade?desk=sauron&symbol=NVDA",
    expect: [text("Sauron is not yours to trade"), text("NVDA $232.10")],
  },
  {
    id: "friend-watchlist",
    label: "friend: an empty watchlist",
    route: "/app/trade?section=watchlist",
    expect: [role("region", "Watchlist", { exact: true }), text("Nothing here yet")],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** A session before the bot's put expires, in the money. */
const EXPIRY = [
  {
    id: "expiry-manage",
    label: "held put, expiring tomorrow, opened from the profile's card",
    route: MANAGE_EXPIRY,
    expect: [role("region", "Orders", { exact: true }), text("CRWV $80")],
  },
  {
    id: "expiry-chain",
    label: "chain: tomorrow's expiry first",
    route: bench("chain", "CRWV", "sauron"),
    expect: [role("region", "Options chain for CRWV"), text("Oct 9, 2026", { within: PRESSED })],
  },
  {
    id: "expiry-guidance",
    label: "guidance on CRWV",
    route: bench("guidance", "CRWV", "sauron"),
    expect: [role("region", "Guidance", { exact: true })],
  },
  {
    id: "expiry-ticket-review",
    label: "option ticket: Review a buy-back",
    route: MANAGE_EXPIRY,
    struck: REVIEW_STRUCK,
  },
].map((s) => ({ viewer: "eric", ...s }));

/** A member with no account: the doors, the locked ladder. */
const FIRST_DAY = [
  {
    id: "first-doors",
    label: "no account: the bench's doors",
    route: "/app/trade",
    // At 390 the doors fold away: the sentence and its Onboarding link are the page.
    expect: [
      role("link", "Options chain", { exact: true, only: "desktop" }),
      role("link", "Your watchlist", { exact: true, only: "desktop" }),
      text("No accounts are linked to your session yet"),
      role("link", "connect one in Onboarding"),
    ],
  },
  {
    id: "first-ladder",
    label: "no account: the ladder, locked",
    route: "/app/trade",
    expect: [role("region", "Trading ladder"), text("link an account first")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/**
 * The writes a workbench world needs answered by the real handlers, live, at the pinned instant:
 * the ticket's reviews, which change nothing and whose answer depends on what the member typed, so
 * no composed payload can stand in. The live-write path is #8005 slice 4's (the chat-in-a-world
 * module, session `i8005-s4prep`); until it can take this list, `ticket-review` stays STRUCK.
 */
export const WORKBENCH_LIVE_WRITES = [
  "/api/trade/review",
  "/api/trade/option/review",
  "/api/trade/draft",
];

/**
 * Moneypenny's chat in a workbench world (#8005 slice 4). The chat-in-a-world module plugs in
 * HERE — one value every workbench world carries as `chat` — so the bench gets the same chat the
 * cross-feature round does, never a second one. Until it lands the dock renders (parity:
 * `dock-moneypenny`) and a sent message is a recorded write with no reply (shell-artifacts.mjs →
 * "Moneypenny's dock and every form").
 */
export const WORKBENCH_CHAT = null;

/** The surfaces for one world. */
export function workbenchSurfaces(kind) {
  if (kind === "today") return [...TODAY, ...FRIEND];
  if (kind === "expiry") return EXPIRY;
  return FIRST_DAY;
}
