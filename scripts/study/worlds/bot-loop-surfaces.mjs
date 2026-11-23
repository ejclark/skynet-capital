// The bot's-loop surfaces each world must render before a study may score them (#8005; docs/IA.md
// §5.2: is it running, what it decided, what it is subscribed to, the owner's switch) — what
// scripts/study/parity.mjs proves on the phone and the desktop frame. Same grammar as
// profile-surfaces.mjs: a route, clicks to reach the surface, the roles/names or text that prove it
// rendered, each checked IN THE VIEWPORT. Every route is one the app builds as a link (the head's
// section switch, the account menu's Settings link, "Change in R&D ›", "Open in your Accounts").
//
// Three viewers, three relations to a bot: Eric owns Sauron, Jordan owns The Day Trader, and Casey
// owns nothing. Each reads one bot as its owner and the other as the league does, where which
// playbooks it runs is withheld (#885).
//
// These lists name surfaces, never problems: parity proves a world can show a surface, not what a
// member will make of it.

import { dockShellSurfaces, NO_ACCOUNT_SETTINGS } from "./shell-surfaces.mjs";

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const SECTIONS = 'nav[aria-label="Sections"]';
const phone = (e) => ({ ...e, only: "phone" });
const desktop = (e) => ({ ...e, only: "desktop" });

const SAURON = "/app/u/sauron";
const DT = "/app/u/day-trader";
/** The account menu's Settings link (`account-menu.tsx`): Settings › Account, that account picked. */
const settingsFor = (id) => `/app/settings?section=account&account=${id}`;
/** R&D's Playbooks for one bot — the bot page's "Change in R&D ›". */
const RD_SAURON = "/app/research?section=playbooks&account=sauron";
/** On a desk R&D lists its playbooks and opens one at a time; on a phone each card is open. */
const OPEN_WHEEL = desktop(click("button", "The wheel Sells puts"));

/** The checks strip and the check log, which the owner and the league both read. */
const checks = (name) => role("region", `${name}'s checks`);

/** Eric, Sauron's owner: his bot running and trading, its wheel held by its conviction view. */
const OWNER = [
  {
    id: "u-head",
    label: "Sauron's page: name, state, playbook count",
    route: SAURON,
    expect: [role("heading", "Sauron", { exact: true }), role("link", "4 playbooks")],
  },
  {
    id: "u-sections",
    label: "Sauron's page: the section switch, Settings included (owner)",
    route: SAURON,
    expect: ["Overview", "Ledger", "Pulse", "Playbooks", "Thesis", "Settings"].map((n) =>
      role("link", n, { exact: true, within: SECTIONS }),
    ),
  },
  {
    id: "checks-running",
    label: "Playbooks: the checks strip, running",
    route: `${SAURON}/playbooks`,
    expect: [checks("Sauron"), text("Running · last check 20s ago")],
  },
  {
    id: "playbook-cards",
    label: "Playbooks: one card per playbook, named, and the way to change them",
    route: `${SAURON}/playbooks`,
    expect: [
      text("Sauron's own rules", { exact: true }),
      text("Trading on live signals", { exact: true }),
      role("link", "Change in R&D ›"),
    ],
  },
  {
    id: "check-log",
    label: "Playbooks: every check, unfolded",
    route: `${SAURON}/playbooks`,
    act: [click("button", "Every check")],
    expect: [
      role("region", "Every check"),
      role("checkbox", "Include the checks that placed a trade"),
    ],
  },
  {
    id: "ledger-stop",
    label: "Ledger: today's stop-loss sale, with the playbook that placed it",
    route: `${SAURON}/ledger`,
    expect: [
      phone(role("button", "SOLD 55 shares CRWV")),
      desktop(role("row", "SOLD 55 shares CRWV at $43.60")),
      role("link", "Sauron's own rules · aggressive — open its card on Playbooks"),
    ],
  },
  {
    id: "pulse",
    label: "Pulse: the equity curve and streaks",
    route: `${SAURON}/pulse`,
    expect: [role("heading", "Streaks", { exact: true })],
  },
  {
    id: "thesis-safeguards",
    label: "Thesis: the safeguard stages",
    route: `${SAURON}/thesis`,
    expect: [role("heading", "Safeguards"), text("Stage 2 — Automatic exit on a losing position")],
  },
  {
    id: "account-playbooks",
    label: "Profile: the bot's Playbooks section",
    route: "/app/accounts?account=sauron&section=playbooks",
    expect: [checks("Sauron"), role("button", "4 playbooks")],
  },
  {
    id: "account-thesis",
    label: "Profile: the bot's Thesis section",
    route: "/app/accounts?account=sauron&section=thesis",
    expect: [role("heading", "What protects this play")],
  },
  {
    id: "rd-steered",
    label: "R&D Playbooks for the bot: the wheel steered by a conviction view, and held",
    route: RD_SAURON,
    act: [OPEN_WHEEL],
    expect: [text("steered by: AI-dip view"), text("an adopted change holds it")],
  },
  {
    id: "rd-handoff",
    label: "Playbooks → R&D, by the bot's own link",
    route: `${SAURON}/playbooks`,
    act: [click("link", "Change in R&D ›")],
    expect: [{ url: "/app/research" }, role("button", "The wheel Sells puts")],
  },
  {
    id: "settings-steering",
    label: "Settings: the owner's switch and steering, with the change log",
    route: settingsFor("sauron"),
    expect: [
      role("heading", "Sauron BOT"),
      role("button", "Suspend trading"),
      role("combobox", "New positions"),
      role("combobox", "Paper orders"),
      text("View steering CRWV-WHEEL"),
    ],
  },
  {
    id: "owner-reads-friends-bot",
    label: "Eric on Jordan's bot: held, read as the league reads it",
    route: `${DT}/playbooks`,
    expect: [
      checks("The Day Trader"),
      text("Halted · data-gap"),
      role("link", "Change in R&D ›", { absent: true }),
    ],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Jordan, the Day Trader's owner: his bot held by its breaker; Sauron, not his. */
const FRIEND = [
  {
    id: "friend-bot-held",
    label: "friend: his own bot running, its opens held by a breaker",
    route: `${DT}/playbooks`,
    expect: [
      role("heading", "The Day Trader", { exact: true }),
      text("Running · halted"),
      text("Halted · data-gap"),
      role("link", "Change in R&D ›"),
    ],
  },
  {
    id: "friend-bot-ledger",
    label: "friend: his bot's Ledger, the exit it placed while held",
    route: `${DT}/ledger`,
    expect: [
      phone(role("button", "SOLD 500 shares AAPL")),
      desktop(role("row", "SOLD 500 shares AAPL at $240.40")),
    ],
  },
  {
    id: "friend-breaker",
    label: "friend: Settings, his bot's breaker and its reset",
    route: settingsFor("day-trader"),
    expect: [
      role("heading", "The Day Trader BOT"),
      text("the data-gap breaker tripped"),
      role("button", "Reset breaker"),
      role("button", "Suspend trading"),
    ],
  },
  {
    id: "friend-reads-sauron",
    label: "friend: Sauron's Playbooks by state, names withheld",
    route: `${SAURON}/playbooks`,
    expect: [
      checks("Sauron"),
      text("Which playbooks these are is the bot owner's to see"),
      text("Sauron's own rules", { absent: true }),
      role("link", "Change in R&D ›", { absent: true }),
    ],
  },
  {
    id: "friend-sauron-sections",
    label: "friend: Sauron's section switch, without Settings",
    route: SAURON,
    expect: [
      role("link", "Playbooks", { exact: true, within: SECTIONS }),
      role("link", "Settings", { exact: true, within: SECTIONS, absent: true }),
    ],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey, owning nothing: both bots as the league reads them. */
const WATCHER = [
  {
    id: "watcher-sauron",
    label: "watcher: Sauron's page and its checks",
    route: `${SAURON}/playbooks`,
    expect: [checks("Sauron"), text("Running · last check 20s ago")],
  },
  {
    id: "watcher-ledger",
    label: "watcher: Sauron's Ledger, no playbook named",
    route: `${SAURON}/ledger`,
    expect: [
      phone(role("button", "SOLD 55 shares CRWV")),
      desktop(role("row", "SOLD 55 shares CRWV at $43.60")),
      text("Sauron's own rules", { absent: true }),
    ],
  },
  {
    id: "watcher-held",
    label: "watcher: the held bot reads as held",
    route: `${DT}/playbooks`,
    expect: [text("Running · halted"), text("Halted · data-gap")],
  },
  {
    id: "watcher-leaderboard",
    label: "watcher: the leaderboard, both bots on it",
    route: "/app/leaderboard?by=month",
    expect: [role("heading", "Leaderboard", { exact: true }), text("The Day Trader")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The owners steering instead of a breaker: Sauron holding its opens, the Day Trader watching. */
const STEERED = [
  {
    id: "steered-sauron-held",
    label: "Playbooks: an open refused because its owner holds new positions",
    route: `${SAURON}/playbooks`,
    act: [click("button", "Every check")],
    expect: [text("its owner is holding new positions on this bot")],
  },
  {
    id: "steered-sauron-settings",
    label: 'Settings: Sauron\'s "stop opening, keep exits", logged',
    route: settingsFor("sauron"),
    expect: [role("combobox", "New positions"), text("Stop opening off → on")],
  },
].map((s) => ({ viewer: "eric", ...s }));

const FRIEND_STEERED = [
  {
    id: "steered-dt-checks",
    label: "friend: his watching bot's checks, no breaker",
    route: `${DT}/playbooks`,
    expect: [
      checks("The Day Trader"),
      text("Running · last check 20s ago"),
      text("Halted", { absent: true }),
    ],
  },
  {
    id: "steered-dt-settings",
    label: 'friend: Settings, his bot\'s "watch only", logged, no breaker',
    route: settingsFor("day-trader"),
    expect: [
      role("combobox", "Paper orders"),
      text("Watch only off → on"),
      role("button", "Reset breaker", { absent: true }),
    ],
  },
  {
    id: "steered-dt-ledger",
    label: "friend: his bot's Ledger, the cut it decided never sent",
    route: `${DT}/ledger`,
    expect: [
      phone(role("button", "BOUGHT 500 shares AAPL")),
      desktop(role("row", "BOUGHT 500 shares AAPL at $238.60")),
      role("button", "SOLD 500 shares AAPL", { absent: true }),
    ],
  },
].map((s) => ({ viewer: "jordan", ...s }));

const WATCHER_STEERED = [
  {
    id: "steered-watcher",
    label: "watcher: the watching bot as the league reads it",
    route: `${DT}/playbooks`,
    expect: [checks("The Day Trader"), text("Running · last check 20s ago")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function botLoopSurfaces(kind) {
  if (kind === "today") return [...OWNER, ...FRIEND, ...WATCHER];
  if (kind === "steered") return [...STEERED, ...FRIEND_STEERED, ...WATCHER_STEERED];
  throw new Error(`bot-loop surfaces: no world kind ${kind}`);
}

/** One viewer's one-tap list, its ids and labels marked with who, so three can share a table. */
const tapsFor = (viewer, adjust) =>
  dockShellSurfaces(viewer, adjust).map((s) => ({
    ...s,
    id: `${viewer}-${s.id}`,
    label: `${viewer}: ${s.label}`,
  }));

/** Casey owns nothing: Profile is the no-account door, and the league card lives on a bot's page. */
const NO_ACCOUNT_DOCK = {
  ...NO_ACCOUNT_SETTINGS,
  "nav-profile": {
    expect: [{ url: "/app/accounts" }, text("No account linked yet")],
  },
  "league-leaderboard": { route: SAURON },
};

/** Every destination one tap from the area, for each of the three viewers. */
export function botLoopOneTap() {
  return [...tapsFor("eric"), ...tapsFor("jordan"), ...tapsFor("casey", NO_ACCOUNT_DOCK)];
}
