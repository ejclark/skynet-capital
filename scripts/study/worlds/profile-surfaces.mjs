// The profile surfaces each world must render before a study may score them (#4943 slice 2) —
// what scripts/study/parity.mjs proves on the phone and the desktop frame. A surface is a route,
// optional clicks to reach it (an opened chip, an expanded row, a hand-off), and the accessible
// roles/names or text that prove it rendered; each is checked IN THE VIEWPORT after scrolling to it.
//
// Located by role and accessible name wherever the page offers one — what a member's screen reader
// would announce — so a surface is "there" in the sense a member can reach, not merely in the DOM.
// A surface a world cannot render is declared with `struck: "<reason>"`, never left out.
//
// These lists name surfaces, never problems: the parity check proves the world can show a surface,
// not what a member will think of it.

const SAURON = "/app/accounts?account=sauron";
const PUT = "CRWV $80 PUT · 6 NOV 26";
const PUT_ROW = "#pos-CRWV261106P00080000";
const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const SECTIONS = 'nav[aria-label="Sections"]';

/** The owner's book on a normal day, plus the invited friend's non-owner view of the bot. */
const TODAY = [
  {
    id: "net-worth",
    label: "net worth",
    route: SAURON,
    expect: [role("region", "Net worth · Sauron")],
  },
  {
    id: "record",
    label: "record (win rate)",
    route: SAURON,
    expect: [role("button", "Win rate", { exact: true })],
  },
  {
    id: "money",
    label: "where your money is",
    route: SAURON,
    expect: [role("region", "Where your money is")],
  },
  { id: "cash", label: "cash ready to use", route: SAURON, expect: [text("Cash ready to use")] },
  {
    id: "decision-put",
    label: "decision: the sold put",
    route: SAURON,
    expect: [role("article", `At risk: ${PUT}`)],
  },
  {
    id: "decision-idea",
    label: "decision: an idea card",
    route: SAURON,
    struck:
      "#4961 — ideas skip a playbook the account already subscribes to, and this bot subscribes" +
      " to every windowed playbook on a symbol it holds; an idea needs an input change",
    expect: [role("article", "Idea:")],
  },
  {
    id: "positions-rows",
    label: "positions: put + both share rows",
    route: SAURON,
    expect: [
      role("row", PUT, { only: "desktop" }),
      role("button", "3 buys for NVDA", { only: "desktop" }),
      role("button", "1 buy for CRWV", { only: "desktop" }),
      role("link", PUT, { only: "phone" }),
      role("link", "NVDA +$1,056", { only: "phone" }),
      role("link", "CRWV -$412", { only: "phone" }),
    ],
  },
  {
    id: "positions-actions",
    label: "positions: row actions",
    route: SAURON,
    // At 390 a position is a card, and the card itself is the action: tapping it opens Trade.
    act: [{ ...click("link", PUT), only: "phone" }],
    expect: [
      role("button", "Close all", { only: "desktop" }),
      // The put's own Close, not any Close on the page (a dialog's, a toast's): inside its row,
      // whose anchor is the one the decision card's "Show in table" links to.
      role("button", "Close", { exact: true, within: PUT_ROW, only: "desktop" }),
      { url: "/app/trade", only: "phone" },
    ],
  },
  {
    id: "positions-filters",
    label: "positions: filter chips",
    route: SAURON,
    expect: ["Options", "Shares", "In profit", "Losing", "Expiring within 3 weeks"].map((n) =>
      role("button", n, { exact: true }),
    ),
  },
  {
    id: "bot-chip",
    label: "bot status chip",
    route: SAURON,
    expect: [role("button", "Beating · last pass")],
  },
  {
    id: "bot-table",
    label: "bot chip: playbook table (opened)",
    route: SAURON,
    act: [click("button", "Beating · last pass")],
    // Verdicts are the playbooks' own at the newest pass (book.mjs): a Thursday is outside the
    // wheel's sale window.
    expect: [
      role("row", "CRWV-WHEEL aggressive waiting for its window"),
      role("row", "TACO-DJT standard"),
    ],
  },
  {
    id: "activity-row",
    label: "activity row expanded, names playbook",
    route: `${SAURON}&section=activity`,
    act: [click("button", `Why ${PUT} was sold`)],
    expect: [text("CRWV-WHEEL · aggressive")],
  },
  {
    id: "calendar",
    label: "market calendar head",
    route: SAURON,
    expect: [role("region", "Market calendar")],
  },
  {
    id: "u-tabs",
    label: "Sauron's /u page tabs",
    route: "/app/u/sauron",
    expect: ["Overview", "Activity", "Pulse", "Heartbeat", "Thesis"].map((n) =>
      role("link", n, { exact: true, within: SECTIONS }),
    ),
  },
  {
    id: "guidance",
    label: "trade guidance hand-off landing",
    route: SAURON,
    act: [
      { ...click("link", "Review on Trade ↗"), knownBug: "#4970" },
      { ...click("button", "Guidance", { exact: true }), only: "phone" },
      { ...click("link", "Guidance for this stock"), only: "desktop" },
    ],
    expect: [role("region", "Guidance", { exact: true })],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** The invited friend opening the owner's bot: the page renders, the playbook names do not. */
const FRIEND = [
  {
    id: "friend-u",
    label: "friend: Sauron's /u page",
    route: "/app/u/sauron",
    expect: [role("heading", "Sauron", { exact: true })],
  },
  {
    id: "friend-chip",
    label: "friend: chip verdicts, no playbook ids",
    route: "/app/u/sauron",
    act: [click("button", "Beating · last pass")],
    expect: [
      role("row", "aggressive waiting for its window"),
      text("CRWV-WHEEL", { absent: true }),
    ],
  },
  {
    id: "friend-activity",
    label: "friend: activity why, no playbook",
    route: "/app/u/sauron/activity",
    act: [click("button", `Why ${PUT} was sold`)],
    // The owner's copy names it as "CRWV-WHEEL · aggressive" under Playbook; the gate strips it.
    // Any rendering of the id counts (getByText: case-insensitive substring) — a strategy tag too.
    expect: [text("Decided by"), text("CRWV-WHEEL", { absent: true })],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** The same book on a bad day: a stopped bot, one losing share position, nothing else. */
const BAD_DAY = [
  {
    id: "bad-net-worth",
    label: "net worth",
    route: SAURON,
    expect: [role("region", "Net worth · Sauron")],
  },
  {
    id: "bad-chip",
    label: "bot chip: stopped",
    route: SAURON,
    expect: [role("button", "Stale · no pass for")],
  },
  {
    id: "bad-decision",
    label: "decision: the losing shares, alone",
    route: SAURON,
    // `name` matches a substring, so the shares' card is told from the put's by the put's absence.
    expect: [
      role("article", "At risk: CRWV"),
      role("article", "At risk: CRWV $", { absent: true }),
      role("article", "At risk: NVDA", { absent: true }),
      role("article", "Idea:", { absent: true }),
    ],
  },
  {
    id: "bad-positions",
    label: "positions: the losing row",
    route: SAURON,
    expect: [
      role("button", "1 buy for CRWV", { only: "desktop" }),
      role("link", "CRWV -$594", { only: "phone" }),
    ],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** A signed-in member with no account: the door, the milestones, and the league still open. */
const NO_ACCOUNT = [
  {
    id: "door",
    label: "zero-account door",
    route: "/app/accounts",
    expect: [text("No account linked yet")],
  },
  {
    id: "milestones",
    label: "milestones",
    route: "/app/accounts",
    expect: [role("heading", "Your milestones")],
  },
  {
    id: "onboarding",
    label: "onboarding chapter",
    route: "/app/accounts",
    expect: [role("region", "Chapter: Onboarding")],
  },
  {
    id: "league-u",
    label: "a bot's /u page",
    route: "/app/u/sauron",
    expect: [role("heading", "Sauron", { exact: true })],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function profileSurfaces(kind) {
  if (kind === "today") return [...TODAY, ...FRIEND];
  if (kind === "bad-day") return BAD_DAY;
  return NO_ACCOUNT;
}
