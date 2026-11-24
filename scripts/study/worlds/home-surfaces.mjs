// The landing page's surfaces, with Me and the chat (#8005: `docs/IA.md` §5.9 — the page sign-in
// opens, its windows (the market, the calendar, quests, the party) and the member's question; §5.6 —
// the dock, the Profile's Feedback section, Settings) — what scripts/study/parity.mjs proves on the
// phone and the desktop frame. Same grammar as profile-surfaces.mjs: a route, clicks to reach the
// surface, the roles/names or text that prove it rendered, each checked IN THE VIEWPORT. Every route
// is one the app builds as a link (the app nav's Campaign, the Profile's `?section=`, Settings'
// sections).
//
// These lists name surfaces, never problems: parity proves a world can show a surface, not what a
// member will make of it.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });

const HOME = "/app/";
const WINDOWS = 'nav[aria-label="Linked windows"]';
const FEEDBACK = "/app/accounts?section=feedback";

/** Eric on the landing page and his own Me. */
const OWNER = [
  {
    id: "landing",
    label: "landing: where things stand, the next step and the rest at a glance",
    route: HOME,
    expect: [
      role("heading", "Where things stand"),
      role("heading", "Your next step"),
      role("heading", "At a glance"),
      role("region", "Quick questions"),
    ],
  },
  {
    id: "landing-edition",
    label: "landing: the day's news, dated",
    route: HOME,
    expect: [text("this news is 17 days old")],
  },
  {
    id: "window-market",
    label: "landing → the whole market's window",
    route: HOME,
    act: [click("button", "Market", { exact: true, within: WINDOWS })],
    expect: [role("region", "The whole market")],
  },
  {
    id: "window-quests",
    label: "landing → the quests window",
    route: HOME,
    act: [click("button", "Quests", { exact: true, within: WINDOWS })],
    expect: [role("region", "Your quests"), text("No quest for this account right now.")],
  },
  {
    id: "window-party",
    label: "landing → the party window",
    route: HOME,
    act: [click("button", "Party", { exact: true, within: WINDOWS })],
    expect: [role("region", "The party"), role("heading", "Booked for the party")],
  },
  {
    id: "feedback",
    label: "Me: the Profile's Feedback section, nothing filed",
    route: FEEDBACK,
    expect: [role("heading", "Your feedback"), role("button", "✦ Talk to Moneypenny")],
  },
  {
    id: "settings",
    label: "Me: Settings → Preferences",
    route: "/app/settings",
    expect: [role("heading", "Preferences"), role("group", "Theme")],
  },
  {
    id: "settings-split",
    label: "Me: Settings → Target split",
    route: "/app/settings",
    act: [click("button", "Target split", { exact: true })],
    expect: [role("heading", "Target split", { exact: true })],
  },
  {
    id: "dock-moves",
    label: "the dock: her moves and the box",
    route: HOME,
    expect: [
      role("list", "Your moves"),
      role("button", "How am I doing?"),
      role("button", "File feedback"),
      role("textbox", "Message Moneypenny"),
    ],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Jordan, the invited friend: the same landing for his own accounts. */
const FRIEND = [
  {
    id: "friend-landing",
    label: "friend: the landing page for his own accounts",
    route: HOME,
    expect: [role("heading", "Where things stand"), role("heading", "Your next step")],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey, owning nothing: the landing's next step is to connect an account. */
const NO_ACCOUNT = [
  {
    id: "none-landing",
    label: "no account: the next step is connecting one",
    route: HOME,
    expect: [
      role("heading", "Your next step"),
      role("button", "Connect your paper account"),
      text("Yours once a paper account is connected"),
    ],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** Eric's three filings: one shipped, one asking him a question, one up next. */
const FILED = [
  {
    id: "filed-active",
    label: "Me: his active filings, each with where it stands",
    route: FEEDBACK,
    expect: [
      text("You've filed 3 times."),
      role("link", "#9102 · The leaderboard leaves out an account it can't read"),
      text("Waiting on your answer"),
      text("Up next"),
    ],
  },
  {
    id: "filed-all",
    label: "Me: every filing, the shipped one included",
    route: FEEDBACK,
    act: [click("button", "All", { exact: true })],
    expect: [role("link", "#9101 · Show which of my positions report earnings this week")],
  },
  {
    id: "filed-follow-up",
    label: "Me: a follow-up opened on the filing that asks for an answer",
    route: FEEDBACK,
    act: [click("button", "▸ Follow up")],
    expect: [role("textbox")],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Casey's first day: an account linked this morning. */
const FIRST_DAY = [
  {
    id: "first-landing",
    label: "first day: the landing page with an account and nothing in it",
    route: HOME,
    expect: [role("heading", "Your next step"), text("0 for your account, best first")],
  },
  {
    id: "first-party",
    label: "first day: the party, the new member in it",
    route: HOME,
    act: [click("button", "Party", { exact: true, within: WINDOWS })],
    expect: [role("region", "The party")],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function homeSurfaces(kind) {
  if (kind === "today") return [...OWNER, ...FRIEND, ...NO_ACCOUNT];
  if (kind === "filed") return FILED;
  if (kind === "first-day") return FIRST_DAY;
  throw new Error(`home surfaces: no world kind ${kind}`);
}
