// R&D surfaces each world must render before a study may score them (#8005, R&D: `docs/IA.md` §5.4
// — the calendar, the house calls and ledgers, the closures, the playbook catalog) — what
// scripts/study/parity.mjs proves on the phone and the desktop frame. Same grammar as
// profile-surfaces.mjs: a route, clicks to reach the surface, the roles/names or text that prove it
// rendered, each checked IN THE VIEWPORT. Every route is one the app builds as a link (the section
// switch's `?section=`, a call's write-up link, a bot's "Change in R&D ›", a Coverage row's tap).
//
// The week is Thanksgiving's at the pin: four sessions, Thursday closed, Friday's 1:00 p.m. close —
// the closures and the calendar are the pin's own (`/api/research` at the corpus).
//
// These lists name surfaces, never problems: parity proves a world can show a surface, not what a
// member will make of it.

const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const off = (t) => text(t, { absent: true });
const phone = (e) => ({ ...e, only: "phone" });
const desktop = (e) => ({ ...e, only: "desktop" });

const BOARD = "/app/research";
const COVERAGE = "/app/research?section=coverage";
const PLAYBOOKS = "/app/research?section=playbooks";
/** The bot page's "Change in R&D ›" (`playbook-cards.tsx`): R&D Playbooks for that account. */
const playbooksFor = (id) => `/app/research?section=playbooks&account=${id}`;
/** The calendar head as the week reads at the instant: a button that opens it on a phone, laid out
 *  open on a desk. */
const WEEK = "Market calendar: Nov 23 – Nov 29 · 4 sessions";
const calendarHead = [phone(role("button", WEEK)), desktop(role("group", "Lens"))];
/** On a desk the catalog opens one strategy at a time beside its list; on a phone every card is
 *  open (bot-loop-surfaces.mjs → OPEN_WHEEL). */
const OPEN_WHEEL = desktop(click("button", "The wheel Sells puts"));
const CLOSURE = "/research/events/thanksgiving-market-closure-2026-11-26";
/** What Coverage prints when the world quotes no sector fund — a world hole, never production's
 *  view for a member with a linked account. */
const NO_FUNDS = "No sector-fund prices came back just now.";

/** Eric, who owns his account and Sauron: the whole board, Coverage with his holdings, the catalog
 *  with his bot's wheel steered by the house's AI-dip view. */
const OWNER = [
  {
    id: "board-head",
    label: "Board: the calendar head, this week",
    route: BOARD,
    expect: [
      role("heading", "R&D", { exact: true }),
      role("region", "Market calendar"),
      ...calendarHead,
    ],
  },
  {
    id: "board-calendar",
    label: "Board: the calendar opened, its lens and the closed days",
    route: BOARD,
    act: [phone(click("button", WEEK))],
    expect: [
      phone(role("dialog", "Market calendar")),
      role("group", "Lens"),
      role("button", "Next week"),
      phone(text("7 closed")),
    ],
  },
  {
    id: "board-calls",
    label: "Board: this week's calls, the Thanksgiving closure among them",
    route: BOARD,
    expect: [
      role("heading", "The call board · this week"),
      role("link", "thanksgiving-market-closure-2026-11-26", { exact: true }),
    ],
  },
  {
    id: "board-filters",
    label: "Board: the filter box and its three pickers",
    route: BOARD,
    expect: [
      role("textbox", "Filter research"),
      role("combobox", "Event", { exact: true }),
      role("combobox", "Impact", { exact: true }),
      role("combobox", "Call", { exact: true }),
    ],
  },
  {
    id: "board-symbols",
    label: "Board: the research names and each one's next date",
    route: BOARD,
    expect: [role("button", "AMZN 2026-11-30"), role("button", "AVGO no dated event")],
  },
  {
    id: "board-symbol-scoped",
    label: "Board: one name picked, the board narrowed to it",
    route: BOARD,
    act: [click("button", "AMZN 2026-11-30")],
    expect: [role("heading", "Where AMZN fits")],
  },
  {
    id: "board-ledgers",
    label: "Board: the event ledgers and the studies",
    route: BOARD,
    expect: [role("heading", "Event ledgers"), role("heading", "Studies", { exact: true })],
  },
  {
    id: "write-up",
    label: "a research write-up: the Thanksgiving closure, as the shelf stood",
    // Server-rendered by production's own route from the world's corpus (world-route.mjs).
    route: CLOSURE,
    expect: [
      role("heading", "US markets closed — Thanksgiving Day"),
      role("heading", "Stance & kill switches"),
    ],
  },
  {
    id: "write-up-back",
    label: "hop: a write-up → back to R&D",
    route: CLOSURE,
    act: [click("link", "Research")],
    expect: [{ url: "/app/research" }, role("heading", "R&D", { exact: true })],
  },
  {
    id: "coverage",
    label: "Coverage: the ring, every sector, the funds' month",
    route: COVERAGE,
    expect: [
      role("heading", "Coverage", { exact: true }),
      role("region", "Coverage at a glance"),
      role("button", "Technology: show its research on the Board"),
      text("Holdings: 1 of 11 sectors"),
      off(NO_FUNDS),
    ],
  },
  {
    id: "coverage-to-board",
    label: "hop: a Coverage row → the Board scoped to that sector",
    route: COVERAGE,
    act: [click("button", "Energy: show its research on the Board")],
    expect: [{ url: "/app/research" }, role("heading", "The call board · this week")],
  },
  {
    id: "playbooks",
    label: "Playbooks: the member's own lists and the catalog",
    route: PLAYBOOKS,
    expect: [
      role("heading", "Playbooks", { exact: true }),
      role("region", "Your playbooks"),
      role("region", "Your chains"),
      role("region", "Your convictions"),
      role("heading", "Ready for a bot · 6"),
    ],
  },
  {
    id: "playbooks-steered",
    label: "Playbooks: the wheel marked conviction, steered by the house's view",
    route: PLAYBOOKS,
    act: [OPEN_WHEEL],
    expect: [
      role("button", "The wheel Sells puts, then calls on shares it's assigned"),
      text("steered by: AI-dip view"),
    ],
  },
  {
    id: "playbooks-subscribe",
    label: "Playbooks: + on a play opens the member's own bots",
    route: PLAYBOOKS,
    act: [click("button", "Subscribe your bots to the wheel")],
    // Each bot is a styled label over a visually hidden checkbox: the label is what shows, its
    // name and its state in separate spans.
    expect: [role("group", "Your bots for the wheel"), text("already runs it")],
  },
  {
    id: "playbooks-account",
    label: "Playbooks for one bot: its subscriptions and their controls",
    route: playbooksFor("sauron"),
    expect: [
      text("Sauron — capital under management across active subscriptions"),
      role("button", "Pause", { exact: true }),
    ],
  },
  {
    id: "bot-to-rd",
    label: "hop: the bot's Playbooks → R&D, by its own link",
    route: "/app/u/sauron/playbooks",
    act: [click("link", "Change in R&D ›")],
    expect: [{ url: "/app/research" }, role("heading", "Playbooks", { exact: true })],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Jordan, who owns his account and The Day Trader: R&D for his own bot. */
const FRIEND = [
  {
    id: "friend-playbooks",
    label: "friend: Playbooks, his bot the one to subscribe",
    route: PLAYBOOKS,
    act: [click("button", "Subscribe your bots to the wheel")],
    expect: [role("group", "Your bots for the wheel"), text("The Day Trader", { exact: true })],
  },
  {
    id: "friend-account",
    label: "friend: Playbooks for his own bot",
    route: playbooksFor("day-trader"),
    expect: [text("The Day Trader — capital under management across active subscriptions")],
  },
].map((s) => ({ viewer: "jordan", ...s }));

/** Casey, owning nothing: the board as anyone reads it, Coverage with no account to price from. */
const WATCHER = [
  {
    id: "watcher-board",
    label: "watcher: the Board and its calendar",
    route: BOARD,
    expect: [role("heading", "R&D", { exact: true }), ...calendarHead],
  },
  {
    id: "watcher-coverage",
    label: "watcher: Coverage with no linked account",
    route: COVERAGE,
    expect: [
      role("region", "Coverage at a glance"),
      text("sector-fund prices load through your own linked account, and none is linked"),
    ],
  },
  {
    id: "watcher-playbooks",
    label: "watcher: Playbooks with no bot to subscribe",
    route: PLAYBOOKS,
    expect: [
      role("heading", "Ready for a bot · 6"),
      text("A playbook runs on a bot, and you don't have one yet."),
      role("button", "Subscribe your bots to the wheel", { absent: true }),
    ],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** Eric after writing into R&D himself: his own view and his own draft beside the house's. */
const OWN_VIEWS = [
  {
    id: "own-conviction",
    label: "his own view: a draft that would steer his bot's CRWV wheel",
    route: PLAYBOOKS,
    expect: [
      role("region", "Your convictions · 1"),
      role("button", "Change CRWV's sell-off is overdone"),
      text("steers the wheel on CRWV"),
      role("button", "Hand to my bots"),
    ],
  },
  {
    id: "own-house-view",
    label: "the same pair, steered today by the house's view",
    route: PLAYBOOKS,
    act: [OPEN_WHEEL],
    expect: [
      role("button", "The wheel Sells puts, then calls on shares it's assigned"),
      text("steered by: AI-dip view"),
    ],
  },
  {
    id: "own-play",
    label: "his own playbook: a draft, not yet in a shadow test",
    route: PLAYBOOKS,
    expect: [
      role("region", "Your playbooks · 1"),
      role("button", "Change CRWV news pop"),
      role("button", "Start a shadow test"),
    ],
  },
  {
    id: "own-play-shadow",
    label: "his own playbook in its shadow test, with the would-be trades",
    route: PLAYBOOKS,
    struck:
      "a world has no shadow report: production's bots process writes one each pass and the" +
      " server reads it (`readAuthoredShadow`, the insights bridge); a world composes no bots" +
      " process, so a play put in its test would read as never checked — the edge stays at a draft" +
      " (#8049)",
  },
  {
    id: "own-account",
    label: "his own view and draft on his bot's Playbooks",
    route: playbooksFor("sauron"),
    expect: [role("region", "Your convictions · 1"), role("region", "Your playbooks · 1")],
  },
].map((s) => ({ viewer: "eric", ...s }));

/** Casey's first day: a paper account linked this morning, no bot, nothing written. */
const FIRST_DAY = [
  {
    id: "first-board",
    label: "first day: the Board and its calendar",
    route: BOARD,
    expect: [role("heading", "R&D", { exact: true }), ...calendarHead],
  },
  {
    id: "first-coverage",
    label: "first day: Coverage priced through the new account, nothing held",
    route: COVERAGE,
    expect: [text("Holdings: 0 of 11 sectors"), off(NO_FUNDS)],
  },
  {
    id: "first-playbooks",
    label: "first day: Playbooks, nothing to write or subscribe without a bot",
    route: PLAYBOOKS,
    expect: [
      role("heading", "Ready for a bot · 6"),
      role("button", "New playbook", { exact: true }),
      text("A playbook runs on a bot, and you don't have one yet."),
      text("none of yours runs one yet"),
    ],
  },
].map((s) => ({ viewer: "casey", ...s }));

/** The surfaces for one world. */
export function rdSurfaces(kind) {
  if (kind === "today") return [...OWNER, ...FRIEND, ...WATCHER];
  if (kind === "own-views") return OWN_VIEWS;
  if (kind === "first-day") return FIRST_DAY;
  throw new Error(`rd surfaces: no world kind ${kind}`);
}
