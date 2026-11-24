// The ladder's surfaces each world must render before a study may score them (#8005, the ladder:
// `docs/IA.md` §5.5 — the rungs, the courses and checks, onboarding, the human playbook chapter) —
// what scripts/study/parity.mjs proves on the phone and the desktop frame. Same grammar as
// profile-surfaces.mjs: a route, clicks to reach the surface, the roles/names or text that prove it
// rendered, each checked IN THE VIEWPORT. Every route is one the app builds as a link (the
// Milestones section's `?chapter=` anchors, Trade's "Trading ladder →", a rung's "open Trade →").
//
// The ladder is the session's first owned account × rung at the pin (§5.5's key): Eric's reads
// from his own account's fills, Jordan's from his, and Casey owns nothing until the first day.
//
// These lists name surfaces, never problems: parity proves a world can show a surface, not what a
// member will make of it.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });

const MILESTONES = "/app/accounts?section=milestones";
const chapter = (c) => `${MILESTONES}&chapter=${c}`;
const TRADING = "Chapter: Trading progression";

/** Eric, who has bought stock on his own account: rung 101 earned, the ladder above it open. */
const OWNER = [
  {
    id: "toc",
    label: "Milestones: the table of contents, three chapters and the points",
    route: MILESTONES,
    expect: [
      role("heading", "Your milestones"),
      role("link", "M·01"),
      role("link", "M·02"),
      role("link", "M·03"),
      text("Points"),
    ],
  },
  {
    id: "toc-to-chapter",
    label: "hop: a chapter card → its chapter, opened beneath the cards",
    route: MILESTONES,
    act: [click("link", "M·02")],
    expect: [role("region", TRADING)],
  },
  {
    id: "trading",
    label: "Trading progression: the ladder by course, the earned rung dated",
    route: chapter("trading"),
    expect: [
      role("region", TRADING),
      role("region", "Trading ladder"),
      role("region", "Level 100 · Stock basics — own it, book it"),
      // A rung row is a group of separate spans (code · "earned" · its date): the date stands alone.
      text("2026-11-06"),
    ],
  },
  {
    id: "trading-to-trade",
    label: "hop: the next rung → Trade",
    route: chapter("trading"),
    act: [click("link", "open Trade →")],
    expect: [{ url: "/app/trade" }, role("heading", "Trade", { exact: true })],
  },
  {
    id: "onboarding",
    label: "Onboarding: its steps, as far as the member has come",
    route: chapter("onboarding"),
    expect: [role("region", "Chapter: Onboarding"), role("heading", "Onboarding", { exact: true })],
  },
  {
    id: "playbooks",
    label: "the human playbook chapter",
    route: chapter("playbooks"),
    expect: [role("region", "Chapter: Playbooks")],
  },
  {
    id: "trade-strip",
    label: "Trade: the ladder's strip and the ticket's rung",
    route: "/app/trade",
    expect: [
      role("region", "Trading ladder"),
      role("navigation", "Rungs"),
      role("link", "101 Buy stock — earned"),
      role("link", "Trading ladder →"),
    ],
  },
  {
    id: "trade-to-ladder",
    label: "hop: Trade's ladder link → the chapter on Milestones",
    route: "/app/trade",
    act: [click("link", "Trading ladder →")],
    expect: [{ url: "/app/accounts" }, role("region", TRADING)],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Jordan, the invited friend: his own ladder from his own account's fills. */
const FRIEND = [
  {
    id: "friend-trading",
    label: "friend: his own ladder, his first buy earned",
    route: chapter("trading"),
    expect: [role("region", "Trading ladder"), text("2026-11-11")],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey, owning nothing: onboarding has not started. */
const NO_ACCOUNT = [
  {
    id: "none-onboarding",
    label: "no account: Milestones opens on onboarding's first step",
    route: MILESTONES,
    expect: [
      role("region", "Chapter: Onboarding"),
      text("Step 1 of 3"),
      role("link", "connect one in Onboarding"),
    ],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** Eric after his first stock sale at 11:45: rung 102 earned today, course 200 next. */
const FIRST_SALE = [
  {
    id: "sale-trading",
    label: "the rung earned today, and the course it opened",
    route: chapter("trading"),
    expect: [
      text("2026-11-23"),
      role("region", "Level 200 · The Wheel — get paid to own good stocks"),
      text("2 / 8 earned"),
    ],
  },
  {
    id: "sale-trade-strip",
    label: "Trade: both stock rungs earned on the strip",
    route: "/app/trade",
    expect: [role("link", "101 Buy stock — earned"), role("link", "102 Sell stock — earned")],
  },
  {
    id: "sale-toc",
    label: "Milestones: the chapters with today's points",
    route: MILESTONES,
    expect: [role("heading", "Your milestones"), role("link", "M·02")],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Casey's first day: an account linked this morning, no rung yet. */
const FIRST_DAY = [
  {
    id: "first-toc",
    label: "first day: the chapters, onboarding begun",
    route: MILESTONES,
    expect: [role("link", "M·01"), role("link", "M·02")],
  },
  {
    id: "first-onboarding",
    label: "first day: onboarding's next step, saying hello to Moneypenny",
    route: chapter("onboarding"),
    expect: [
      role("heading", "Welcome to the league, Casey"),
      text("Say hello to Moneypenny"),
      text("the trading ladder opens"),
    ],
  },
  {
    id: "first-hello-opens",
    label: "first day: a hello sent to Moneypenny opens the ladder",
    route: chapter("onboarding"),
    struck:
      "a world records a member's writes and never applies them (world-route.mjs), and the" +
      " hello gate is a server record the next read must see; the message is answered, the" +
      " gate stays shut (#8070)",
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function ladderSurfaces(kind) {
  if (kind === "today") return [...OWNER, ...FRIEND, ...NO_ACCOUNT];
  if (kind === "first-sale") return FIRST_SALE;
  if (kind === "first-day") return FIRST_DAY;
  throw new Error(`ladder surfaces: no world kind ${kind}`);
}
